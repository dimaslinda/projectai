<?php

namespace App\Http\Controllers;

use App\Services\ExcelAnalyzer;
use App\Services\ExcelProcessor;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ExcelController extends Controller
{
    private $excelAnalyzer;
    private $maxExecutionTime = 300; // 5 menit
    private $progressFile = null;

    public function __construct(ExcelAnalyzer $excelAnalyzer)
    {
        $this->excelAnalyzer = $excelAnalyzer;
        $this->progressFile = storage_path('app/temp/progress_' . session()->getId() . '.json');
    }

    /**
     * Update progress untuk tracking real-time
     */
    private function updateProgress($step, $current, $total, $message = '')
    {
        $progress = [
            'step' => $step,
            'current' => $current,
            'total' => $total,
            'percentage' => $total > 0 ? round(($current / $total) * 100, 2) : 0,
            'message' => $message,
            'timestamp' => time()
        ];

        if (!file_exists(dirname($this->progressFile))) {
            mkdir(dirname($this->progressFile), 0755, true);
        }

        file_put_contents($this->progressFile, json_encode($progress));
    }

    /**
     * Get progress status
     */
    public function getProgress()
    {
        if (!file_exists($this->progressFile)) {
            return response()->json(['progress' => null]);
        }

        $progress = json_decode(file_get_contents($this->progressFile), true);
        return response()->json(['progress' => $progress]);
    }

    /**
     * Clear progress file
     */
    private function clearProgress()
    {
        if (file_exists($this->progressFile)) {
            unlink($this->progressFile);
        }
    }

    /**
     * Check if approaching timeout
     */
    private function isApproachingTimeout($startTime)
    {
        return (time() - $startTime) > ($this->maxExecutionTime - 30);
    }

    public function analyzeTemplate()
    {
        try {
            $templatePath = public_path('asset/contoh/ESR.xlsx');
            
            if (!file_exists($templatePath)) {
                return response()->json([
                    'error' => 'Template file not found'
                ], 404);
            }

            $analysis = $this->excelAnalyzer->analyzeTemplate($templatePath);
            $photoMapping = $this->excelAnalyzer->getPhotoMappingStructure();

            return response()->json([
                'success' => true,
                'analysis' => $analysis,
                'photo_mapping' => $photoMapping,
                'template_path' => $templatePath
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error analyzing template: ' . $e->getMessage()
            ], 500);
        }
    }

    public function showAnalysis()
    {
        return Inertia::render('Excel/Analysis');
    }

    /**
     * Copy template dan hapus foto existing
     */
    public function copyTemplate(Request $request, ExcelProcessor $processor)
    {
        Log::info('=== COPY TEMPLATE START ===');
        Log::info('Request data: ' . json_encode($request->all()));
        
        $startTime = time();
        set_time_limit($this->maxExecutionTime);
        
        try {
            $this->updateProgress('init', 0, 100, 'Memulai proses copy template...');
            Log::info('Progress updated: init');

            $templatePath = public_path('asset/contoh/ESR.xlsx');
            Log::info('Template path: ' . $templatePath);
            
            if (!file_exists($templatePath)) {
                Log::error('Template file not found: ' . $templatePath);
                $this->clearProgress();
                return response()->json([
                    'success' => false,
                    'error' => 'Template file tidak ditemukan'
                ], 404);
            }
            Log::info('Template file exists');

            $outputFileName = $request->input('filename', 'ESR_' . date('Y-m-d_H-i-s') . '.xlsx');
            Log::info('Output filename: ' . $outputFileName);
            
            $this->updateProgress('processing', 50, 100, 'Memproses template...');
            Log::info('Progress updated: processing');
            
            Log::info('Calling processor->copyTemplateAndClearPhotos');
            $result = $processor->copyTemplateAndClearPhotos($templatePath, $outputFileName);
            Log::info('Processor result: ' . json_encode($result));
            
            $this->updateProgress('completed', 100, 100, 'Template berhasil diproses');
            $this->clearProgress();
            Log::info('Progress completed and cleared');
            
            Log::info('=== COPY TEMPLATE SUCCESS ===');
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('=== COPY TEMPLATE ERROR ===');
            Log::error('Exception: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            $this->clearProgress();
            return response()->json([
                'success' => false,
                'error' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process foto dari URL dan tempatkan di Excel
     */
    public function processPhotos(Request $request, ExcelProcessor $processor, ExcelAnalyzer $analyzer)
    {
        $startTime = time();
        set_time_limit($this->maxExecutionTime);
        
        $request->validate([
            'photo_urls' => 'required|array',
            'photo_urls.*' => 'required|url',
            'template_filename' => 'required|string'
        ]);

        try {
            $photoUrls = $request->input('photo_urls');
            $totalPhotos = count($photoUrls);
            
            $this->updateProgress('init', 0, $totalPhotos, 'Memulai proses foto...');

            // Analisis template untuk mapping
            $templatePath = public_path('asset/contoh/ESR.xlsx');
            $templateAnalysis = $analyzer->analyzeTemplate($templatePath);

            $this->updateProgress('analyzing', 1, $totalPhotos, 'Menganalisis template...');

            // Check timeout sebelum processing
            if ($this->isApproachingTimeout($startTime)) {
                $this->clearProgress();
                return response()->json([
                    'success' => false,
                    'error' => 'Proses terlalu lama, silakan coba dengan foto yang lebih sedikit'
                ], 408);
            }

            // Process foto URLs dengan progress callback
            $progressCallback = function($current, $total, $message = '') use ($startTime) {
                $this->updateProgress('processing', $current, $total, $message);
                
                // Check timeout during processing
                if ($this->isApproachingTimeout($startTime)) {
                    throw new \Exception('Timeout: Proses terlalu lama');
                }
            };

            $results = $processor->processPhotoUrls($photoUrls, $templateAnalysis, $progressCallback);

            $this->updateProgress('saving', $totalPhotos - 1, $totalPhotos, 'Menyimpan file Excel...');

            // Simpan file Excel dengan foto
            $saveResult = $processor->saveExcelWithPhotos($results['spreadsheet']);
             
            if ($saveResult['success']) {
                $this->updateProgress('completed', $totalPhotos, $totalPhotos, 'Proses selesai');
                $this->clearProgress();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Foto berhasil diproses dan file Excel telah dibuat',
                    'download_url' => $saveResult['download_url'],
                    'filename' => $saveResult['filename'],
                    'processed_photos' => $results['processed_photos'],
                    'total_processed' => count($results['processed_photos']),
                    'successful_placements' => count(array_filter($results['processed_photos'], fn($r) => $r['success'])),
                    'processing_time' => time() - $startTime
                ]);
            } else {
                $this->clearProgress();
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menyimpan file Excel: ' . $saveResult['error']
                ], 500);
            }

        } catch (\Exception $e) {
            $this->clearProgress();
            
            if (strpos($e->getMessage(), 'Timeout') !== false) {
                return response()->json([
                    'success' => false,
                    'error' => 'Proses timeout: ' . $e->getMessage(),
                    'suggestion' => 'Coba kurangi jumlah foto atau gunakan foto dengan ukuran lebih kecil'
                ], 408);
            }
            
            return response()->json([
                'success' => false,
                'error' => 'Error processing photos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process foto secara async dengan job queue
     */
    public function processPhotosAsync(Request $request)
    {
        $request->validate([
            'photo_urls' => 'required|array',
            'photo_urls.*' => 'required|url',
            'template_filename' => 'required|string'
        ]);

        try {
            $jobId = uniqid('photo_process_');
            $userId = auth()->id();
            
            // Dispatch job ke queue
            \App\Jobs\ProcessPhotosJob::dispatch(
                $request->photo_urls,
                $request->template_filename,
                $jobId,
                $userId
            )->onQueue('photos');
            
            return response()->json([
                'success' => true,
                'job_id' => $jobId,
                'message' => 'Proses foto telah ditambahkan ke antrian. Gunakan job_id untuk tracking progress.',
                'progress_url' => route('excel.job-progress', ['jobId' => $jobId])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error queuing photos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process foto lokal secara async dengan job queue
     */
    public function processPhotosLocalAsync(Request $request)
    {
        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'required|file|image', // Removed max size limit for large uploads
            'template_filename' => 'required|string'
        ]);

        try {
            $jobId = uniqid('photo_local_');
            $userId = auth()->id();
            
            // Store uploaded files temporarily
            $storedFiles = [];
            foreach ($request->file('photos') as $index => $file) {
                $filename = $jobId . '_' . $index . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('temp/photos', $filename, 'public');
                $storedFiles[] = [
                    'path' => storage_path('app/public/' . $path),
                    'original_name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                ];
            }
            
            // Dispatch job ke queue dengan file paths
            \App\Jobs\ProcessLocalPhotosJob::dispatch(
                $storedFiles,
                $request->template_filename,
                $jobId,
                $userId
            )->onQueue('photos');
            
            return response()->json([
                'success' => true,
                'job_id' => $jobId,
                'message' => 'File lokal telah diupload dan ditambahkan ke antrian pemrosesan.',
                'uploaded_files' => count($storedFiles),
                'progress_url' => route('excel.job-progress', ['jobId' => $jobId])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error uploading local files: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get job progress by job ID
     */
    public function getJobProgress($jobId)
    {
        $progressFile = storage_path('app/temp/job_progress_' . $jobId . '.json');
        $resultFile = storage_path('app/temp/job_result_' . $jobId . '.json');
        
        // Check if job is completed
        if (file_exists($resultFile)) {
            $result = json_decode(file_get_contents($resultFile), true);
            return response()->json([
                'status' => 'completed',
                'result' => $result
            ]);
        }
        
        // Check progress
        if (file_exists($progressFile)) {
            $progress = json_decode(file_get_contents($progressFile), true);
            return response()->json([
                'status' => 'running',
                'progress' => $progress
            ]);
        }
        
        return response()->json([
            'status' => 'not_found',
            'message' => 'Job tidak ditemukan atau belum dimulai'
        ], 404);
    }

    /**
     * Cancel running job
     */
    public function cancelJob($jobId)
    {
        try {
            // Mark job as cancelled
            $progressFile = storage_path('app/temp/job_progress_' . $jobId . '.json');
            
            if (file_exists($progressFile)) {
                $progress = json_decode(file_get_contents($progressFile), true);
                $progress['step'] = 'cancelled';
                $progress['message'] = 'Job dibatalkan oleh user';
                file_put_contents($progressFile, json_encode($progress));
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Job berhasil dibatalkan'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error cancelling job: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Halaman utama untuk photo organizer
     */
    public function showPhotoOrganizer()
    {
        return Inertia::render('Excel/PhotoOrganizer');
    }

    /**
     * Download file hasil
     */
    public function downloadResult($filename)
    {
        $filePath = storage_path('app/public/excel_results/' . $filename);
        
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }
        
        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}