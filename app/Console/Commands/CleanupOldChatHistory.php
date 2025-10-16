<?php

namespace App\Console\Commands;

use App\Models\ChatHistory;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CleanupOldChatHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chat:cleanup-old-history {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete chat history older than 36 months to maintain database performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting chat history cleanup process...');
        
        // Calculate the cutoff date (36 months ago)
        $cutoffDate = Carbon::now()->subMonths(36);
        
        $this->info("Cutoff date: {$cutoffDate->format('Y-m-d H:i:s')}");
        $this->info('Chat history older than this date will be deleted.');
        
        // Count records that will be deleted
        $oldRecordsCount = ChatHistory::where('created_at', '<', $cutoffDate)->count();
        
        if ($oldRecordsCount === 0) {
            $this->info('No old chat history found. Nothing to delete.');
            return Command::SUCCESS;
        }
        
        $this->warn("Found {$oldRecordsCount} chat history records older than 36 months.");
        
        // If dry-run option is used, just show what would be deleted
        if ($this->option('dry-run')) {
            $this->info('DRY RUN MODE: No records will be actually deleted.');
            
            // Show some sample records that would be deleted
            $sampleRecords = ChatHistory::where('created_at', '<', $cutoffDate)
                ->select('id', 'user_id', 'chat_session_id', 'sender', 'created_at')
                ->orderBy('created_at')
                ->limit(10)
                ->get();
            
            if ($sampleRecords->isNotEmpty()) {
                $this->info('Sample records that would be deleted:');
                $this->table(
                    ['ID', 'User ID', 'Session ID', 'Sender', 'Created At'],
                    $sampleRecords->map(function ($record) {
                        return [
                            $record->id,
                            $record->user_id,
                            $record->chat_session_id,
                            $record->sender,
                            $record->created_at->format('Y-m-d H:i:s')
                        ];
                    })->toArray()
                );
            }
            
            return Command::SUCCESS;
        }
        
        // Ask for confirmation before deleting
        if (!$this->confirm("Are you sure you want to delete {$oldRecordsCount} chat history records?")) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }
        
        // Perform the deletion in chunks to avoid memory issues
        $deletedCount = 0;
        $chunkSize = 1000;
        
        $this->info('Starting deletion process...');
        $progressBar = $this->output->createProgressBar($oldRecordsCount);
        $progressBar->start();
        
        ChatHistory::where('created_at', '<', $cutoffDate)
            ->chunkById($chunkSize, function ($records) use (&$deletedCount, $progressBar) {
                $chunkDeletedCount = $records->count();
                
                // Delete the chunk
                ChatHistory::whereIn('id', $records->pluck('id'))->delete();
                
                $deletedCount += $chunkDeletedCount;
                $progressBar->advance($chunkDeletedCount);
            });
        
        $progressBar->finish();
        $this->newLine();
        
        $this->info("Successfully deleted {$deletedCount} chat history records.");
        $this->info('Chat history cleanup completed successfully!');
        
        return Command::SUCCESS;
    }
}
