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

    public function generateResponse(string $message, string $persona, array $chatHistory = [], string $chatType = 'persona'): string
    {
        try {
            // Get persona-specific provider or fallback to default
            $personaProviders = config('ai.persona_providers', []);
            $selectedProvider = $personaProviders[$persona] ?? $this->provider;
            
            return match ($selectedProvider) {
                'gemini' => $this->generateGeminiResponse($message, $persona, $chatHistory, $chatType),
                'openai' => $this->generateOpenAIResponse($message, $persona, $chatHistory, $chatType),
                default => $this->generateFallbackResponse($message, $persona, $chatType)
            };
        } catch (\Exception $e) {
            Log::error('AI Service Error: ' . $e->getMessage());
            return $this->generateFallbackResponse($message, $persona, $chatType);
        }
    }

    private function generateGeminiResponse(string $message, string $persona, array $chatHistory = [], string $chatType = 'persona'): string
    {
        if (empty($this->geminiApiKey) || $this->geminiApiKey === 'your_gemini_api_key_here') {
            return $this->generateFallbackResponse($message, $persona, $chatType);
        }

        // Get persona-specific Gemini model
        $geminiModels = config('ai.gemini_models', []);
        $selectedModel = $geminiModels[$persona] ?? 'gemini-pro';

        $systemPrompt = $this->getPersonaPrompt($persona, $chatType);
        $contextPrompt = $this->buildContextFromHistory($chatHistory);
        $fullPrompt = $systemPrompt . $contextPrompt . "\n\nPertanyaan: " . $message;

        $response = Http::timeout(30)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$selectedModel}:generateContent?key={$this->geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $fullPrompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 2048,
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
            Log::warning('Gemini model overloaded, attempting retry with gemini-pro');
            
            // Try with gemini-1.5-pro as fallback
             $fallbackResponse = Http::timeout(30)
                 ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={$this->geminiApiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $fullPrompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 2048,
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

    private function generateOpenAIResponse(string $message, string $persona, array $chatHistory = [], string $chatType = 'persona'): string
    {
        if (empty($this->openaiApiKey) || $this->openaiApiKey === 'your_openai_api_key_here') {
            return $this->generateFallbackResponse($message, $persona, $chatType);
        }

        // Get persona-specific OpenAI model
        $openaiModels = config('ai.openai_models', []);
        $selectedModel = $openaiModels[$persona] ?? $this->openaiModel;

        $systemPrompt = $this->getPersonaPrompt($persona, $chatType);
        $messages = $this->buildOpenAIMessages($systemPrompt, $chatHistory, $message);

        $response = Http::timeout(30)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $this->openaiApiKey,
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $selectedModel,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 1024,
            ]);

        if ($response->successful()) {
            $data = $response->json();
            return $data['choices'][0]['message']['content'] ?? $this->generateFallbackResponse($message, $persona, $chatType);
        }

        throw new \Exception('OpenAI API request failed: ' . $response->body());
    }

    private function getPersonaPrompt(string $persona, string $chatType = 'persona'): string
    {
        // Global chat type - general AI assistant
        if ($chatType === 'global') {
            return 'Anda adalah asisten AI yang cerdas dan membantu. Anda dapat membantu dengan berbagai topik dan pertanyaan umum. Berikan jawaban yang informatif, akurat, dan mudah dipahami. Jawab dalam bahasa Indonesia dengan ramah dan profesional.';
        }

        // Persona-specific prompts for different divisions
        $personas = [
            // Technical roles
            'engineer' => 'Anda adalah Insinyur Sipil yang berpengalaman dan mengkhususkan diri dalam desain dan analisis struktural. Anda dapat membantu dengan perhitungan struktural, spesifikasi material, kode bangunan, penilaian keamanan struktur, dan memberikan solusi teknis yang praktis. Jawab dalam bahasa Indonesia dengan profesional dan detail.',
            'drafter' => 'Anda adalah Drafter Teknis yang ahli dalam pembuatan gambar teknik dan dokumentasi. Anda dapat membantu dengan gambar CAD, spesifikasi teknis, pembuatan blueprint, standar gambar teknik, dan dokumentasi desain. Jawab dalam bahasa Indonesia dengan jelas dan terstruktur.',
            'esr' => 'Anda adalah spesialis Engineer Survey Report yang ahli dalam survei dan pengukuran. Anda dapat membantu dengan survei lokasi, analisis topografi, data pengukuran, interpretasi hasil survei, dan dokumentasi laporan survei. Jawab dalam bahasa Indonesia dengan akurat dan detail.',
            
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

    private function generateFallbackResponse(string $message, string $persona, string $chatType = 'persona'): string
    {
        // Global chat fallback
        if ($chatType === 'global') {
            $roleContext = 'Sebagai asisten AI global, saya dapat membantu Anda dengan berbagai topik dan pertanyaan umum.';
        } else {
            // Persona-specific fallbacks
            $personas = [
                // Technical roles
                'engineer' => 'Sebagai Insinyur Sipil yang mengkhususkan diri dalam desain dan analisis struktural, saya dapat membantu Anda dengan perhitungan, spesifikasi material, kode bangunan, dan penilaian struktural.',
                'drafter' => 'Sebagai Drafter Teknis, saya dapat membantu Anda dengan gambar CAD, spesifikasi teknis, pembuatan blueprint, dan dokumentasi desain.',
                'esr' => 'Sebagai spesialis Engineer Survey Report, saya dapat membantu Anda dengan survei lokasi, analisis topografi, data pengukuran, dan dokumentasi survei.',
                
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
        $configuredProvider = $personaProviders[$persona] ?? $this->provider;
        
        $configuredModel = 'default';
        if ($configuredProvider === 'openai') {
            $openaiModels = config('ai.openai_models', []);
            $configuredModel = $openaiModels[$persona] ?? 'gpt-4o';
        } elseif ($configuredProvider === 'gemini') {
            $geminiModels = config('ai.gemini_models', []);
            $configuredModel = $geminiModels[$persona] ?? 'gemini-1.5-pro';
        }
        
        return "$roleContext\n\nMengenai pesan Anda: \"$message\"\n\n[Mode Offline] Persona '$persona' dikonfigurasi menggunakan provider '$configuredProvider' dengan model '$configuredModel'. Saat ini sistem menggunakan respons simulasi. Untuk mengaktifkan AI yang sesungguhnya, silakan konfigurasi API key yang sesuai di file .env";
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
            $sender = $chat['sender'] === 'user' ? 'Pengguna' : 'AI';
            $context .= "\n{$sender}: {$chat['message']}";
        }
        
        $context .= "\n\nBerdasarkan konteks percakapan di atas, mohon berikan respons yang relevan dan konsisten.";
        
        return $context;
    }

    /**
     * Build messages array for OpenAI API with chat history
     */
    private function buildOpenAIMessages(string $systemPrompt, array $chatHistory, string $currentMessage): array
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
            $messages[] = [
                'role' => $chat['sender'] === 'user' ? 'user' : 'assistant',
                'content' => $chat['message']
            ];
        }

        // Add current message
        $messages[] = [
            'role' => 'user',
            'content' => $currentMessage
        ];

        return $messages;
    }
}