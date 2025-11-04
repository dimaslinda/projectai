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
            'version' => 'v1.1.3',
            'release_date' => now()->format('Y-m-d'),
            'type' => 'minor',
            'title' => 'Banner Install PWA & Ikon Logo Aplikasi',
            'description' => 'Sekarang Anda dapat memasang aplikasi ke desktop maupun ponsel dengan lebih mudah. Kami menambahkan banner “Install” yang muncul otomatis saat perangkat mendukung pemasangan PWA. Di iOS Safari, ditampilkan panduan untuk menambahkan aplikasi ke layar utama. Ikon aplikasi juga telah diganti ke logo resmi untuk pengalaman yang lebih konsisten.',
            'changes' => [
                '📲 Banner ajakan memasang aplikasi (Install) muncul di bagian bawah saat perangkat mendukung.',
                '🖥️ Aplikasi dapat dipasang di desktop (Chrome/Edge) dan mobile Android.',
                '🍎 iOS Safari menampilkan instruksi “Share → Add to Home Screen”.',
                '🎨 Ikon aplikasi diperbarui menggunakan logo resmi proyek di seluruh tampilan.',
                '✅ Perbaikan deteksi PWA (manifest & service worker) agar instalasi lebih lancar.'
            ],
            // Tidak menyertakan catatan teknis, fokus pada informasi untuk pengguna umum
            'technical_notes' => [],
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
