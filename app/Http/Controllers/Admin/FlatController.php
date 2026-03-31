<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flat;
use Illuminate\Http\Request;
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

        $flats = Flat::query()
            ->select([
                'id',
                'building',
                'floor',
                'number',
                'rooms_number',
                'square',
                'price',
                'sold',
            ])
            ->applySearch($search)
            ->applyAttributeFilters($building, $floor, $rooms)
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Flat $flat) => [
                'id' => $flat->id,
                'slug' => $flat->slug,
                'building' => $flat->building,
                'floor' => $flat->floor,
                'number' => $flat->number,
                'rooms' => $flat->rooms_number,
                'square' => $flat->square,
                'price' => $flat->price,
                'sold' => $flat->sold,
            ]);

        return Inertia::render('admin/flats/index', [
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
                'sortBy' => $sortBy,
                'sortDirection' => $sortDirection,
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