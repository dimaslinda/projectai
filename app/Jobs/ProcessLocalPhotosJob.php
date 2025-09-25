<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\ExcelProcessor;
use App\Services\ExcelAnalyzer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessLocalPhotosJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900; // 15 menit timeout untuk konsistensi dengan ExcelProcessor
    public $tries = 3;
    public $maxExceptions = 3;

    protected $storedFiles;
    protected $templateFilename;
    protected $jobId;
    protected $userId;

    /**
     * Create a new job instance.
     */
    public function __construct($storedFiles, $templateFilename, $jobId, $userId = null)
    {
        $this->storedFiles = $storedFiles;
        $this->templateFilename = $templateFilename;
        $this->jobId = $jobId;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(ExcelProcessor $processor, ExcelAnalyzer $analyzer)
    {
        $startTime = microtime(true);
        
        try {
            Log::info("Starting ProcessLocalPhotosJob for job ID: {$this->jobId}");
            
            $totalFiles = count($this->storedFiles);
            $this->updateProgress(0, $totalFiles, 'Memulai pemrosesan file lokal...');

            // Validate all files exist
            foreach ($this->storedFiles as $index => $fileInfo) {
                if (!file_exists($fileInfo['path'])) {
                    throw new \Exception("File tidak ditemukan: {$fileInfo['original_name']}");
                }
            }

            // Analisis template untuk mapping
            $templatePath = public_path('asset/contoh/ESR.xlsx');
            $templateAnalysis = $analyzer->analyzeStructure();
            
            $this->updateProgress(1, $totalFiles, 'Menganalisis template Excel...');

            // Process local files dengan progress callback
            $progressCallback = function($current, $total, $message = '') {
                $this->updateProgress($current, $total, $message);
            };

            // Convert file paths to URLs for processing
            $photoData = [];
            foreach ($this->storedFiles as $index => $fileInfo) {
                $photoData[] = [
                    'path' => $fileInfo['path'],
                    'name' => $fileInfo['original_name'],
                    'size' => $fileInfo['size'],
                    'mime_type' => $fileInfo['mime_type']
                ];
            }

            $results = $processor->processLocalPhotos($photoData, $templateAnalysis, $progressCallback);

            $this->updateProgress($totalFiles - 1, $totalFiles, 'Menyimpan file Excel...');

            // Simpan file Excel dengan foto
            $saveResult = $processor->saveExcelWithPhotos($results['spreadsheet']);
             
            if ($saveResult['success']) {
                $this->updateProgress($totalFiles, $totalFiles, 'Proses selesai');
                
                // Store final result
                Cache::put("job_result_{$this->jobId}", [
                    'success' => true,
                    'message' => 'File lokal berhasil diproses dan file Excel telah dibuat',
                    'download_url' => $saveResult['download_url'],
                    'filename' => $saveResult['filename'],
                    'processed_photos' => $results['processed_photos'],
                    'total_processed' => count($results['processed_photos']),
                    'successful_placements' => count(array_filter($results['processed_photos'], fn($r) => $r['success'])),
                    'processing_time' => microtime(true) - $startTime
                ], 3600); // Cache for 1 hour

                // Cleanup temporary files
                $this->cleanupTempFiles();
                
                Log::info("ProcessLocalPhotosJob completed successfully for job ID: {$this->jobId}");
            } else {
                throw new \Exception('Gagal menyimpan file Excel: ' . ($saveResult['error'] ?? 'Unknown error'));
            }
            
        } catch (\Exception $e) {
            Log::error("ProcessLocalPhotosJob failed for job ID: {$this->jobId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $this->updateProgress(0, 100, 'Error: ' . $e->getMessage(), 'failed');
            
            // Store error result
            Cache::put("job_result_{$this->jobId}", [
                'success' => false,
                'error' => $e->getMessage(),
                'processing_time' => microtime(true) - $startTime
            ], 3600);

            // Cleanup temporary files even on failure
            $this->cleanupTempFiles();
            
            throw $e;
        }
    }

    /**
     * Update job progress
     */
    private function updateProgress($current, $total, $message, $status = 'processing')
    {
        $progress = $total > 0 ? ($current / $total) * 100 : 0;
        
        $progressData = [
            'progress' => $progress,
            'status' => $status,
            'current_step' => $message,
            'total_photos' => $total,
            'processed_photos' => $current,
            'job_id' => $this->jobId,
            'updated_at' => now()->toISOString()
        ];

        if ($status === 'processing' && $total > 0) {
            $remainingPhotos = $total - $current;
            $avgTimePerPhoto = $current > 0 ? (microtime(true) - $this->startTime) / $current : 0;
            $estimatedTimeRemaining = $remainingPhotos * $avgTimePerPhoto;
            $progressData['estimated_time_remaining'] = $estimatedTimeRemaining;
        }

        Cache::put("job_progress_{$this->jobId}", $progressData, 3600);
        Log::info("Job progress updated: {$this->jobId} - {$progress}% - {$message}");
    }

    /**
     * Cleanup temporary files
     */
    private function cleanupTempFiles()
    {
        foreach ($this->storedFiles as $fileInfo) {
            if (file_exists($fileInfo['path'])) {
                try {
                    unlink($fileInfo['path']);
                    Log::info("Cleaned up temp file: {$fileInfo['path']}");
                } catch (\Exception $e) {
                    Log::warning("Failed to cleanup temp file: {$fileInfo['path']} - {$e->getMessage()}");
                }
            }
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        Log::error("ProcessLocalPhotosJob permanently failed for job ID: {$this->jobId}", [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->updateProgress(0, 100, 'Job gagal: ' . $exception->getMessage(), 'failed');
        
        // Store final error result
        Cache::put("job_result_{$this->jobId}", [
            'success' => false,
            'error' => 'Job gagal setelah beberapa percobaan: ' . $exception->getMessage()
        ], 3600);

        // Cleanup temporary files
        $this->cleanupTempFiles();
    }
}