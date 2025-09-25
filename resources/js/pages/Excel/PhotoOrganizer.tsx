import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Copy, Download, FileSpreadsheet, Image, Loader2, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

// Extend HTMLInputElement to include webkitdirectory property
declare module 'react' {
    interface InputHTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        webkitdirectory?: string;
    }
}

interface PhotoResult {
    url: string;
    success: boolean;
    worksheet: string;
    position: string;
    error?: string;
}

interface ProcessResult {
    success: boolean;
    results: PhotoResult[];
    download_url?: string;
    total_processed: number;
    successful_placements: number;
    error?: string;
}

interface JobProgress {
    progress: number;
    status: string;
    current_step: string;
    total_photos: number;
    processed_photos: number;
    estimated_time_remaining?: number;
    error?: string;
}

interface AsyncJobResponse {
    success: boolean;
    job_id: string;
    message: string;
    error?: string;
}

export default function PhotoOrganizer() {
    const [templateCopied, setTemplateCopied] = useState(false);
    const [templateFilename, setTemplateFilename] = useState('');
    const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadMode, setUploadMode] = useState<'url' | 'local'>('local');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
    const [error, setError] = useState<string>('');

    // Async job tracking
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
    const [isJobRunning, setIsJobRunning] = useState(false);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);

    // Function to start monitoring job progress
    const startProgressMonitoring = (jobId: string) => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = setInterval(async () => {
            try {
                const response = await fetch(`/excel/job-progress/${jobId}`);
                const progress: JobProgress = await response.json();

                setJobProgress(progress);

                // Check if job is completed
                if (progress.status === 'completed' || progress.status === 'failed') {
                    setIsJobRunning(false);
                    if (progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current);
                    }

                    // If completed successfully, fetch the result
                    if (progress.status === 'completed') {
                        // The result should be in the progress data or we need to fetch it
                        // For now, we'll simulate a successful result
                        setProcessResult({
                            success: true,
                            results: [],
                            total_processed: progress.total_photos,
                            successful_placements: progress.processed_photos,
                            download_url: `/excel/download/${templateFilename}`,
                        });
                    } else if (progress.error) {
                        setError(progress.error);
                    }
                }
            } catch (err) {
                console.error('Error fetching progress:', err);
            }
        }, 2000); // Poll every 2 seconds
    };

    // Function to cancel current job
    const cancelJob = async () => {
        if (!currentJobId) return;

        try {
            await fetch(`/excel/cancel-job/${currentJobId}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            setIsJobRunning(false);
            setCurrentJobId(null);
            setJobProgress(null);
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        } catch (err) {
            console.error('Error canceling job:', err);
        }
    };

    const copyTemplate = async () => {
        setIsCopying(true);
        setError('');

        try {
            const response = await fetch('/excel/copy-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    filename: templateFilename || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setTemplateCopied(true);
                setTemplateFilename(result.filename);
            } else {
                setError(result.error || 'Gagal menyalin template');
            }
        } catch {
            setError('Error saat menyalin template');
        } finally {
            setIsCopying(false);
        }
    };

    const addPhotoUrl = () => {
        setPhotoUrls([...photoUrls, '']);
    };

    const removePhotoUrl = (index: number) => {
        setPhotoUrls(photoUrls.filter((_, i) => i !== index));
    };

    const updatePhotoUrl = (index: number, value: string) => {
        const newUrls = [...photoUrls];
        newUrls[index] = value || '';
        setPhotoUrls(newUrls);
    };

    // File handling functions
    const validateFile = (file: File): { valid: boolean; error?: string } => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: `File ${file.name}: Tipe file tidak didukung. Hanya JPG, PNG, GIF, dan WebP yang diizinkan.` };
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { valid: false, error: `File ${file.name}: Ukuran file terlalu besar. Maksimal 10MB.` };
        }

        return { valid: true };
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        const validFiles: File[] = [];
        const errors: string[] = [];

        imageFiles.forEach((file) => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error!);
            }
        });

        if (errors.length > 0) {
            alert('Beberapa file tidak valid:\n' + errors.join('\n'));
        }

        setSelectedFiles((prev) => [...prev, ...validFiles]);
    };

    const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        const validFiles: File[] = [];
        const errors: string[] = [];

        imageFiles.forEach((file) => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error!);
            }
        });

        if (errors.length > 0) {
            alert('Beberapa file tidak valid:\n' + errors.join('\n'));
        }

        setSelectedFiles(validFiles);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        const validFiles: File[] = [];
        const errors: string[] = [];

        imageFiles.forEach((file) => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error!);
            }
        });

        if (errors.length > 0) {
            alert('Beberapa file tidak valid:\n' + errors.join('\n'));
        }

        setSelectedFiles((prev) => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
    };

    const processPhotos = async () => {
        if (!templateCopied) {
            setError('Silakan copy template terlebih dahulu');
            return;
        }

        if (uploadMode === 'url') {
            const validUrls = photoUrls.filter((url) => url.trim() !== '');
            if (validUrls.length === 0) {
                setError('Silakan masukkan minimal satu URL foto');
                return;
            }
        } else {
            if (selectedFiles.length === 0) {
                setError('Please select at least one photo file');
                return;
            }
        }

        setIsProcessing(true);
        setIsJobRunning(true);
        setError('');
        setProcessResult(null);
        setJobProgress(null);

        try {
            let response;

            if (uploadMode === 'url') {
                const validUrls = photoUrls.filter((url) => url.trim() !== '');
                response = await fetch('/excel/process-photos-async', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        photo_urls: validUrls,
                        template_filename: templateFilename,
                    }),
                });
            } else {
                // Handle file upload
                const formData = new FormData();
                formData.append('template_filename', templateFilename);
                selectedFiles.forEach((file, index) => {
                    formData.append(`photos[${index}]`, file);
                });

                response = await fetch('/excel/process-photos-local-async', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: formData,
                });
            }

            const result: AsyncJobResponse = await response.json();

            if (result.success && result.job_id) {
                setCurrentJobId(result.job_id);
                startProgressMonitoring(result.job_id);
            } else {
                setError(result.error || 'Gagal memulai pemrosesan foto');
                setIsJobRunning(false);
            }
        } catch {
            setError('Error saat memulai pemrosesan foto');
            setIsJobRunning(false);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Excel Photo Organizer" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold">Excel Photo Organizer</h1>
                    <p className="text-gray-600">Copy template Excel ESR dan organize foto secara otomatis ke posisi yang tepat</p>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="copy" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="copy">
                            1. Copy Template
                            {templateCopied && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
                        </TabsTrigger>
                        <TabsTrigger value="photos" disabled={!templateCopied}>
                            2. Upload Photos
                            {isJobRunning && <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-600" />}
                            {processResult && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
                        </TabsTrigger>
                        <TabsTrigger value="results" disabled={!processResult && !isJobRunning}>
                            3. Results
                            {processResult && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="copy">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Copy className="h-5 w-5" />
                                    Copy Template Excel
                                </CardTitle>
                                <CardDescription>Buat salinan template ESR.xlsx dan hapus semua foto existing</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="filename">Nama File Output (opsional)</Label>
                                    <Input
                                        id="filename"
                                        placeholder="ESR_2024-01-01_10-30-00.xlsx"
                                        value={templateFilename}
                                        onChange={(e) => setTemplateFilename(e.target.value)}
                                        disabled={templateCopied}
                                    />
                                </div>

                                <Button onClick={copyTemplate} disabled={isCopying || templateCopied} className="w-full">
                                    {isCopying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyalin Template...
                                        </>
                                    ) : templateCopied ? (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Template Berhasil Disalin
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Copy Template
                                        </>
                                    )}
                                </Button>

                                {templateCopied && (
                                    <Alert className="border-green-200 bg-green-50">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                            Template berhasil disalin: <strong>{templateFilename}</strong>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="photos">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Image className="h-5 w-5" />
                                    Upload Photos
                                </CardTitle>
                                <CardDescription>Pilih cara upload foto: dari file lokal atau URL</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Mode Selector */}
                                <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                                    <Button
                                        variant={uploadMode === 'local' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setUploadMode('local')}
                                        className="flex-1"
                                    >
                                        📁 File Lokal
                                    </Button>
                                    <Button
                                        variant={uploadMode === 'url' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setUploadMode('url')}
                                        className="flex-1"
                                    >
                                        🔗 URL
                                    </Button>
                                </div>

                                {uploadMode === 'local' ? (
                                    /* Local File Upload */
                                    <div className="space-y-4">
                                        {/* Drag & Drop Area */}
                                        <div
                                            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                                                isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                        >
                                            <div className="space-y-4">
                                                <div className="text-4xl">📸</div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">Drag & Drop Foto Disini</h3>
                                                    <p className="text-gray-600">Atau klik tombol dibawah untuk memilih file</p>
                                                </div>

                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => document.getElementById('file-input')?.click()}
                                                        disabled={isJobRunning}
                                                    >
                                                        📄 Pilih File
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => document.getElementById('folder-input')?.click()}
                                                        disabled={isJobRunning}
                                                    >
                                                        📁 Pilih Folder
                                                    </Button>
                                                </div>

                                                <input
                                                    id="file-input"
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <input
                                                    id="folder-input"
                                                    type="file"
                                                    webkitdirectory=""
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFolderSelect}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>

                                        {/* Selected Files Display */}
                                        {selectedFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold">File Terpilih ({selectedFiles.length})</h4>
                                                    <Button variant="outline" size="sm" onClick={clearAllFiles} disabled={isJobRunning}>
                                                        Hapus Semua
                                                    </Button>
                                                </div>
                                                <div className="max-h-40 space-y-1 overflow-y-auto">
                                                    {selectedFiles.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between rounded bg-gray-50 p-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm">📸</span>
                                                                <span className="truncate text-sm">{file.name}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFile(index)}
                                                                disabled={isJobRunning}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            onClick={processPhotos}
                                            disabled={isProcessing || isJobRunning || selectedFiles.length === 0}
                                            className="w-full"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Memulai Pemrosesan...
                                                </>
                                            ) : isJobRunning ? (
                                                <>
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Sedang Diproses...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Process {selectedFiles.length} Photos
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    /* URL Upload (existing) */
                                    <div className="space-y-4">
                                        {photoUrls.map((url, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    placeholder="https://example.com/photo.jpg"
                                                    value={url || ''}
                                                    onChange={(e) => updatePhotoUrl(index, e.target.value)}
                                                />
                                                {photoUrls.length > 1 && (
                                                    <Button variant="outline" size="sm" onClick={() => removePhotoUrl(index)}>
                                                        Hapus
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={addPhotoUrl} disabled={isJobRunning}>
                                                Tambah URL
                                            </Button>
                                            <Button onClick={processPhotos} disabled={isProcessing || isJobRunning} className="flex-1">
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Memulai Pemrosesan...
                                                    </>
                                                ) : isJobRunning ? (
                                                    <>
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        Sedang Diproses...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        Process Photos
                                                    </>
                                                )}
                                            </Button>
                                            {isJobRunning && (
                                                <Button variant="destructive" onClick={cancelJob} size="sm">
                                                    <X className="mr-2 h-4 w-4" />
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Progress Tracking */}
                                {isJobRunning && jobProgress && (
                                    <Card className="mt-4 border-blue-200 bg-blue-50">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                Processing Photos
                                            </CardTitle>
                                            <CardDescription>{jobProgress.current_step}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="mb-2 flex justify-between text-sm">
                                                    <span>Progress</span>
                                                    <span>{Math.round(jobProgress.progress)}%</span>
                                                </div>
                                                <Progress value={jobProgress.progress} className="w-full" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Photos Processed:</span>
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {jobProgress.processed_photos} / {jobProgress.total_photos}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Status:</span>
                                                    <div className="text-lg font-bold text-green-600 capitalize">{jobProgress.status}</div>
                                                </div>
                                            </div>

                                            {jobProgress.estimated_time_remaining && (
                                                <div className="text-sm text-gray-600">
                                                    <Clock className="mr-1 inline h-4 w-4" />
                                                    Estimated time remaining: {Math.round(jobProgress.estimated_time_remaining / 60)} minutes
                                                </div>
                                            )}

                                            <div className="flex justify-center">
                                                <Button variant="destructive" onClick={cancelJob} size="sm">
                                                    <X className="mr-2 h-4 w-4" />
                                                    Cancel Processing
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="results">
                        {/* Show progress for running job */}
                        {isJobRunning && jobProgress && !processResult && (
                            <Card className="border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                        Processing in Progress
                                    </CardTitle>
                                    <CardDescription>Your photos are being processed. Please wait...</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span>Overall Progress</span>
                                            <span>{Math.round(jobProgress.progress)}%</span>
                                        </div>
                                        <Progress value={jobProgress.progress} className="h-3 w-full" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{jobProgress.total_photos}</div>
                                            <div className="text-sm text-gray-600">Total Photos</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{jobProgress.processed_photos}</div>
                                            <div className="text-sm text-gray-600">Processed</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {jobProgress.total_photos - jobProgress.processed_photos}
                                            </div>
                                            <div className="text-sm text-gray-600">Remaining</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-purple-600 capitalize">{jobProgress.status}</div>
                                            <div className="text-sm text-gray-600">Status</div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border bg-white p-4">
                                        <h4 className="mb-2 font-semibold">Current Step:</h4>
                                        <p className="text-gray-700">{jobProgress.current_step}</p>

                                        {jobProgress.estimated_time_remaining && (
                                            <div className="mt-3 flex items-center text-sm text-gray-600">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Estimated time remaining: {Math.round(jobProgress.estimated_time_remaining / 60)} minutes
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-center">
                                        <Button variant="destructive" onClick={cancelJob}>
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel Processing
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Show results when completed */}
                        {processResult && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            Processing Results
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{processResult.total_processed}</div>
                                                <div className="text-sm text-gray-600">Total Processed</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{processResult.successful_placements}</div>
                                                <div className="text-sm text-gray-600">Successful</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-red-600">
                                                    {processResult.total_processed - processResult.successful_placements}
                                                </div>
                                                <div className="text-sm text-gray-600">Failed</div>
                                            </div>
                                            <div className="text-center">
                                                <Progress
                                                    value={(processResult.successful_placements / processResult.total_processed) * 100}
                                                    className="w-full"
                                                />
                                                <div className="mt-1 text-sm text-gray-600">Success Rate</div>
                                            </div>
                                        </div>

                                        {processResult.download_url && (
                                            <Button asChild className="mb-4 w-full">
                                                <a href={processResult.download_url}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Excel File
                                                </a>
                                            </Button>
                                        )}

                                        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                            <h3 className="mb-2 text-lg font-semibold text-green-800">Processing Complete!</h3>
                                            <p className="mb-4 text-green-700">Photos have been successfully processed and organized.</p>
                                            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Total Photos:</span> {processResult.total_processed}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Successfully Placed:</span> {processResult.successful_placements}
                                                </div>
                                            </div>
                                            {processResult.download_url && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => window.open(processResult.download_url, '_blank')}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Download Excel File
                                                    </Button>
                                                    <Badge variant="secondary">{templateFilename}</Badge>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Photo Placement Details:</h4>
                                            {processResult.results.map((result, index) => (
                                                <div key={index} className="flex items-center justify-between rounded border p-3">
                                                    <div className="flex-1">
                                                        <div className="truncate font-medium">{result.url}</div>
                                                        {result.success ? (
                                                            <div className="text-sm text-gray-600">
                                                                Placed in {result.worksheet} at {result.position}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-red-600">{result.error}</div>
                                                        )}
                                                    </div>
                                                    <Badge variant={result.success ? 'default' : 'destructive'}>
                                                        {result.success ? 'Success' : 'Failed'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
