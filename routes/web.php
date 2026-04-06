<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FlatController;
use App\Http\Controllers\Admin\UserController;
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

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('/flats', [FlatController::class, 'index'])->name('flats.index');
    Route::get('/flats/export', [FlatController::class, 'export'])->name('flats.export');
    Route::post('/flats/import', [FlatController::class, 'import'])->name('flats.import');
    Route::post('/flats', [FlatController::class, 'store'])->name('flats.store');
    Route::patch('/flats/{flat}', [FlatController::class, 'update'])->name('flats.update');
    Route::patch('/flats/bulk/hide', [FlatController::class, 'bulkHide'])->name('flats.bulkHide');
    Route::patch('/flats/bulk/sold', [FlatController::class, 'bulkMarkSold'])->name('flats.bulkMarkSold');
    Route::delete('/flats/bulk', [FlatController::class, 'bulkDestroy'])->name('flats.bulkDestroy');
    Route::patch('/flats/{flat}/hide', [FlatController::class, 'hide'])->name('flats.hide');
    Route::patch('/flats/{flat}/sold', [FlatController::class, 'markSold'])->name('flats.markSold');
    Route::delete('/flats/{flat}', [FlatController::class, 'destroy'])->name('flats.destroy');
    Route::delete('/flats', [FlatController::class, 'destroyAll'])->name('flats.destroyAll');
});

require __DIR__.'/auth.php';