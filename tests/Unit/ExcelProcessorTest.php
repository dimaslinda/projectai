<?php

use App\Services\ExcelProcessor;
use App\Services\AIService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

uses(Tests\TestCase::class);

beforeEach(function () {
    // Mock AIService
    $this->aiServiceMock = Mockery::mock(AIService::class);
    $this->excelProcessor = new ExcelProcessor($this->aiServiceMock);
    
    // Ensure storage directories exist
    Storage::fake('local');
    Storage::fake('public');
});

afterEach(function () {
    Mockery::close();
});

test('excel processor can configure for large files', function () {
    expect($this->excelProcessor)->toBeInstanceOf(ExcelProcessor::class);
    expect(ini_get('max_execution_time'))->toBeGreaterThan(0);
    expect(ini_get('memory_limit'))->not->toBeEmpty();
});

test('can extract google drive file id', function () {
    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('extractGoogleDriveFileId');
    $method->setAccessible(true);

    // Test valid Google Drive URLs
    $validUrls = [
        'https://drive.google.com/file/d/1ABC123DEF456/view?usp=sharing' => '1ABC123DEF456',
        'https://drive.google.com/open?id=1XYZ789ABC123' => '1XYZ789ABC123',
        'https://drive.google.com/uc?id=1TEST123&export=download' => '1TEST123'
    ];

    foreach ($validUrls as $url => $expectedId) {
        $result = $method->invoke($this->excelProcessor, $url);
        expect($result)->toBe($expectedId);
    }

    // Test invalid URLs
    $invalidUrls = [
        'https://example.com/file.jpg',
        'not-a-url',
        '',
        null
    ];

    foreach ($invalidUrls as $url) {
        $result = $method->invoke($this->excelProcessor, $url);
        expect($result)->toBeNull();
    }
});

test('can check timeout approaching', function () {
    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('isApproachingTimeout');
    $method->setAccessible(true);

    // Test with recent start time (should not be approaching timeout)
    $recentStartTime = microtime(true);
    $result = $method->invoke($this->excelProcessor, $recentStartTime);
    expect($result)->toBeFalse();

    // Test with old start time (should be approaching timeout)
    $oldStartTime = microtime(true) - 300; // 5 minutes ago
    $result = $method->invoke($this->excelProcessor, $oldStartTime, 30);
    expect($result)->toBeTrue();
});

test('can force garbage collection', function () {
    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('forceGarbageCollection');
    $method->setAccessible(true);

    // This should not throw any exceptions
    expect(fn() => $method->invoke($this->excelProcessor))->not->toThrow(Exception::class);
});

test('can convert bytes correctly', function () {
    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('convertToBytes');
    $method->setAccessible(true);

    $testCases = [
        '1024' => 1024,
        '1K' => 1024,
        '1M' => 1024 * 1024,
        '1G' => 1024 * 1024 * 1024,
        '512M' => 512 * 1024 * 1024,
        '2G' => 2 * 1024 * 1024 * 1024
    ];

    foreach ($testCases as $input => $expected) {
        $result = $method->invoke($this->excelProcessor, $input);
        expect($result)->toBe($expected);
    }
});

test('handles download failure gracefully', function () {
    // Mock HTTP response failure
    Http::fake([
        'drive.google.com/*' => Http::response('Not Found', 404)
    ]);

    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('downloadPhotoFromGoogleDriveWithTimeout');
    $method->setAccessible(true);

    $result = $method->invoke($this->excelProcessor, 'https://drive.google.com/file/d/invalid/view', microtime(true));
    
    expect($result['success'])->toBeFalse();
    expect($result)->toHaveKey('error');
});

test('can perform maintenance operations', function () {
    // Create test files using Storage fake
    Storage::disk('local')->put('temp/temp_old_file.jpg', 'test content');
    Storage::disk('local')->put('temp/temp_recent_file.jpg', 'test content');

    $result = $this->excelProcessor->performMaintenance();

    expect($result)->toHaveKeys(['temp_files_cleaned', 'memory_freed', 'errors']);
});

test('handles memory management properly', function () {
    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('aggressiveMemoryCleanup');
    $method->setAccessible(true);

    $memoryBefore = memory_get_usage(true);
    $method->invoke($this->excelProcessor);
    $memoryAfter = memory_get_usage(true);

    // Memory usage should not increase after cleanup
    expect($memoryAfter)->toBeLessThanOrEqual($memoryBefore);
});

test('handles invalid template path', function () {
    $result = $this->excelProcessor->copyTemplateAndClearPhotos('/invalid/path/template.xlsx');
    
    expect($result['success'])->toBeFalse();
    expect($result)->toHaveKey('error');
});

test('validates google drive file id extraction', function () {
    $reflection = new ReflectionClass($this->excelProcessor);
    $method = $reflection->getMethod('extractGoogleDriveFileId');
    $method->setAccessible(true);

    // Test with invalid URL
    $result = $method->invoke($this->excelProcessor, 'not-a-google-drive-url');
    expect($result)->toBeNull();
    
    // Test with empty URL
    $result = $method->invoke($this->excelProcessor, '');
    expect($result)->toBeNull();
});