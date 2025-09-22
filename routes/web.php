<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('landing');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Dashboard API routes
    Route::get('api/dashboard/stats', [App\Http\Controllers\ChatController::class, 'getDashboardStats'])->name('dashboard.stats');

    // Chat routes
    Route::prefix('chat')->name('chat.')->group(function () {
        Route::get('/', [App\Http\Controllers\ChatController::class, 'index'])->name('index');
        Route::post('/', [App\Http\Controllers\ChatController::class, 'store'])->name('store');
        Route::get('/{session}', [App\Http\Controllers\ChatController::class, 'show'])->name('show');
        Route::post('/{session}/message', [App\Http\Controllers\ChatController::class, 'sendMessage'])->name('send-message');
        Route::patch('/{session}/toggle-sharing', [App\Http\Controllers\ChatController::class, 'toggleSharing'])->name('toggle-sharing');
        Route::delete('/{session}', [App\Http\Controllers\ChatController::class, 'destroy'])->name('destroy');
    });

    // User management routes (superadmin only)
    Route::resource('users', App\Http\Controllers\UserController::class);
    
    // Migrate refresh route (superadmin only)
    Route::post('/migrate-refresh', [App\Http\Controllers\UserController::class, 'migrateRefresh'])->name('migrate.refresh');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
