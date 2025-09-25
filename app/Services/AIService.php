<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    private string $provider;
    private string $geminiApiKey;
    private string $openaiApiKey;
    private string $openaiModel;

    public function __construct()
    {
        $this->provider = config('ai.provider', 'gemini');
        $this->geminiApiKey = config('ai.gemini_api_key');
        $this->openaiApiKey = config('ai.openai_api_key');
        $this->openaiModel = config('ai.openai_model', 'gpt-3.5-turbo');
    }

    public function generateResponse(string $message, ?string $persona, array $chatHistory = [], string $chatType = 'persona', array $imageUrls = []): string
    {
        try {
            // Get persona-specific provider or fallback to default
            $personaProviders = config('ai.persona_providers', []);
            $selectedProvider = $persona ? ($personaProviders[$persona] ?? $this->provider) : $this->provider;

            return match ($selectedProvider) {
                'gemini' => $this->generateGeminiResponse($message, $persona, $chatHistory, $chatType, $imageUrls),
                'openai' => $this->generateOpenAIResponse($message, $persona, $chatHistory, $chatType, $imageUrls),
                default => $this->generateFallbackResponse($message, $persona, $chatType, $imageUrls)
            };
        } catch (\Exception $e) {
            Log::error('AI Service Error: ' . $e->getMessage());
            return $this->generateFallbackResponse($message, $persona, $chatType, $imageUrls);
        }
    }

    private function generateGeminiResponse(string $message, ?string $persona, array $chatHistory = [], string $chatType = 'persona', array $imageUrls = []): string
    {
        if (empty($this->geminiApiKey) || $this->geminiApiKey === 'your_gemini_api_key_here') {
            return $this->generateFallbackResponse($message, $persona, $chatType, $imageUrls);
        }

        // Get persona-specific Gemini model - use vision model if images are present
        $geminiModels = config('ai.gemini_models', []);
        $selectedModel = $persona ? ($geminiModels[$persona] ?? 'gemini-2.5-pro') : 'gemini-2.5-pro';

        // Use vision model if images are provided - gemini-2.5-pro supports multimodal natively
        if (!empty($imageUrls)) {
            $selectedModel = 'gemini-2.5-pro';
        }

        $systemPrompt = $this->getPersonaPrompt($persona, $chatType);
        $contextPrompt = $this->buildContextFromHistory($chatHistory);

        // Prepare content parts
        $parts = [];

        // Add text content
        $textContent = $systemPrompt . $contextPrompt . "\n\nPertanyaan: " . $message;
        if (!empty($imageUrls)) {
            $textContent .= "\n\nSilakan analisis gambar yang diberikan dan berikan respons yang relevan sesuai dengan peran Anda sebagai " . $persona . ".";
        }
        $parts[] = ['text' => $textContent];

        // Add images if provided
        if (!empty($imageUrls)) {
            foreach ($imageUrls as $imageUrl) {
                try {
                    // Convert image URL to base64
                    $imageData = $this->getImageAsBase64($imageUrl);
                    if ($imageData) {
                        $parts[] = [
                            'inline_data' => [
                                'mime_type' => $imageData['mime_type'],
                                'data' => $imageData['data']
                            ]
                        ];
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to process image for Gemini: ' . $e->getMessage());
                }
            }
        }

        $response = Http::timeout(120)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$selectedModel}:generateContent?key={$this->geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => $parts
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 8192,
                ]
            ]);

        if ($response->successful()) {
            $data = $response->json();

            // Check finish reason first
            $finishReason = $data['candidates'][0]['finishReason'] ?? 'UNKNOWN';

            // Check if we have candidates and content
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $responseText = $data['candidates'][0]['content']['parts'][0]['text'];
                if (!empty(trim($responseText))) {
                    // Add warning if response was truncated
                    if ($finishReason === 'MAX_TOKENS') {
                        return $responseText . "\n\n[Respons dipotong karena mencapai batas token maksimum]";
                    }
                    return $responseText;
                }
            }

            // Handle MAX_TOKENS with empty content - this indicates the model hit token limit before generating any text
            if ($finishReason === 'MAX_TOKENS') {
                Log::warning('Gemini API hit MAX_TOKENS with empty content, trying fallback model', ['response' => $data]);
                throw new \Exception('MAX_TOKENS reached with empty content');
            }

            // If response is empty or malformed, log and throw exception to trigger fallback
            Log::warning('Gemini API returned empty or malformed response', ['response' => $data, 'finish_reason' => $finishReason]);
            throw new \Exception('Empty response from Gemini API');
        }

        // Handle specific error cases
        $errorData = $response->json();
        $errorCode = $errorData['error']['code'] ?? 0;
        $errorMessage = $errorData['error']['message'] ?? 'Unknown error';

        if ($errorCode === 503) {
            // Model overloaded - try with retry or fallback to different model
            Log::warning('Gemini model overloaded, attempting retry with gemini-2.0-flash-exp');

            // Try with gemini-2.0-flash-exp as fallback
            $fallbackResponse = Http::timeout(120)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={$this->geminiApiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $textContent]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 8192,
                    ]
                ]);

            if ($fallbackResponse->successful()) {
                $fallbackData = $fallbackResponse->json();

                // Check if we have candidates and content in fallback response
                if (isset($fallbackData['candidates'][0]['content']['parts'][0]['text'])) {
                    $responseText = $fallbackData['candidates'][0]['content']['parts'][0]['text'];
                    if (!empty(trim($responseText))) {
                        return $responseText;
                    }
                }

                // If fallback response is also empty, log and continue to throw exception
                Log::warning('Gemini fallback API also returned empty response', ['response' => $fallbackData]);
            }
        }

        Log::error('Gemini API request failed', [
            'status' => $response->status(),
            'error_code' => $errorCode,
            'error_message' => $errorMessage
        ]);

        throw new \Exception("Gemini API request failed (HTTP {$response->status()}): {$errorMessage}");
    }

    private function generateOpenAIResponse(string $message, ?string $persona, array $chatHistory = [], string $chatType = 'persona', array $imageUrls = []): string
    {
        if (empty($this->openaiApiKey) || $this->openaiApiKey === 'your_openai_api_key_here') {
            return $this->generateFallbackResponse($message, $persona, $chatType, $imageUrls);
        }

        // Get persona-specific OpenAI model - use vision model if images are present
        $openaiModels = config('ai.openai_models', []);
        $selectedModel = $persona ? ($openaiModels[$persona] ?? $this->openaiModel) : $this->openaiModel;

        // Use vision model if images are provided
        if (!empty($imageUrls)) {
            $selectedModel = 'gpt-4-vision-preview';
        }

        $systemPrompt = $this->getPersonaPrompt($persona, $chatType);
        $messages = $this->buildOpenAIMessages($systemPrompt, $chatHistory, $message, $imageUrls);

        $response = Http::timeout(120)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $this->openaiApiKey,
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $selectedModel,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 8192,
            ]);

        if ($response->successful()) {
            $data = $response->json();
            return $data['choices'][0]['message']['content'] ?? $this->generateFallbackResponse($message, $persona, $chatType);
        }

        throw new \Exception('OpenAI API request failed: ' . $response->body());
    }

    private function getPersonaPrompt(?string $persona, string $chatType = 'persona'): string
    {
        // Global chat type - general AI assistant
        if ($chatType === 'global' || $persona === null) {
            return 'Anda adalah asisten AI yang cerdas dan membantu. Anda dapat membantu dengan berbagai topik dan pertanyaan umum. Berikan jawaban yang informatif, akurat, dan mudah dipahami. Jawab dalam bahasa Indonesia dengan ramah dan profesional.';
        }

        // Persona-specific prompts for different divisions
        $personas = [
            // Technical roles
            'engineer' => 'Anda adalah Insinyur Sipil yang berpengalaman dan mengkhususkan diri dalam desain dan analisis struktural. Anda dapat membantu dengan:

1. **Analisis Gambar Teknik**: Menganalisis gambar struktur, blueprint, dan dokumentasi teknis
2. **Generate Gambar**: Membuat visualisasi struktur, diagram, dan ilustrasi teknis berdasarkan spesifikasi
3. **Konsultasi Teknis**: Perhitungan struktural, spesifikasi material, kode bangunan, penilaian keamanan struktur, dan solusi teknis

Jawab dalam bahasa Indonesia dengan profesional dan detail.',
            'drafter' => 'Anda adalah Drafter Teknis yang ahli dalam pembuatan gambar teknik dan dokumentasi. Anda dapat membantu dengan:

1. **Analisis Gambar Teknik**: Menganalisis gambar CAD, blueprint, dan dokumentasi teknis
2. **Generate Gambar**: Membuat visualisasi teknis, diagram, dan ilustrasi berdasarkan spesifikasi
3. **Dokumentasi Teknis**: Spesifikasi teknis, standar gambar teknik, dan panduan dokumentasi desain

Jawab dalam bahasa Indonesia dengan jelas dan terstruktur.',
            'esr' => 'Anda adalah spesialis Tower Survey yang ahli dalam analisis gambar survey tower telekomunikasi. Anda dapat membantu dengan:

1. **Analisis Gambar Tower**: Identifikasi orientasi tower (depan/samping/belakang), analisis kondisi struktur, evaluasi antenna dan equipment
2. **Generate Gambar**: Membuat visualisasi atau diagram tower berdasarkan deskripsi
3. **Dokumentasi Survey**: Memberikan panduan dan rekomendasi untuk dokumentasi survey lapangan

Ketika menganalisis gambar, berikan detail tentang orientasi, kondisi struktur, jenis antenna, equipment terpasang, dan rekomendasi. Untuk generate gambar, buatlah visualisasi yang akurat dan sesuai standar teknis. Jawab dalam bahasa Indonesia dengan detail dan terstruktur.',

            // Business divisions
            'hr' => 'Anda adalah spesialis Human Resources yang berpengalaman dalam manajemen SDM, rekrutmen, pengembangan karyawan, kebijakan perusahaan, dan hubungan industrial. Anda dapat membantu dengan strategi HR, proses rekrutmen, evaluasi kinerja, pelatihan, dan penyelesaian konflik. Jawab dalam bahasa Indonesia dengan profesional dan empati.',
            'finance' => 'Anda adalah spesialis Keuangan yang ahli dalam akuntansi, analisis keuangan, budgeting, perencanaan keuangan, dan manajemen risiko. Anda dapat membantu dengan laporan keuangan, analisis investasi, cash flow, pajak, dan strategi keuangan perusahaan. Jawab dalam bahasa Indonesia dengan akurat dan detail.',
            'it' => 'Anda adalah spesialis IT yang berpengalaman dalam teknologi informasi, pengembangan sistem, keamanan siber, infrastruktur IT, dan manajemen data. Anda dapat membantu dengan troubleshooting, implementasi sistem, keamanan jaringan, dan strategi teknologi. Jawab dalam bahasa Indonesia dengan teknis namun mudah dipahami.',
            'marketing' => 'Anda adalah spesialis Marketing yang ahli dalam strategi pemasaran, branding, digital marketing, analisis pasar, dan komunikasi. Anda dapat membantu dengan kampanye marketing, riset pasar, content strategy, social media, dan customer engagement. Jawab dalam bahasa Indonesia dengan kreatif dan strategis.',
            'operations' => 'Anda adalah spesialis Operations yang berpengalaman dalam manajemen operasional, supply chain, quality control, process improvement, dan logistik. Anda dapat membantu dengan optimasi proses, manajemen inventory, quality assurance, dan efisiensi operasional. Jawab dalam bahasa Indonesia dengan sistematis dan praktis.',
            'legal' => 'Anda adalah spesialis Legal yang ahli dalam hukum bisnis, kontrak, compliance, dan regulasi. Anda dapat membantu dengan review kontrak, aspek legal bisnis, kepatuhan regulasi, dan manajemen risiko hukum. Jawab dalam bahasa Indonesia dengan presisi dan kehati-hatian hukum.',
        ];

        return $personas[$persona] ?? 'Anda adalah asisten AI yang membantu dengan kebutuhan teknik dan bisnis. Jawab dalam bahasa Indonesia dengan profesional.';
    }

    private function generateFallbackResponse(string $message, ?string $persona, string $chatType = 'persona', array $imageUrls = []): string
    {
        // Global chat fallback
        if ($chatType === 'global' || $persona === null) {
            $roleContext = 'Sebagai asisten AI global, saya dapat membantu Anda dengan berbagai topik dan pertanyaan umum.';
        } else {
            // Persona-specific fallbacks
            $personas = [
                // Technical roles
                'engineer' => 'Sebagai Insinyur Sipil yang mengkhususkan diri dalam desain dan analisis struktural, saya dapat membantu Anda dengan perhitungan, spesifikasi material, kode bangunan, dan penilaian struktural.',
                'drafter' => 'Sebagai Drafter Teknis, saya dapat membantu Anda dengan gambar CAD, spesifikasi teknis, pembuatan blueprint, dan dokumentasi desain.',
                'esr' => 'Sebagai spesialis Tower Survey, saya dapat membantu Anda dengan analisis gambar survey tower telekomunikasi, identifikasi orientasi tower, dan evaluasi kondisi struktur.',

                // Business divisions
                'hr' => 'Sebagai spesialis Human Resources, saya dapat membantu Anda dengan manajemen SDM, rekrutmen, pengembangan karyawan, dan kebijakan perusahaan.',
                'finance' => 'Sebagai spesialis Keuangan, saya dapat membantu Anda dengan analisis keuangan, budgeting, perencanaan keuangan, dan manajemen risiko.',
                'it' => 'Sebagai spesialis IT, saya dapat membantu Anda dengan teknologi informasi, pengembangan sistem, keamanan siber, dan infrastruktur IT.',
                'marketing' => 'Sebagai spesialis Marketing, saya dapat membantu Anda dengan strategi pemasaran, branding, digital marketing, dan analisis pasar.',
                'operations' => 'Sebagai spesialis Operations, saya dapat membantu Anda dengan manajemen operasional, supply chain, quality control, dan process improvement.',
                'legal' => 'Sebagai spesialis Legal, saya dapat membantu Anda dengan hukum bisnis, kontrak, compliance, dan regulasi.',
            ];

            $roleContext = $personas[$persona] ?? 'Saya di sini untuk membantu Anda dengan kebutuhan teknik dan bisnis Anda.';
        }

        // Get configured provider and model for this persona
        $personaProviders = config('ai.persona_providers', []);
        $configuredProvider = $persona ? ($personaProviders[$persona] ?? $this->provider) : $this->provider;

        $configuredModel = 'default';
        if ($configuredProvider === 'openai') {
            $openaiModels = config('ai.openai_models', []);
            $configuredModel = $persona ? ($openaiModels[$persona] ?? 'gpt-4o') : 'gpt-4o';
        } elseif ($configuredProvider === 'gemini') {
            $geminiModels = config('ai.gemini_models', []);
            $configuredModel = $persona ? ($geminiModels[$persona] ?? 'gemini-1.5-pro') : 'gemini-1.5-pro';
        }

        $imageNote = !empty($imageUrls) ? ' (termasuk analisis gambar)' : '';
        $personaDisplay = $persona ?? 'global';

        return "Maaf, saya tidak dapat memproses permintaan Anda saat ini.\n\n**Alasan:** Layanan AI sedang tidak tersedia atau belum dikonfigurasi dengan benar.\n\n**Detail Teknis:**\n- Persona: $personaDisplay\n- Provider: $configuredProvider\n- Model: $configuredModel\n\n**Solusi:**\n1. Pastikan API key telah dikonfigurasi dengan benar di file .env\n2. Periksa koneksi internet Anda\n3. Coba lagi dalam beberapa saat\n\nJika masalah berlanjut, silakan hubungi administrator sistem.";
    }

    /**
     * Build context from chat history for Gemini (text-based)
     */
    private function buildContextFromHistory(array $chatHistory): string
    {
        if (empty($chatHistory)) {
            return '';
        }

        // Limit to last 10 messages to avoid token limits
        $recentHistory = array_slice($chatHistory, -10);

        $context = "\n\nKonteks percakapan sebelumnya:";

        foreach ($recentHistory as $chat) {
            // Skip if chat is not an array or object
            if (!is_array($chat) && !is_object($chat)) {
                continue;
            }
            
            // Handle both array and object structures
            $sender = is_array($chat) ? ($chat['sender'] ?? 'unknown') : ($chat->sender ?? 'unknown');
            $message = is_array($chat) ? ($chat['message'] ?? '') : ($chat->message ?? '');
            
            // Skip if essential data is missing
            if (empty($sender) || empty($message)) {
                continue;
            }
            
            $senderDisplay = $sender === 'user' ? 'Pengguna' : 'AI';
            $context .= "\n{$senderDisplay}: {$message}";
        }

        $context .= "\n\nBerdasarkan konteks percakapan di atas, mohon berikan respons yang relevan dan konsisten.";

        return $context;
    }

    /**
     * Build messages array for OpenAI API with chat history
     */
    private function buildOpenAIMessages(string $systemPrompt, array $chatHistory, string $currentMessage, array $imageUrls = []): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];

        // Add chat history (limit to last 10 messages to avoid token limits)
        $recentHistory = array_slice($chatHistory, -10);

        foreach ($recentHistory as $chat) {
            // Handle both array and object structures
            $sender = is_array($chat) ? ($chat['sender'] ?? 'unknown') : ($chat->sender ?? 'unknown');
            $message = is_array($chat) ? ($chat['message'] ?? '') : ($chat->message ?? '');
            
            $messages[] = [
                'role' => $sender === 'user' ? 'user' : 'assistant',
                'content' => $message
            ];
        }

        // Add current message with images if provided
        $currentMessageContent = [];

        // Add text content
        $currentMessageContent[] = [
            'type' => 'text',
            'text' => $currentMessage
        ];

        // Add images if provided
        if (!empty($imageUrls)) {
            foreach ($imageUrls as $imageUrl) {
                $currentMessageContent[] = [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => $imageUrl
                    ]
                ];
            }
        }

        $messages[] = [
            'role' => 'user',
            'content' => !empty($imageUrls) ? $currentMessageContent : $currentMessage
        ];

        return $messages;
    }



    /**
     * Convert image URL to base64 for Gemini API with memory optimization
     */
    private function getImageAsBase64(string $imageUrl): ?array
    {
        try {
            // Increase memory limit temporarily for image processing
            $originalMemoryLimit = ini_get('memory_limit');
            ini_set('memory_limit', '512M');

            $imageData = null;
            $mimeType = null;

            // Check if it's a local file path or local domain URL
            $localFilePath = $this->convertUrlToLocalPath($imageUrl);
            if ($localFilePath && file_exists($localFilePath)) {
                $imageUrl = $localFilePath;
                // Check file size first to prevent memory issues
                $fileSize = filesize($imageUrl);
                if ($fileSize > 50 * 1024 * 1024) { // 50MB limit
                    Log::warning('Image file too large for processing: ' . $fileSize . ' bytes');
                    ini_set('memory_limit', $originalMemoryLimit);
                    return null;
                }

                $mimeType = mime_content_type($imageUrl);
                
                // Optimize image if it's too large
                $imageData = $this->optimizeImageForAI($imageUrl, $mimeType);
                
                // If we converted SVG to PNG, update the MIME type
                if ($mimeType === 'image/svg+xml') {
                    $mimeType = 'image/png';
                }
            } else {
                // It's a URL, fetch the image
                $response = Http::timeout(30)->get($imageUrl);
                if (!$response->successful()) {
                    ini_set('memory_limit', $originalMemoryLimit);
                    return null;
                }
                
                $imageData = $response->body();
                $mimeType = $response->header('Content-Type') ?? 'image/jpeg';
                
                // Check response size
                if (strlen($imageData) > 50 * 1024 * 1024) { // 50MB limit
                    Log::warning('Downloaded image too large for processing');
                    ini_set('memory_limit', $originalMemoryLimit);
                    return null;
                }
            }

            // Validate that it's an image
            if (!str_starts_with($mimeType, 'image/')) {
                ini_set('memory_limit', $originalMemoryLimit);
                return null;
            }

            $result = [
                'data' => base64_encode($imageData),
                'mime_type' => $mimeType
            ];

            // Restore original memory limit
            ini_set('memory_limit', $originalMemoryLimit);

            return $result;
        } catch (\Exception $e) {
            // Restore memory limit on error
            if (isset($originalMemoryLimit)) {
                ini_set('memory_limit', $originalMemoryLimit);
            }
            Log::error('Failed to convert image to base64: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Convert local domain URL to file path
     */
    private function convertUrlToLocalPath(string $url): ?string
    {
        // Check if it's already a file path
        if (file_exists($url)) {
            return $url;
        }

        // Check if it's a file:// URL
        if (str_starts_with($url, 'file://')) {
            return str_replace('file://', '', $url);
        }

        // Check if it's a local domain URL (projectai.test)
        $appUrl = config('app.url');
        if (str_starts_with($url, $appUrl)) {
            // Convert URL to file path
            $relativePath = str_replace($appUrl, '', $url);
            
            // Handle storage URLs
            if (str_starts_with($relativePath, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $relativePath);
                return storage_path('app/public/' . $storagePath);
            }
            
            // Handle public URLs
            return public_path(ltrim($relativePath, '/'));
        }

        return null;
    }

    /**
     * Optimize image for AI processing to reduce memory usage
     */
    private function optimizeImageForAI(string $imagePath, string $mimeType): string
    {
        try {
            // Handle SVG files by converting them to PNG
            if ($mimeType === 'image/svg+xml') {
                return $this->convertSvgToPng($imagePath);
            }

            // For very large images, resize them to reduce memory usage
            $imageInfo = getimagesize($imagePath);
            if (!$imageInfo) {
                return file_get_contents($imagePath);
            }

            $width = $imageInfo[0];
            $height = $imageInfo[1];
            
            // If image is larger than 2048px on any side, resize it
            $maxDimension = 2048;
            if ($width > $maxDimension || $height > $maxDimension) {
                return $this->resizeImage($imagePath, $mimeType, $maxDimension);
            }

            return file_get_contents($imagePath);
        } catch (\Exception $e) {
            Log::warning('Failed to optimize image, using original: ' . $e->getMessage());
            return file_get_contents($imagePath);
        }
    }

    /**
     * Resize image to reduce memory usage
     */
    private function resizeImage(string $imagePath, string $mimeType, int $maxDimension): string
    {
        try {
            $imageInfo = getimagesize($imagePath);
            $width = $imageInfo[0];
            $height = $imageInfo[1];

            // Calculate new dimensions
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $newWidth = intval($width * $ratio);
            $newHeight = intval($height * $ratio);

            // Create image resource based on type
            $sourceImage = null;
            switch ($mimeType) {
                case 'image/jpeg':
                    $sourceImage = imagecreatefromjpeg($imagePath);
                    break;
                case 'image/png':
                    $sourceImage = imagecreatefrompng($imagePath);
                    break;
                case 'image/gif':
                    $sourceImage = imagecreatefromgif($imagePath);
                    break;
                case 'image/webp':
                    $sourceImage = imagecreatefromwebp($imagePath);
                    break;
                default:
                    return file_get_contents($imagePath);
            }

            if (!$sourceImage) {
                return file_get_contents($imagePath);
            }

            // Create new image
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG and GIF
            if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
                imagefill($resizedImage, 0, 0, $transparent);
            }

            // Resize the image
            imagecopyresampled($resizedImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            // Output to string
            ob_start();
            switch ($mimeType) {
                case 'image/jpeg':
                    imagejpeg($resizedImage, null, 85);
                    break;
                case 'image/png':
                    imagepng($resizedImage);
                    break;
                case 'image/gif':
                    imagegif($resizedImage);
                    break;
                case 'image/webp':
                    imagewebp($resizedImage, null, 85);
                    break;
            }
            $imageData = ob_get_contents();
            ob_end_clean();

            // Clean up
            imagedestroy($sourceImage);
            imagedestroy($resizedImage);

            Log::info("Image resized from {$width}x{$height} to {$newWidth}x{$newHeight}");
            
            return $imageData;
        } catch (\Exception $e) {
            Log::warning('Failed to resize image: ' . $e->getMessage());
            return file_get_contents($imagePath);
        }
    }

    /**
     * Convert SVG to PNG format for AI processing
     */
    private function convertSvgToPng(string $svgPath): string
    {
        try {
            // Read SVG content
            $svgContent = file_get_contents($svgPath);
            
            // Extract width and height from SVG if available
            $width = 800; // Default width
            $height = 600; // Default height
            
            if (preg_match('/width=["\'](\d+)["\']/', $svgContent, $matches)) {
                $width = intval($matches[1]);
            }
            if (preg_match('/height=["\'](\d+)["\']/', $svgContent, $matches)) {
                $height = intval($matches[1]);
            }
            
            // If width/height are too large, scale them down
            $maxDimension = 2048;
            if ($width > $maxDimension || $height > $maxDimension) {
                $ratio = min($maxDimension / $width, $maxDimension / $height);
                $width = intval($width * $ratio);
                $height = intval($height * $ratio);
            }

            // Create a canvas
            $image = imagecreatetruecolor($width, $height);
            
            // Set white background
            $white = imagecolorallocate($image, 255, 255, 255);
            imagefill($image, 0, 0, $white);
            
            // For simple SVG conversion, we'll create a basic representation
            // This is a simplified approach - for complex SVGs, you might need ImageMagick
            
            // Try to extract basic shapes and colors from SVG
            $this->renderBasicSvgElements($image, $svgContent, $width, $height);
            
            // Convert to PNG
            ob_start();
            imagepng($image);
            $pngData = ob_get_contents();
            ob_end_clean();
            
            // Clean up
            imagedestroy($image);
            
            Log::info("SVG converted to PNG: {$width}x{$height}");
            
            return $pngData;
        } catch (\Exception $e) {
            Log::warning('Failed to convert SVG to PNG: ' . $e->getMessage());
            // Fallback: return original SVG content (will likely fail at API level)
            return file_get_contents($svgPath);
        }
    }

    /**
     * Render basic SVG elements to GD image
     */
    private function renderBasicSvgElements($image, string $svgContent, int $width, int $height): void
    {
        try {
            // Extract and render rectangles
            if (preg_match_all('/<rect[^>]*x=["\'](\d+)["\'][^>]*y=["\'](\d+)["\'][^>]*width=["\'](\d+)["\'][^>]*height=["\'](\d+)["\'][^>]*fill=["\']([^"\']+)["\'][^>]*\/?>/', $svgContent, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    $x = intval($match[1]);
                    $y = intval($match[2]);
                    $rectWidth = intval($match[3]);
                    $rectHeight = intval($match[4]);
                    $color = $this->parseColor($match[5]);
                    
                    if ($color !== null) {
                        $gdColor = imagecolorallocate($image, $color[0], $color[1], $color[2]);
                        imagefilledrectangle($image, $x, $y, $x + $rectWidth, $y + $rectHeight, $gdColor);
                    }
                }
            }
            
            // Extract and render circles
            if (preg_match_all('/<circle[^>]*cx=["\'](\d+)["\'][^>]*cy=["\'](\d+)["\'][^>]*r=["\'](\d+)["\'][^>]*fill=["\']([^"\']+)["\'][^>]*\/?>/', $svgContent, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    $cx = intval($match[1]);
                    $cy = intval($match[2]);
                    $r = intval($match[3]);
                    $color = $this->parseColor($match[4]);
                    
                    if ($color !== null) {
                        $gdColor = imagecolorallocate($image, $color[0], $color[1], $color[2]);
                        imagefilledellipse($image, $cx, $cy, $r * 2, $r * 2, $gdColor);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to render SVG elements: ' . $e->getMessage());
        }
    }

    /**
     * Parse color from SVG format to RGB array
     */
    private function parseColor(string $color): ?array
    {
        $color = trim($color);
        
        // Handle hex colors
        if (str_starts_with($color, '#')) {
            $hex = ltrim($color, '#');
            if (strlen($hex) === 6) {
                return [
                    hexdec(substr($hex, 0, 2)),
                    hexdec(substr($hex, 2, 2)),
                    hexdec(substr($hex, 4, 2))
                ];
            }
        }
        
        // Handle named colors
        $namedColors = [
            'red' => [255, 0, 0],
            'green' => [0, 255, 0],
            'blue' => [0, 0, 255],
            'black' => [0, 0, 0],
            'white' => [255, 255, 255],
            'yellow' => [255, 255, 0],
            'cyan' => [0, 255, 255],
            'magenta' => [255, 0, 255],
        ];
        
        return $namedColors[strtolower($color)] ?? null;
    }

    /**
     * Analyze image with a specific prompt
     */
    public function analyzeImageWithPrompt(string $imagePath, string $prompt): string
    {
        try {
            // Convert local file path to URL if needed
            $imageUrl = $this->convertLocalPathToUrl($imagePath);
            
            // Use generateResponse with image analysis
            return $this->generateResponse($prompt, 'esr', [], 'persona', [$imageUrl]);
        } catch (\Exception $e) {
            Log::error('Image analysis failed: ' . $e->getMessage());
            return 'Gagal menganalisis gambar: ' . $e->getMessage();
        }
    }

    /**
     * Convert local file path to accessible URL
     */
    private function convertLocalPathToUrl(string $localPath): string
    {
        // If it's already a URL, return as is
        if (str_starts_with($localPath, 'http')) {
            return $localPath;
        }

        // Convert storage path to public URL
        if (str_contains($localPath, 'storage/app/')) {
            $relativePath = str_replace(storage_path('app/'), '', $localPath);
            return url('storage/' . $relativePath);
        }

        // For temp files, we need to copy to public storage first
        if (str_contains($localPath, 'temp/')) {
            $filename = basename($localPath);
            $publicPath = storage_path('app/public/temp/' . $filename);
            
            // Create directory if not exists
            if (!file_exists(dirname($publicPath))) {
                mkdir(dirname($publicPath), 0755, true);
            }
            
            // Copy file to public storage
            copy($localPath, $publicPath);
            
            return url('storage/temp/' . $filename);
        }

        // Default: assume it's already accessible
        return $localPath;
    }
}
