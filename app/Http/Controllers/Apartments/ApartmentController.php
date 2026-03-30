<?php

namespace App\Http\Controllers\Apartments;

use App\Http\Controllers\Controller;
use App\Models\Flat;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('perPage', 10);

        if (! in_array($perPage, [10, 20, 30, 50], true)) {
            $perPage = 10;
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
            ->orderByDesc('id')
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

        return Inertia::render('Apartments/Index', [
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
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
}