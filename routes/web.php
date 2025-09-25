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
        Route::delete('/bulk-delete', [App\Http\Controllers\ChatController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{session}', [App\Http\Controllers\ChatController::class, 'show'])->name('show');
        Route::post('/{session}/message', [App\Http\Controllers\ChatController::class, 'sendMessage'])->middleware('large-uploads')->name('send-message');
        Route::patch('/{session}/toggle-sharing', [App\Http\Controllers\ChatController::class, 'toggleSharing'])->name('toggle-sharing');
        Route::delete('/{session}', [App\Http\Controllers\ChatController::class, 'destroy'])->name('destroy');
    });

    // Excel analysis routes
    Route::prefix('excel')->middleware(['auth', 'role:esr'])->name('excel.')->group(function () {
        Route::get('/analysis', [App\Http\Controllers\ExcelController::class, 'showAnalysis'])->name('analysis');
        Route::get('/analyze-template', [App\Http\Controllers\ExcelController::class, 'analyzeTemplate'])->name('analyze-template');
        Route::post('/copy-template', [App\Http\Controllers\ExcelController::class, 'copyTemplate'])->name('copy-template');
        Route::post('/process-photos', [App\Http\Controllers\ExcelController::class, 'processPhotos'])->middleware('large-uploads')->name('process-photos');
        Route::post('/process-photos-async', [App\Http\Controllers\ExcelController::class, 'processPhotosAsync'])->middleware('large-uploads')->name('process-photos-async');
        Route::post('/process-photos-local-async', [App\Http\Controllers\ExcelController::class, 'processPhotosLocalAsync'])->middleware('large-uploads')->name('process-photos-local-async');
        

        Route::get('/progress', [App\Http\Controllers\ExcelController::class, 'getProgress'])->name('progress');
        Route::get('/job-progress/{jobId}', [App\Http\Controllers\ExcelController::class, 'getJobProgress'])->name('job-progress');
        Route::post('/cancel-job/{jobId}', [App\Http\Controllers\ExcelController::class, 'cancelJob'])->name('cancel-job');
        Route::get('/photo-organizer', [App\Http\Controllers\ExcelController::class, 'showPhotoOrganizer'])->name('photo-organizer');
        Route::get('/download/{filename}', [App\Http\Controllers\ExcelController::class, 'downloadResult'])->name('download');
    });

    // User management routes (superadmin only)
    Route::resource('users', App\Http\Controllers\UserController::class);
    
    // Migrate refresh route (superadmin only)
    Route::post('/migrate-refresh', [App\Http\Controllers\UserController::class, 'migrateRefresh'])->name('migrate.refresh');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
