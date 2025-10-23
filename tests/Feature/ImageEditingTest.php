<?php

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\AIService;
use Illuminate\Support\Facades\Log;

// Test messages
$editingMessages = [
    "edit this photo",
    "ubah warna background foto ini",
    "hapus objek di gambar",
    "crop gambar ini",
    "buat foto ini jadi hitam putih"
];

$nonEditingMessages = [
    "apa itu AI?",
    "buatkan gambar kucing",
    "generate image of a sunset",
    "jelaskan tentang machine learning"
];

echo "Testing Image Editing Detection\n";
echo "===============================\n\n";

try {
    // Create AIService instance
    $aiService = new AIService();

    echo "1. Testing Image Editing Prompts:\n";
    echo "--------------------------------\n";
    
    foreach ($editingMessages as $message) {
        $isEditingPrompt = $aiService->isImageEditingPrompt($message);
        $status = $isEditingPrompt ? "✅ DETECTED" : "❌ NOT DETECTED";
        echo "   \"$message\" -> $status\n";
    }

    echo "\n2. Testing Non-Editing Prompts:\n";
    echo "-------------------------------\n";
    
    foreach ($nonEditingMessages as $message) {
        $isEditingPrompt = $aiService->isImageEditingPrompt($message);
        $status = $isEditingPrompt ? "❌ FALSE POSITIVE" : "✅ CORRECTLY IGNORED";
        echo "   \"$message\" -> $status\n";
    }

    echo "\n✅ Image Editing Detection Test Completed Successfully!\n";

} catch (Exception $e) {
    echo "❌ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}