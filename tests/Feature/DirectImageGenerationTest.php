<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Services\AIService;
use Illuminate\Support\Facades\Log;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DIRECT IMAGE GENERATION TEST ===\n\n";

// Test message
$testMessage = "Buatkan gambar kucing lucu";

echo "🧪 Testing message: '{$testMessage}'\n\n";

try {
    // Create AIService instance
    $aiService = new AIService();
    
    // Test intent detection first
    $reflection = new ReflectionClass($aiService);
    $intentMethod = $reflection->getMethod('isTextToImagePrompt');
    $intentMethod->setAccessible(true);
    
    $isImageIntent = $intentMethod->invoke($aiService, $testMessage);
    echo "🎯 Image intent detected: " . ($isImageIntent ? 'YES ✅' : 'NO ❌') . "\n\n";
    
    if (!$isImageIntent) {
        echo "❌ Intent detection failed - this should be detected as image request\n";
        
        // Test individual detection methods
        $keywordMethod = $reflection->getMethod('enhancedKeywordDetection');
        $keywordMethod->setAccessible(true);
        $keywordDetected = $keywordMethod->invoke($aiService, $testMessage);
        echo "🔍 Keyword detection: " . ($keywordDetected ? 'YES ✅' : 'NO ❌') . "\n";
        
        // Test AI intent detection
        $aiIntentMethod = $reflection->getMethod('aiIntentDetection');
        $aiIntentMethod->setAccessible(true);
        $aiIntentDetected = $aiIntentMethod->invoke($aiService, $testMessage);
        echo "🤖 AI intent detection: " . ($aiIntentDetected ? 'YES ✅' : 'NO ❌') . "\n\n";
    }
    
    // Test direct API call to Gemini
    echo "=== TESTING DIRECT GEMINI API CALL ===\n";
    
    $geminiApiKey = config('ai.gemini_api_key');
    echo "🔑 API Key: " . (empty($geminiApiKey) ? 'NOT SET ❌' : 'SET ✅ (' . substr($geminiApiKey, 0, 10) . '...)') . "\n\n";
    
    if (!empty($geminiApiKey)) {
        $model = 'gemini-2.5-flash-image';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$geminiApiKey}";
        
        echo "🌐 Testing API endpoint: {$model}\n";
        
        $requestData = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $testMessage]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 8192,
            ]
        ];
        
        echo "📤 Sending request...\n";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        echo "📥 Response received:\n";
        echo "   HTTP Code: {$httpCode}\n";
        
        if ($error) {
            echo "   cURL Error: {$error}\n";
        }
        
        if ($response) {
            $data = json_decode($response, true);
            
            if ($httpCode === 200) {
                echo "   ✅ Success!\n";
                
                if (isset($data['candidates'][0]['content']['parts'])) {
                    $parts = $data['candidates'][0]['content']['parts'];
                    echo "   📊 Parts count: " . count($parts) . "\n";
                    
                    foreach ($parts as $index => $part) {
                        echo "   Part {$index}:\n";
                        if (isset($part['text'])) {
                            echo "     - Text: " . substr($part['text'], 0, 100) . "...\n";
                        }
                        if (isset($part['inlineData'])) {
                            echo "     - Image: " . strlen($part['inlineData']['data']) . " bytes\n";
                            echo "     - MIME: " . $part['inlineData']['mimeType'] . "\n";
                        }
                    }
                } else {
                    echo "   ⚠️ No content parts found\n";
                    echo "   Raw response: " . substr($response, 0, 500) . "...\n";
                }
            } else {
                echo "   ❌ API Error:\n";
                if (isset($data['error'])) {
                    echo "     Code: " . ($data['error']['code'] ?? 'Unknown') . "\n";
                    echo "     Message: " . ($data['error']['message'] ?? 'Unknown') . "\n";
                    echo "     Status: " . ($data['error']['status'] ?? 'Unknown') . "\n";
                }
                echo "   Raw response: " . substr($response, 0, 500) . "...\n";
            }
        } else {
            echo "   ❌ No response received\n";
        }
    }
    
    echo "\n=== TESTING AISERVICE GENERATE RESPONSE ===\n";
    
    // Test full AIService response
    $response = $aiService->generateResponse($testMessage, null, [], 'global');
    
    echo "📝 AIService Response:\n";
    echo "   Type: " . gettype($response) . "\n";
    
    if (is_array($response)) {
        echo "   Keys: " . implode(', ', array_keys($response)) . "\n";
        if (isset($response['response'])) {
            echo "   Response: " . substr($response['response'], 0, 200) . "...\n";
        }
        if (isset($response['image_url'])) {
            echo "   Image URL: " . $response['image_url'] . "\n";
        }
        if (isset($response['type'])) {
            echo "   Type: " . $response['type'] . "\n";
        }
    } else {
        echo "   Content: " . substr($response, 0, 200) . "...\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "📍 Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";