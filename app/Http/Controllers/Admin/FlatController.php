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

        if (! in_array($perPage, [10, 20, 30, 50], true)) {
            $perPage = 10;
        }

        if (! in_array($sortBy, ['id', 'building', 'floor', 'number', 'rooms_number', 'price'], true)) {
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

        return Inertia::render('Admin/Flats/Index', [
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
                'sortBy' => $sortBy,
                'sortDirection' => $sortDirection,
            ],
            'flats' => $flats,
        ]);
    }
}