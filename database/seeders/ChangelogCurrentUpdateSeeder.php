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
            'version' => 'v1.1.1',
            'release_date' => now()->format('Y-m-d'),
            'type' => 'patch',
            'title' => 'Perbaikan UI Chat & Notifikasi Changelog (Terbaru Saja)',
            'description' => 'Peningkatan pengalaman pengguna: pesan dan blok kode kini tampil rapi tanpa keluar batas, dan notifikasi changelog hanya menampilkan update terbaru yang relevan.',
            'changes' => [
                '💬 Pesan AI dan teks panjang kini terbungkus rapi (tidak keluar batas).',
                '🧩 Blok kode panjang dapat digulir secara horizontal jika diperlukan.',
                '🔗 Teks, URL, dan kode inline otomatis terpecah baris agar tetap terbaca.',
                '🔔 Notifikasi changelog di lonceng hanya menampilkan satu update terbaru.',
                '🪧 Banner changelog di dashboard hanya muncul untuk update terbaru yang belum dilihat.',
                '✅ Tombol “Tandai dibaca” tersedia langsung dari notifikasi terbaru.',
                '⚙️ Stabilitas pemilihan model di halaman chat lebih baik.',
                '📱 Peningkatan responsivitas di beberapa komponen untuk kenyamanan penggunaan.'
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
