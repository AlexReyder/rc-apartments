<?php

namespace App\Http\Controllers\Admin;

use App\Exports\FlatsExport;
use App\Http\Controllers\Controller;
use App\Models\Flat;
use App\Services\Admin\Flats\FlatPayloadBuilder;
use App\Services\Admin\Flats\Imports\UpdateFlatsFromExcelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class FlatController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('perPage', 10);
        $sortBy = (string) $request->string('sortBy', 'id');
        $sortDirection = (string) $request->string('sortDirection', 'desc');
        $view = (string) $request->string('view', 'table');

        $building = $this->sanitizeIntegerList($request->input('building', []));
        $floor = $this->sanitizeIntegerList($request->input('floor', []));
        $rooms = $this->sanitizeIntegerList($request->input('rooms', []));

        if (! in_array($perPage, [10, 20, 30, 50, 100], true)) {
            $perPage = 10;
        }

        if (! in_array($sortBy, ['id', 'building', 'floor', 'number', 'rooms_number', 'square', 'price', 'sold'], true)) {
            $sortBy = 'id';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        if (! in_array($view, ['table', 'list'], true)) {
            $view = 'table';
        }

        $flats = Flat::query()
            ->select('*')
            ->applySearch($search)
            ->applyAttributeFilters($building, $floor, $rooms)
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Flat $flat) => $this->transformFlatForAdmin($flat));

        return Inertia::render('Admin/Flats/Index', [
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
                'sortBy' => $sortBy,
                'sortDirection' => $sortDirection,
                'view' => $view,
                'building' => $building,
                'floor' => $floor,
                'rooms' => $rooms,
            ],
            'filterOptions' => [
                'building' => $this->distinctIntegerValues('building'),
                'floor' => $this->distinctIntegerValues('floor'),
                'rooms' => $this->distinctIntegerValues('rooms_number'),
            ],
            'flats' => $flats,
        ]);
    }

    public function export(): BinaryFileResponse
    {
        $fileName = 'Квартиры-'.now()->format('Y-m-d_H-i').'.xlsx';

        return Excel::download(new FlatsExport(), $fileName);
    }

    public function import(Request $request, UpdateFlatsFromExcelService $service): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:20480'],
            'dry_run' => ['nullable', 'boolean'],
        ]);

        try {
            $result = $service->handle(
                file: $validated['file'],
                dryRun: $request->boolean('dry_run'),
            );

            $redirect = back()->with('importResult', $result);

            if ($result['fatalError']) {
                return $redirect->with('error', $result['fatalError']);
            }

            $message = $result['isDryRun']
                ? "Проверка завершена: будет обновлено {$result['updatedRows']}, без изменений {$result['skippedRows']}, ошибок {$result['errorRows']}."
                : "Импорт завершён: обновлено {$result['updatedRows']}, без изменений {$result['skippedRows']}, ошибок {$result['errorRows']}.";

            return $redirect->with('success', $message);
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось выполнить импорт квартир. Попробуйте снова.');
        }
    }

    public function store(Request $request, FlatPayloadBuilder $payloadBuilder): RedirectResponse
    {
        $validated = $request->validate($this->flatValidationRules());

        try {
            $apartmentPlanPath = $request->file('apartment_plan')?->store('apartments/plans', 'public');
            $floorPlanPath = $request->file('floor_plan')?->store('apartments/floors', 'public');

            $flat = Flat::query()->create($payloadBuilder->build(
                validated: $validated,
                apartmentPlanPath: $apartmentPlanPath ? 'storage/'.$apartmentPlanPath : null,
                floorPlanPath: $floorPlanPath ? 'storage/'.$floorPlanPath : null,
            ));

            return back()
                ->with('success', 'Квартира успешно добавлена.')
                ->with('createdFlat', [
                    'id' => $flat->id,
                    'slug' => $flat->slug,
                ]);
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось добавить квартиру. Попробуйте снова.');
        }
    }

    public function update(Request $request, Flat $flat, FlatPayloadBuilder $payloadBuilder): RedirectResponse
    {
        $validated = $request->validate($this->flatValidationRules(true));

        try {
            $nextApartmentPlanPath = $flat->plan;
            $nextFloorPlanPath = $flat->floor_position;
            $filesToDelete = [];

            if ($request->hasFile('apartment_plan')) {
                $storedApartmentPlan = $request->file('apartment_plan')?->store('apartments/plans', 'public');

                if ($storedApartmentPlan) {
                    $filesToDelete[] = $this->normalizePublicStoragePath($flat->plan);
                    $nextApartmentPlanPath = 'storage/'.$storedApartmentPlan;
                }
            } elseif ($request->boolean('remove_apartment_plan')) {
                $filesToDelete[] = $this->normalizePublicStoragePath($flat->plan);
                $nextApartmentPlanPath = null;
            }

            if ($request->hasFile('floor_plan')) {
                $storedFloorPlan = $request->file('floor_plan')?->store('apartments/floors', 'public');

                if ($storedFloorPlan) {
                    $filesToDelete[] = $this->normalizePublicStoragePath($flat->floor_position);
                    $nextFloorPlanPath = 'storage/'.$storedFloorPlan;
                }
            } elseif ($request->boolean('remove_floor_plan')) {
                $filesToDelete[] = $this->normalizePublicStoragePath($flat->floor_position);
                $nextFloorPlanPath = null;
            }

            $flat->forceFill($payloadBuilder->build(
                validated: $validated,
                apartmentPlanPath: $nextApartmentPlanPath,
                floorPlanPath: $nextFloorPlanPath,
                isUpdate: true,
            ))->save();

            $this->deletePublicFiles($filesToDelete);

            return back()->with('success', 'Квартира успешно обновлена.');
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось обновить квартиру. Попробуйте снова.');
        }
    }

    public function hide(Flat $flat): RedirectResponse
    {
        try {
            if ((int) $flat->sold === 2) {
                return back()->with('success', 'Квартира уже скрыта.');
            }

            $flat->forceFill([
                'sold' => 2,
                'updated_at' => now(),
            ])->save();

            return back()->with('success', 'Квартира скрыта.');
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось скрыть квартиру. Попробуйте снова.');
        }
    }

    public function markSold(Flat $flat): RedirectResponse
    {
        try {
            if ((int) $flat->sold === 1) {
                return back()->with('success', 'Квартира уже отмечена как проданная.');
            }

            $flat->forceFill([
                'sold' => 1,
                'updated_at' => now(),
            ])->save();

            return back()->with('success', 'Квартира отмечена как проданная.');
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось отметить квартиру как проданную. Попробуйте снова.');
        }
    }

    public function destroy(Flat $flat): RedirectResponse
    {
        try {
            $filesToDelete = [
                $this->normalizePublicStoragePath($flat->plan),
                $this->normalizePublicStoragePath($flat->floor_position),
            ];

            DB::connection('mysql')->transaction(function () use ($flat) {
                $flat->delete();
            });

            $this->deletePublicFiles($filesToDelete);

            return back()->with('success', 'Квартира удалена.');
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось удалить квартиру. Попробуйте снова.');
        }
    }

    public function bulkHide(Request $request): RedirectResponse
    {
        $ids = $this->validateBulkIds($request);

        if ($ids === []) {
            return back()->with('error', 'Не выбраны квартиры для скрытия.');
        }

        try {
            $updatedCount = Flat::query()
                ->whereIn('id', $ids)
                ->where('sold', '!=', 2)
                ->update([
                    'sold' => 2,
                    'updated_at' => now(),
                ]);

            if ($updatedCount === 0) {
                return back()->with('success', 'Все выбранные квартиры уже скрыты.');
            }

            return back()->with('success', "Скрыто квартир: {$updatedCount}");
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось скрыть выбранные квартиры. Попробуйте снова.');
        }
    }

    public function bulkMarkSold(Request $request): RedirectResponse
    {
        $ids = $this->validateBulkIds($request);

        if ($ids === []) {
            return back()->with('error', 'Не выбраны квартиры для отметки как проданные.');
        }

        try {
            $updatedCount = Flat::query()
                ->whereIn('id', $ids)
                ->where('sold', '!=', 1)
                ->update([
                    'sold' => 1,
                    'updated_at' => now(),
                ]);

            if ($updatedCount === 0) {
                return back()->with('success', 'Все выбранные квартиры уже отмечены как проданные.');
            }

            return back()->with('success', "Отмечено как проданные: {$updatedCount}");
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось отметить выбранные квартиры как проданные. Попробуйте снова.');
        }
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = $this->validateBulkIds($request);

        if ($ids === []) {
            return back()->with('error', 'Не выбраны квартиры для удаления.');
        }

        try {
            $flats = Flat::query()
                ->whereIn('id', $ids)
                ->get(['id', 'plan', 'floor_position']);

            if ($flats->isEmpty()) {
                return back()->with('error', 'Квартиры для удаления не найдены.');
            }

            $filesToDelete = $flats
                ->flatMap(function (Flat $flat) {
                    return [
                        $this->normalizePublicStoragePath($flat->plan),
                        $this->normalizePublicStoragePath($flat->floor_position),
                    ];
                })
                ->filter()
                ->unique()
                ->values()
                ->all();

            $deletedCount = 0;

            DB::connection('mysql')->transaction(function () use ($ids, &$deletedCount) {
                $deletedCount = Flat::query()
                    ->whereIn('id', $ids)
                    ->delete();
            });

            $this->deletePublicFiles($filesToDelete);

            return back()->with('success', "Удалено квартир: {$deletedCount}");
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Не удалось удалить выбранные квартиры. Попробуйте снова.');
        }
    }

    public function destroyAll(): RedirectResponse
    {
        try {
            $filesToDelete = Flat::query()
                ->select(['plan', 'floor_position'])
                ->get()
                ->flatMap(function (Flat $flat) {
                    return [
                        $this->normalizePublicStoragePath($flat->plan),
                        $this->normalizePublicStoragePath($flat->floor_position),
                    ];
                })
                ->filter()
                ->unique()
                ->values()
                ->all();

            $deletedCount = 0;

            DB::connection('mysql')->transaction(function () use (&$deletedCount) {
                $deletedCount = Flat::query()->count();
                Flat::query()->delete();
            });

            if ($filesToDelete !== []) {
                Storage::disk('public')->delete($filesToDelete);
            }

            return redirect()
                ->route('admin.flats.index')
                ->with('success', "Удалено квартир: {$deletedCount}");
        } catch (Throwable $e) {
            report($e);

            return redirect()
                ->route('admin.flats.index')
                ->with('error', 'Не удалось удалить все квартиры. Попробуйте снова.');
        }
    }

    private function flatValidationRules(bool $includeRemoveFlags = false): array
    {
        $rules = [
            'building' => ['required', 'integer', 'min:1'],
            'floor' => ['required', 'integer', 'min:1'],
            'entrance_number' => ['required', 'integer', 'min:1'],
            'number' => ['required', 'integer', 'min:1'],
            'rooms_number' => ['required', 'integer', Rule::in([0, 1, 2, 3, 4])],
            'square' => ['required', 'numeric', 'min:0'],
            'living_square' => ['required', 'numeric', 'min:0'],
            'ceiling_height' => ['required', 'numeric', 'min:0'],
            'price_m2' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'action' => ['required', 'boolean'],
            'action_price_m2' => [
                'nullable',
                'integer',
                'min:0',
                Rule::requiredIf(request()->boolean('action')),
            ],
            'finishing' => ['required', 'string', 'max:255'],
            'finish_date' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::in(['available', 'sold', 'hidden'])],
            'apartment_plan' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
            'floor_plan' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
        ];

        if ($includeRemoveFlags) {
            $rules['remove_apartment_plan'] = ['nullable', 'boolean'];
            $rules['remove_floor_plan'] = ['nullable', 'boolean'];
        }

        return $rules;
    }

    private function transformFlatForAdmin(Flat $flat): array
    {
        return [
            'id' => $flat->id,
            'slug' => $flat->slug,
            'building' => (int) $flat->building,
            'entrance' => $flat->entrance_number !== null ? (int) $flat->entrance_number : null,
            'floor' => (int) $flat->floor,
            'number' => (int) $flat->number,
            'rooms' => (int) $flat->rooms_number,
            'square' => (float) $flat->square,
            'price' => (int) $flat->price,
            'price_m2' => $flat->price_m2 !== null ? (int) $flat->price_m2 : null,
            'action' => isset($flat->action) ? (int) $flat->action : 0,
            'action_price_m2' => $flat->action_price_m2 !== null ? (int) $flat->action_price_m2 : null,
            'display_price' => $this->resolveDisplayPrice($flat),
            'display_price_m2' => $this->resolveDisplayPricePerSquare($flat),
            'sold' => (int) $flat->sold,
            'plan' => $flat->plan,
            'floor_plan' => $flat->floor_position,
            'finishing' => $flat->finishing,
            'living_square' => $flat->living_square !== null ? (float) $flat->living_square : null,
            'ceiling_height' => $flat->ceiling_height !== null ? (float) $flat->ceiling_height : null,
            'finish_date' => $flat->finish_date,
        ];
    }

    private function resolveDisplayPrice(Flat $flat): int
    {
        if ((int) ($flat->action ?? 0) === 1) {
            return $this->calculateTotalPrice(
                (int) ($flat->action_price_m2 ?? 0),
                (float) $flat->square,
            );
        }

        return (int) $flat->price;
    }

    private function resolveDisplayPricePerSquare(Flat $flat): ?int
    {
        if ((int) ($flat->action ?? 0) === 1) {
            return isset($flat->action_price_m2) ? (int) $flat->action_price_m2 : null;
        }

        return $flat->price_m2 !== null ? (int) $flat->price_m2 : null;
    }

    private function calculateTotalPrice(int $pricePerSquare, float $square): int
    {
        return (int) round($pricePerSquare * $square);
    }

    private function validateBulkIds(Request $request): array
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'min:1', 'distinct'],
        ]);

        return collect($validated['ids'])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function deletePublicFiles(array $paths): void
    {
        $paths = collect($paths)
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($paths !== []) {
            Storage::disk('public')->delete($paths);
        }
    }

    private function distinctIntegerValues(string $column): array
    {
        return Flat::query()
            ->whereNotNull($column)
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->map(fn ($value) => (int) $value)
            ->values()
            ->all();
    }

    private function sanitizeIntegerList(mixed $values): array
    {
        $values = is_array($values) ? $values : [$values];

        return collect($values)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => (int) $value)
            ->filter(fn (int $value) => $value >= 0)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    private function normalizePublicStoragePath(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $normalized = ltrim($path, '/');

        if (str_starts_with($normalized, 'storage/')) {
            return substr($normalized, strlen('storage/'));
        }

        return $normalized;
    }
}