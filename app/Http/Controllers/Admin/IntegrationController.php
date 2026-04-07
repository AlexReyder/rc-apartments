<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Integration/Index', [
            'integrations' => [
                [
                    'key' => 'domclick',
                    'name' => 'ДомКлик',
                    'description' => 'Экспорт квартир в XML-формат для ДомКлик.',
                    'logo_text' => 'ДК',
                    'download_enabled' => false,
                    'publish_enabled' => false,
                ],
            ],
        ]);
    }
}