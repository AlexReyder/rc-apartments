<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

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
            ->through(fn (Flat $flat) => [
                'id' => $flat->id,
                'slug' => $flat->slug,
                'building' => $flat->building,
                'entrance' => $flat->entrance_number,
                'floor' => $flat->floor,
                'number' => $flat->number,
                'rooms' => $flat->rooms_number,
                'square' => $flat->square,
                'price' => $flat->price,
                'sold' => (int) $flat->sold,
                'plan' => $flat->plan,
                'finishing' => $flat->finishing,
            ]);

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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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
            'finishing' => ['required', 'string', 'max:255'],
            'finish_date' => ['required', 'date'],
            'status' => ['required', Rule::in(['available', 'sold', 'hidden'])],
            'apartment_plan' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
            'floor_plan' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
        ]);

        $apartmentPlanPath = $request->file('apartment_plan')?->store('apartments/plans', 'public');
        $floorPlanPath = $request->file('floor_plan')?->store('apartments/floors', 'public');

        $building = (int) $validated['building'];
        $floor = (int) $validated['floor'];
        $entrance = (int) $validated['entrance_number'];
        $number = (int) $validated['number'];
        $rooms = (int) $validated['rooms_number'];
        $square = round((float) $validated['square'], 2);
        $livingSquare = round((float) $validated['living_square'], 2);
        $ceilingHeight = round((float) $validated['ceiling_height'], 2);
        $priceM2 = (int) $validated['price_m2'];
        $price = (int) $validated['price'];
        $finishDate = $validated['finish_date'];
        $finishing = trim((string) $validated['finishing']);

        $soldStatus = match ($validated['status']) {
            'available' => 0,
            'sold' => 1,
            'hidden' => 2,
        };

        $flat = Flat::query()->create([
            'rooms_number' => $rooms,
            'rooms_number_true' => $rooms,
            'floor' => $floor,
            'square' => $square,
            'created_at' => now(),
            'updated_at' => now(),
            'entrance_number' => $entrance,
            'living_square' => $livingSquare,
            'ceiling_height' => $ceilingHeight,
            'plan' => $apartmentPlanPath ? 'storage/'.$apartmentPlanPath : null,
            'sold' => $soldStatus,
            'building' => $building,
            'number' => $number,
            'price' => $price,
            'price_m2' => $priceM2,
            'floor_position' => $floorPlanPath ? 'storage/'.$floorPlanPath : null,
            'finish_date' => $finishDate,
            'finishing' => $finishing,
            'action' => 0,
            'action_price_m2' => 0,
            'title' => $this->makeTitle($building, $number),
            'description' => $this->makeDescription(
                $building,
                $number,
                $entrance,
                $floor,
                $rooms,
                $square,
            ),
        ]);

        return back()
            ->with('success', 'Квартира успешно добавлена.')
            ->with('createdFlat', [
                'id' => $flat->id,
                'slug' => $flat->slug,
            ]);
    }

    private function makeTitle(int $building, int $number): string
    {
        return sprintf(
            'Квартира в ЖК «Орловский Бульвар», Гатчина. Корпус: %d. Номер: %d',
            $building,
            $number,
        );
    }

    private function makeDescription(
        int $building,
        int $number,
        int $entrance,
        int $floor,
        int $rooms,
        float $square,
    ): string {
        return sprintf(
            'Квартира в ЖК «Орловский Бульвар», Гатчина. Корпус: %d. Номер: %d. Подъезд: %d. Этаж: %d. Количество комнат: %d. Площадь: %.2f. Подробности на сайте',
            $building,
            $number,
            $entrance,
            $floor,
            $rooms,
            $square,
        );
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
}