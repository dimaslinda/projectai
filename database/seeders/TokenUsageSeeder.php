<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ChatHistory;
use Illuminate\Support\Facades\DB;

class TokenUsageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update existing chat histories with random token data
        $histories = ChatHistory::whereNull('input_tokens')->take(20)->get();
        
        foreach ($histories as $history) {
            $inputTokens = rand(50, 500);
            $outputTokens = rand(100, 800);
            $totalTokens = $inputTokens + $outputTokens;
            
            $history->update([
                'input_tokens' => $inputTokens,
                'output_tokens' => $outputTokens,
                'total_tokens' => $totalTokens,
            ]);
        }
        
        $this->command->info('Updated ' . $histories->count() . ' chat histories with token data');
    }
}