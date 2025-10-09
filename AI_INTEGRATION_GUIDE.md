# Panduan Integrasi AI - Gemini

Aplikasi ini sekarang hanya mendukung integrasi dengan satu provider AI:
- Google Gemini (Rekomendasi dan satu-satunya)

## Konfigurasi

### 1. Pilih Provider AI

#### Konfigurasi Global (Fallback)
Di file `.env`, atur provider default:

```env
# Provider default untuk semua persona
AI_PROVIDER=gemini
```

#### Konfigurasi Per Persona (Tetap Didukung)
Anda dapat mengatur model Gemini yang berbeda untuk setiap persona:

```env
# Provider khusus untuk setiap persona (semua menggunakan Gemini)
AI_PROVIDER_ENGINEER=gemini
AI_PROVIDER_DRAFTER=gemini
AI_PROVIDER_ESR=gemini
```

### 2. Konfigurasi Google Gemini (Rekomendasi)

#### Mendapatkan API Key:
1. Kunjungi Google AI Studio (Makersuite) untuk membuat API Key
2. Login dengan akun Google
3. Klik "Create API Key"
4. Salin API key yang dihasilkan

#### Konfigurasi di .env:
```env
# Semua persona menggunakan Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Opsi: set model Gemini per persona
GEMINI_MODEL_ENGINEER=gemini-2.5-pro
GEMINI_MODEL_DRAFTER=gemini-2.5-pro
GEMINI_MODEL_ESR=gemini-2.5-pro
```

#### Keunggulan Gemini:
- Gratis untuk penggunaan personal
- Rate limit yang cukup longgar
- Mendukung bahasa Indonesia dengan baik
- Response time yang cepat

### 3. Konfigurasi OpenAI (Tidak lagi didukung)
OpenAI tidak lagi didukung di aplikasi ini. Semua fungsionalitas AI telah disederhanakan untuk menggunakan Google Gemini saja.

## Mode Fallback

Jika API key tidak dikonfigurasi atau terjadi error, sistem akan otomatis menggunakan mode fallback dengan response simulasi.

### 4. Konfigurasi Model Dinamis per Persona

Sistem mendukung konfigurasi model Gemini yang berbeda untuk setiap persona, memberikan kontrol granular atas kualitas dan biaya AI:

```env
# Provider default (fallback)
AI_PROVIDER=gemini

# Konfigurasi provider per persona (tetap Gemini)
AI_PROVIDER_ENGINEER=gemini
AI_PROVIDER_DRAFTER=gemini
AI_PROVIDER_ESR=gemini

# API Key untuk Gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Model configuration per persona (Gemini)
# Gemini models: gemini-1.5-flash, gemini-2.5-pro (latest & best)
GEMINI_MODEL_ENGINEER=gemini-2.5-pro
GEMINI_MODEL_DRAFTER=gemini-2.5-pro
GEMINI_MODEL_ESR=gemini-2.5-pro
```

Keunggulan Menggunakan Model AI Terbaru & Terbaik:
- Kualitas Output Terbaik
- Kemampuan Reasoning Canggih
- Multimodal Support (teks, gambar, audio, video, PDF)
- Context Window Besar
- Advanced Coding
- Future-Ready

Contoh Skenario Penggunaan:
- Engineer: Menggunakan Gemini 2.5 Pro untuk analisis struktural kompleks
- Drafter: Menggunakan Gemini 2.5 Pro untuk pembuatan dokumentasi teknis
- ESR: Menggunakan Gemini 2.5 Pro untuk laporan survei

## Testing

Setelah konfigurasi:

1. Restart development server:
   ```bash
   php artisan serve
   ```

2. Buat sesi chat baru di aplikasi
3. Kirim pesan untuk menguji response AI
4. Periksa log di `storage/logs/laravel.log` jika ada error

## Troubleshooting

Error: "API key tidak valid"
- Pastikan API key sudah benar
- Periksa apakah API key masih aktif

Error: "Rate limit exceeded"
- Tunggu beberapa menit sebelum mencoba lagi

Error: "Network timeout"
- Periksa koneksi internet

## Keamanan

PENTING:
- Jangan commit file `.env` ke repository
- Jangan share API key di public
- Gunakan environment variables di production
- Rotasi API key secara berkala

## Monitoring

Semua error AI akan dicatat di log Laravel. Monitor file:

storage/logs/laravel.log

Untuk production, pertimbangkan menggunakan monitoring service seperti Sentry atau Bugsnag.