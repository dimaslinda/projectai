<?php

namespace App\Jobs;

use App\Services\ExcelAnalyzer;
use App\Services\ExcelProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessPhotosJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900; // 15 menit timeout untuk konsistensi dengan ExcelProcessor
    public $tries = 3; // Maksimal 3 kali retry
    public $backoff = 60; // Delay 60 detik antar retry

    protected $photoUrls;
    protected $templateFilename;
    protected $jobId;
    protected $userId;

    /**
     * Create a new job instance.
     */
    public function __construct($photoUrls, $templateFilename, $jobId, $userId)
    {
        $this->photoUrls = $photoUrls;
        $this->templateFilename = $templateFilename;
        $this->jobId = $jobId;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(ExcelProcessor $processor, ExcelAnalyzer $analyzer)
    {
        try {
            $this->updateJobProgress('started', 0, count($this->photoUrls), 'Memulai proses foto...');

            // Analisis template untuk mapping
            $templatePath = public_path('asset/contoh/ESR.xlsx');
            $templateAnalysis = $analyzer->analyzeStructure();

            $this->updateJobProgress('analyzing', 1, count($this->photoUrls), 'Menganalisis template...');

            // Progress callback untuk tracking
            $progressCallback = function($current, $total, $message = '') {
                $this->updateJobProgress('processing', $current, $total, $message);
            };

            // Process foto URLs
            $results = $processor->processPhotoUrls($this->photoUrls, $templateAnalysis, $progressCallback);

            $this->updateJobProgress('saving', count($this->photoUrls) - 1, count($this->photoUrls), 'Menyimpan file Excel...');

            // Simpan file Excel dengan foto
            $saveResult = $processor->saveExcelWithPhotos($results['spreadsheet']);

            if ($saveResult['success']) {
                $this->updateJobProgress('completed', count($this->photoUrls), count($this->photoUrls), 'Proses selesai');
                
                // Simpan hasil final
                $this->saveJobResult([
                    'success' => true,
                    'message' => 'Foto berhasil diproses dan file Excel telah dibuat',
                    'download_url' => $saveResult['download_url'],
                    'filename' => $saveResult['filename'],
                    'processed_photos' => $results['processed_photos'],
                    'total_processed' => count($results['processed_photos']),
                    'successful_placements' => count(array_filter($results['processed_photos'], fn($r) => $r['success']))
                ]);
            } else {
                throw new \Exception('Gagal menyimpan file Excel: ' . $saveResult['error']);
            }

        } catch (\Exception $e) {
            Log::error('ProcessPhotosJob failed', [
                'job_id' => $this->jobId,
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $this->updateJobProgress('failed', 0, count($this->photoUrls), 'Error: ' . $e->getMessage());
            
            $this->saveJobResult([
                'success' => false,
                'error' => $e->getMessage()
            ]);

            throw $e; // Re-throw untuk retry mechanism
        }
    }

    /**
     * Update job progress
     */
    private function updateJobProgress($step, $current, $total, $message = '')
    {
        $progress = [
            'job_id' => $this->jobId,
            'step' => $step,
            'current' => $current,
            'total' => $total,
            'percentage' => $total > 0 ? round(($current / $total) * 100, 2) : 0,
            'message' => $message,
            'timestamp' => time()
        ];

        $progressFile = storage_path('app/temp/job_progress_' . $this->jobId . '.json');
        
        if (!file_exists(dirname($progressFile))) {
            mkdir(dirname($progressFile), 0755, true);
        }

        file_put_contents($progressFile, json_encode($progress));
    }

    /**
     * Save final job result
     */
    private function saveJobResult($result)
    {
        $result['job_id'] = $this->jobId;
        $result['user_id'] = $this->userId;
        $result['completed_at'] = now();

        $resultFile = storage_path('app/temp/job_result_' . $this->jobId . '.json');
        
        if (!file_exists(dirname($resultFile))) {
            mkdir(dirname($resultFile), 0755, true);
        }

        file_put_contents($resultFile, json_encode($result));
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        Log::error('ProcessPhotosJob permanently failed', [
            'job_id' => $this->jobId,
            'user_id' => $this->userId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->updateJobProgress('failed', 0, count($this->photoUrls), 'Job gagal: ' . $exception->getMessage());
        
        $this->saveJobResult([
            'success' => false,
            'error' => 'Job gagal setelah ' . $this->tries . ' percobaan: ' . $exception->getMessage()
        ]);
    }
}