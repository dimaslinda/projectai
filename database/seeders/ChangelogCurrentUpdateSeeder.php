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
            'version' => 'v1.1.0',
            'release_date' => now()->format('Y-m-d'),
            'type' => 'major',
            'title' => 'Perbaikan Fitur Pengeditan Gambar AI & Peningkatan Sistem Pelaporan',
            'description' => 'Update besar yang memperbaiki fitur pengeditan gambar AI agar dapat menghasilkan gambar yang diedit secara langsung, plus implementasi sistem pelaporan penggunaan token AI yang komprehensif dengan dashboard analitik dan visualisasi data real-time.',
            'changes' => [
                '🎨 PERBAIKAN BESAR: Fitur pengeditan gambar AI sekarang dapat menghasilkan gambar yang diedit secara langsung',
                '✨ Upload gambar dan berikan instruksi editing (contoh: "ubah menjadi hitam putih", "hapus background", "ganti warna")',
                '🖼️ AI akan menghasilkan gambar hasil editing yang dapat langsung diunduh dan digunakan',
                '🔧 Memperbaiki error "This model only supports text output" pada fitur editing gambar',
                '📊 Menambahkan sistem tracking penggunaan token AI untuk monitoring konsumsi',
                '📈 Implementasi widget laporan pengguna dengan grafik interaktif di dashboard',
                '🥧 Menambahkan visualisasi penggunaan token per persona dengan diagram pie',
                '📉 Implementasi grafik tren penggunaan token harian',
                '📋 Menambahkan kartu statistik penggunaan token (total, rata-rata, efisiensi)',
                '🎯 Perbaikan UI/UX banner notifikasi dengan positioning yang lebih baik',
                '🛡️ Memperbaiki masalah error pada komponen chat yang dapat menyebabkan aplikasi crash'
            ],
            'technical_notes' => [
                'Fitur pengeditan gambar kini menggunakan model Gemini 2.5 Flash Image yang mendukung text-and-image-to-image generation',
                'Sistem dapat memproses berbagai jenis instruksi editing: perubahan warna, penghapusan objek, penambahan elemen, filter, dan enhancement',
                'Gambar hasil editing disimpan secara otomatis dan dapat diakses melalui URL yang aman',
                'Sistem tracking token terintegrasi dengan database untuk akurasi data real-time',
                'Widget laporan responsif dan kompatibel dengan berbagai ukuran layar',
                'Notifikasi changelog kini dapat diakses dari semua halaman aplikasi',
                'Peningkatan stabilitas aplikasi dengan perbaikan error handling pada komponen chat',
                'Optimasi performa untuk pengalaman pengguna yang lebih lancar'
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
