<?php

use App\Services\AIService;

it('can detect image editing prompts correctly', function () {
    $aiService = new AIService();
    
    $editingMessages = [
        "edit this photo",
        "ubah warna background foto ini",
        "hapus objek di gambar",
        "crop gambar ini",
        "buat foto ini jadi hitam putih"
    ];
    
    foreach ($editingMessages as $message) {
        $isEditingPrompt = $aiService->isImageEditingPrompt($message);
        expect($isEditingPrompt)->toBeTrue("Message '$message' should be detected as image editing prompt");
    }
});

it('can correctly ignore non-editing prompts', function () {
    $aiService = new AIService();
    
    $nonEditingMessages = [
        "apa itu AI?",
        "buatkan gambar kucing",
        "generate image of a sunset",
        "jelaskan tentang machine learning"
    ];
    
    foreach ($nonEditingMessages as $message) {
        $isEditingPrompt = $aiService->isImageEditingPrompt($message);
        expect($isEditingPrompt)->toBeFalse("Message '$message' should not be detected as image editing prompt");
    }
});