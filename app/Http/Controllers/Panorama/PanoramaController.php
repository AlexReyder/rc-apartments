<?php

namespace App\Http\Controllers\Panorama;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PanoramaController extends Controller
{
    public function buildings(): Response
    {
        return Inertia::render('Panorama/Buildings');
    }

    public function floors(string $building): Response
    {
        return Inertia::render('Panorama/Floors', [
            'buildingSlug' => $building,
        ]);
    }

    public function plan(string $building, string $floor): Response
    {
        return Inertia::render('Panorama/Plan', [
            'buildingSlug' => $building,
            'floorSlug' => $floor,
        ]);
    }
}