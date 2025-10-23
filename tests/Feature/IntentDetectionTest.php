<?php

require_once 'vendor/autoload.php';

// Test the enhanced keyword detection patterns
function testEnhancedKeywordDetection(string $message): bool
{
    $message = strtolower($message);

    // Enhanced patterns that cover more natural language
    $patterns = [
        // Direct image requests
        '/\b(buat|buatkan|bikin|bikinkan|generate|create|make)\s+.*\b(gambar|image|picture|foto|ilustrasi)\b/i',
        '/\bgambarkan\b/i',
        '/\b(draw|paint|sketch|illustrate|design)\b/i',

        // Visual requests
        '/\b(lihat|melihat|tunjukkan|tampilkan|perlihatkan)\s+.*\b(gambar|image|picture|visual)\b/i',
        '/\b(seperti apa|bagaimana bentuk|bagaimana rupa)\b/i',
        '/\bvisualisasi\b/i',

        // Want to see something
        '/\b(ingin|mau|pengen)\s+.*\b(lihat|melihat)\s+.*\b(gambar|image)\b/i',
        '/\bshow me\b/i',

        // Creative requests
        '/\b(seni|art|kreasi|desain)\b/i'
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $message)) {
            echo "✅ Pattern matched: $pattern\n";
            return true;
        }
    }

    return false;
}

// Test messages
$testMessages = [
    "Saya ingin melihat gambar kucing lucu",
    "Bagaimana bentuk robot futuristik itu?",
    "Tunjukkan gambar sunset di pantai",
    "Bisakah kamu gambarkan pemandangan gunung?",
    "buatkan gambar kucing",
    "Hello, how are you?",
    "What is the weather today?"
];

echo "Testing Enhanced Keyword Detection:\n";
echo "==================================\n\n";

foreach ($testMessages as $message) {
    echo "Testing: \"$message\"\n";
    $result = testEnhancedKeywordDetection($message);
    echo "Result: " . ($result ? "✅ IMAGE INTENT DETECTED" : "❌ NO IMAGE INTENT") . "\n\n";
}