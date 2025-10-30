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
            'version' => 'v1.1.2',
            'release_date' => now()->format('Y-m-d'),
            'type' => 'patch',
            'title' => 'Penyederhanaan Pembuatan Sesi Chat & Perbaikan Dialog',
            'description' => 'Sekarang, pengguna umum, admin, dan superadmin langsung menggunakan Chat Global tanpa langkah pemilihan. Pengguna Drafter dan Engineer tetap dapat memilih tipe chat. Dialog pembuatan chat kini bisa digulir sehingga tombol aksi terlihat sepenuhnya.',
            'changes' => [
                '⚡ Pembuatan sesi untuk pengguna umum, admin, dan superadmin langsung ke Chat Global (tanpa memilih).',
                '🛡️ Drafter dan Engineer tetap dapat memilih antara Chat Global atau Chat Persona.',
                '🖱️ Dialog pembuatan chat dapat digulir (scroll) agar tombol selalu terlihat.',
                '🎯 Pengalaman pengguna lebih sederhana dan cepat saat membuat sesi chat.'
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
