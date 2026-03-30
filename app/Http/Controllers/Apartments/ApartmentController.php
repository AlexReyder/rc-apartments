<?php

namespace App\Http\Controllers\Apartments;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ApartmentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Apartments/Index');
    }

    public function show(string $flat): Response
    {
        return Inertia::render('Apartments/Show', [
            'slug' => $flat,
        ]);
    }
}