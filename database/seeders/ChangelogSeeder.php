<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Changelog;
use App\Models\User;

class ChangelogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first superadmin user as creator
        $superadmin = User::where('role', 'superadmin')->first();

        if (!$superadmin) {
            $this->command->warn('No superadmin user found. Please create a superadmin user first.');
            return;
        }

        $changelogs = [
            [
                'version' => 'v0.1.0',
                'release_date' => '2025-10-10',
                'type' => 'major',
                'title' => 'Initial Release',
                'description' => 'First stable release of the AI Chat Application with core features.',
                'changes' => [
                    'User authentication and authorization system',
                    'Real-time chat interface with AI integration',
                    'User management for superadmin',
                    'Responsive design with modern UI components',
                    'Basic settings and configuration management'
                ],
                'technical_notes' => [
                    'Built with Laravel 11 and React 18',
                    'Uses Inertia.js for seamless SPA experience',
                    'Tailwind CSS for styling with shadcn/ui components',
                    'SQLite database for development, MySQL for production'
                ],
                'is_published' => true,
                'created_by' => $superadmin->id,
            ],
            [
                'version' => 'v0.2.0',
                'release_date' => '2025-01-16',
                'type' => 'minor',
                'title' => 'Enhanced User Experience & Auto-Cleanup',
                'description' => 'Major improvements to user experience and automated chat history management.',
                'changes' => [
                    'Added automatic chat history cleanup system',
                    'Implemented scheduled tasks for data maintenance',
                    'Enhanced changelog management for superadmin',
                    'Improved UI/UX with better navigation',
                    'Added comprehensive documentation system'
                ],
                'technical_notes' => [
                    'New Artisan command: chat:cleanup-old-history',
                    'Scheduled task runs monthly on 1st at 02:00',
                    'Configurable retention period (default: 90 days)',
                    'Dry-run mode for testing cleanup operations',
                    'Batch processing for large datasets'
                ],
                'is_published' => true,
                'created_by' => $superadmin->id,
            ],
        ];

        foreach ($changelogs as $changelogData) {
            Changelog::create($changelogData);
        }

        $this->command->info('Changelog entries seeded successfully!');
    }
}
