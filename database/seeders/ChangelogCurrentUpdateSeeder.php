<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Changelog;
use App\Models\User;

class ChangelogCurrentUpdateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first superadmin user as creator
        $superadmin = User::where('role', 'superadmin')->first();

        if (!$superadmin) {
            $this->command->warn('Pengguna superadmin tidak ditemukan. Silakan buat pengguna superadmin terlebih dahulu.');
            return;
        }

        $changelog = [
            'version' => 'v0.3.0',
            'release_date' => now()->format('Y-m-d'),
            'type' => 'patch',
            'title' => 'Perbaikan Bug & Peningkatan UI',
            'description' => 'Perbaikan bug kritis untuk jalur import dan peningkatan komponen UI dalam sistem manajemen changelog.',
            'changes' => [
                'Memperbaiki error jalur import di halaman changelog (Edit, Show, Create)',
                'Memperbaiki masalah tampilan breadcrumbs di semua halaman changelog',
                'Memperbaiki error TypeScript komponen Badge dengan menghapus prop size yang tidak valid',
                'Meningkatkan penanganan error dan stabilitas build',
                'Meningkatkan pengalaman pengguna dengan navigasi breadcrumbs yang tepat'
            ],
            'technical_notes' => [
                'Memperbarui jalur import dari @/routes/changelog ke @/routes/admin/changelog',
                'Memperbaiki ketidaksesuaian properti breadcrumb (label vs title) di interface BreadcrumbItem',
                'Menghapus prop size yang tidak valid dari komponen Badge di Show.tsx',
                'Semua error kompilasi TypeScript telah diselesaikan',
                'Proses build sekarang berhasil diselesaikan tanpa error'
            ],
            'is_published' => true,
            'created_by' => $superadmin->id,
        ];

        // Periksa apakah versi ini sudah ada
        $existingChangelog = Changelog::where('version', $changelog['version'])->first();
        
        if ($existingChangelog) {
            $this->command->warn("Changelog versi {$changelog['version']} sudah ada. Melewati...");
            return;
        }

        Changelog::create($changelog);

        $this->command->info("Entry changelog untuk versi {$changelog['version']} berhasil dibuat!");
    }
}