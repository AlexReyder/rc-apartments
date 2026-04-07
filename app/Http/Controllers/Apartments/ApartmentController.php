<?php

namespace App\Http\Controllers\Apartments;

use App\Http\Controllers\Controller;
use App\Models\Flat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $rooms = $this->sanitizeIntegerList($request->input('rooms', []));
        $buildings = $this->sanitizeIntegerList($request->input('building', []));
        $priceFrom = $this->sanitizeNullableInteger($request->input('priceFrom'));
        $priceTo = $this->sanitizeNullableInteger($request->input('priceTo'));
        $areaFrom = $this->sanitizeNullableFloat($request->input('areaFrom'));
        $areaTo = $this->sanitizeNullableFloat($request->input('areaTo'));
        $floorFrom = $this->sanitizeNullableInteger($request->input('floorFrom'));
        $floorTo = $this->sanitizeNullableInteger($request->input('floorTo'));
        $sortBy = (string) $request->string('sortBy', 'price');
        $sortDirection = (string) $request->string('sortDirection', 'asc');
        $view = (string) $request->string('view', 'list');

        if (! in_array($sortBy, ['price', 'square', 'floor'], true)) {
            $sortBy = 'price';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        if (! in_array($view, ['list', 'grid'], true)) {
            $view = 'list';
        }

        [$priceFrom, $priceTo] = $this->normalizeIntegerRange($priceFrom, $priceTo);
        [$areaFrom, $areaTo] = $this->normalizeFloatRange($areaFrom, $areaTo);
        [$floorFrom, $floorTo] = $this->normalizeIntegerRange($floorFrom, $floorTo);

        $availableFlatsQuery = Flat::query()->where('sold', 0);

        $aggregates = (clone $availableFlatsQuery)
            ->selectRaw('MIN(price) as min_price, MAX(price) as max_price, MIN(square) as min_area, MAX(square) as max_area, MIN(floor) as min_floor, MAX(floor) as max_floor')
            ->first();

        $filterMeta = [
            'minPrice' => isset($aggregates?->min_price) ? (int) $aggregates->min_price : 0,
            'maxPrice' => isset($aggregates?->max_price) ? (int) $aggregates->max_price : 0,
            'minArea' => isset($aggregates?->min_area) ? round((float) $aggregates->min_area, 1) : 0,
            'maxArea' => isset($aggregates?->max_area) ? round((float) $aggregates->max_area, 1) : 0,
            'minFloor' => isset($aggregates?->min_floor) ? (int) $aggregates->min_floor : 0,
            'maxFloor' => isset($aggregates?->max_floor) ? (int) $aggregates->max_floor : 0,
            'rooms' => (clone $availableFlatsQuery)
                ->selectRaw('COALESCE(rooms_number_true, rooms_number) as public_rooms')
                ->distinct()
                ->orderBy('public_rooms')
                ->pluck('public_rooms')
                ->map(fn ($value) => (int) $value)
                ->values()
                ->all(),
            'buildings' => (clone $availableFlatsQuery)
                ->distinct()
                ->orderBy('building')
                ->pluck('building')
                ->map(fn ($value) => (int) $value)
                ->values()
                ->all(),
        ];

       $flats = Flat::query()
    ->where('sold', 0)
    ->select([
        'id',
        'building',
        'entrance_number',
        'floor',
        'number',
        'rooms_number',
        'rooms_number_true',
        'square',
        'price',
        'price_m2',
        'finishing',
        'plan',
    ])
    ->applyAttributeFilters($buildings, [], $rooms);

        $this->applyRangeFilter($flats, 'price', $priceFrom, $priceTo);
        $this->applyRangeFilter($flats, 'square', $areaFrom, $areaTo);
        $this->applyRangeFilter($flats, 'floor', $floorFrom, $floorTo);

        $flats = $flats
            ->orderBy($sortBy, $sortDirection)
            ->orderBy('id')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Flat $flat) => $this->transformFlatForCatalog($flat));

        return Inertia::render('Apartments/Index', [
            'filters' => [
                'rooms' => $rooms,
                'building' => $buildings,
                'priceFrom' => $priceFrom,
                'priceTo' => $priceTo,
                'areaFrom' => $areaFrom,
                'areaTo' => $areaTo,
                'floorFrom' => $floorFrom,
                'floorTo' => $floorTo,
                'sortBy' => $sortBy,
                'sortDirection' => $sortDirection,
                'view' => $view,
            ],
            'filterMeta' => $filterMeta,
            'flats' => $flats,
        ]);
    }

    public function show(string $slug): Response
    {
        $parts = Flat::parseSlug($slug);

        $flat = Flat::query()
            ->where('building', $parts['building'])
            ->where('floor', $parts['floor'])
            ->where('number', $parts['number'])
            ->firstOrFail();

        return Inertia::render('Apartments/Show', [
            'flat' => [
                'id' => $flat->id,
                'slug' => $flat->slug,
                'building' => $flat->building,
                'floor' => $flat->floor,
                'number' => $flat->number,
                'rooms' => $flat->rooms_number,
                'square' => $flat->square,
                'price' => $flat->price,
                'sold' => $flat->sold,
                'title' => $flat->title,
                'description' => $flat->description,
                'finishDate' => $flat->finish_date,
                'finishing' => $flat->finishing,
                'floorPosition' => $flat->floor_position,
            ],
        ]);
    }

   private function transformFlatForCatalog(Flat $flat): array
{
    $rooms = $flat->rooms_number_true !== null
        ? (int) $flat->rooms_number_true
        : (int) $flat->rooms_number;

    return [
        'id' => (int) $flat->id,
        'slug' => $flat->slug,
        'number' => (int) $flat->number,
        'building' => (int) $flat->building,
        'entrance' => $flat->entrance_number !== null ? (int) $flat->entrance_number : null,
        'floor' => (int) $flat->floor,
        'rooms' => $rooms,
        'square' => (float) $flat->square,
        'price' => (int) $flat->price,
        'pricePerMeter' => (int) $flat->price_m2,
        'finishing' => $flat->finishing,
        'plan' => $flat->plan ? asset(ltrim($flat->plan, '/')) : null,
    ];
}

    private function applyRangeFilter(Builder $query, string $column, int|float|null $from, int|float|null $to): void
    {
        if ($from !== null) {
            $query->where($column, '>=', $from);
        }

        if ($to !== null) {
            $query->where($column, '<=', $to);
        }
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

    private function sanitizeNullableInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            $value = preg_replace('/[^\d\-]/', '', $value);
        }

        if ($value === '' || ! is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }

    private function sanitizeNullableFloat(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            $value = str_replace(',', '.', $value);
            $value = preg_replace('/[^\d.\-]/', '', $value);
        }

        if ($value === '' || ! is_numeric($value)) {
            return null;
        }

        return round((float) $value, 1);
    }

    private function normalizeIntegerRange(?int $from, ?int $to): array
    {
        if ($from !== null && $to !== null && $from > $to) {
            return [$to, $from];
        }

        return [$from, $to];
    }

    private function normalizeFloatRange(?float $from, ?float $to): array
    {
        if ($from !== null && $to !== null && $from > $to) {
            return [$to, $from];
        }

        return [$from, $to];
    }
}