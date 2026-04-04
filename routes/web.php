<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FlatController;
use App\Http\Controllers\Apartments\ApartmentController;
use App\Http\Controllers\Panorama\PanoramaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    abort(404);
});

Route::prefix('apartments')->name('apartments.')->group(function () {
    Route::get('/', [ApartmentController::class, 'index'])->name('index');
    Route::get('/{slug}', [ApartmentController::class, 'show'])->name('show');
});

Route::prefix('3dpanorama')->name('panorama.')->group(function () {
    Route::get('/', [PanoramaController::class, 'buildings'])->name('buildings');
    Route::get('/{buildingSlug}', [PanoramaController::class, 'floors'])->name('floors');
    Route::get('/{buildingSlug}/{floorSlug}', [PanoramaController::class, 'plan'])->name('plan');
});

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/flats', [FlatController::class, 'index'])->name('flats.index');
    Route::post('/flats', [FlatController::class, 'store'])->name('flats.store');
});

require __DIR__.'/auth.php';