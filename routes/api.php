<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SaleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('api.v1.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('api.v1.logout');
        Route::get('me', [AuthController::class, 'me'])->name('api.v1.me');

        Route::get('products', [ProductController::class, 'index'])->name('api.v1.products.index');

        Route::get('sales', [SaleController::class, 'index'])->name('api.v1.sales.index');
        Route::post('sales', [SaleController::class, 'store'])->name('api.v1.sales.store');
        Route::get('sales/{sale}', [SaleController::class, 'show'])->name('api.v1.sales.show');
    });
});
