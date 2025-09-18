# Panduan Integrasi AI - Gemini & OpenAI

Aplikasi ini mendukung integrasi dengan dua provider AI:
- **Google Gemini** (Rekomendasi)
- **OpenAI GPT**

## Konfigurasi

### 1. Pilih Provider AI

#### Konfigurasi Global (Fallback)
Di file `.env`, atur provider default:

```env
# Provider default untuk semua persona
AI_PROVIDER=gemini
```

#### Konfigurasi Per Persona (Rekomendasi)
Anda dapat mengatur provider yang berbeda untuk setiap persona:

```env
# Provider khusus untuk setiap persona
AI_PROVIDER_ENGINEER=openai    # Engineer menggunakan OpenAI
AI_PROVIDER_DRAFTER=gemini     # Drafter menggunakan Gemini
AI_PROVIDER_ESR=gemini         # ESR menggunakan Gemini
```

**Keunggulan Konfigurasi Per Persona:**
- ✅ Fleksibilitas maksimal - setiap divisi bisa menggunakan AI yang berbeda
- ✅ Optimasi cost - gunakan provider gratis untuk beberapa persona
- ✅ Optimasi kualitas - gunakan provider premium untuk persona yang membutuhkan
- ✅ Fallback otomatis ke provider global jika tidak dikonfigurasi

### 2. Konfigurasi Google Gemini (Rekomendasi)

#### Mendapatkan API Key:
1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google
3. Klik "Create API Key"
4. Salin API key yang dihasilkan

#### Konfigurasi di .env:
```env
# Jika semua persona menggunakan Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Atau konfigurasi per persona
AI_PROVIDER_ENGINEER=gemini
AI_PROVIDER_DRAFTER=gemini
AI_PROVIDER_ESR=gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

#### Keunggulan Gemini:
- ✅ **Gratis** untuk penggunaan personal
- ✅ Rate limit yang generous
- ✅ Mendukung bahasa Indonesia dengan baik
- ✅ Response time yang cepat

### 3. Konfigurasi OpenAI (Alternatif)

#### Mendapatkan API Key:
1. Kunjungi [OpenAI Platform](https://platform.openai.com/api-keys)
2. Login atau daftar akun OpenAI
3. Klik "Create new secret key"
4. Salin API key yang dihasilkan

#### Konfigurasi di .env:
```env
# Jika semua persona menggunakan OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=your_actual_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Atau konfigurasi per persona
AI_PROVIDER_ENGINEER=openai
AI_PROVIDER_DRAFTER=openai
AI_PROVIDER_ESR=openai
OPENAI_API_KEY=your_actual_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

#### Model yang Tersedia:
- `gpt-3.5-turbo` (Rekomendasi untuk cost-effective)
- `gpt-4` (Lebih canggih tapi lebih mahal)
- `gpt-4-turbo-preview` (Versi terbaru)

#### Catatan OpenAI:
- ⚠️ **Berbayar** - memerlukan credit di akun
- ⚠️ Rate limit berdasarkan tier akun
- ✅ Kualitas response yang sangat baik

## Mode Fallback

Jika API key tidak dikonfigurasi atau terjadi error, sistem akan otomatis menggunakan mode fallback dengan response simulasi.

### 4. Konfigurasi Model Dinamis per Persona

Sistem mendukung konfigurasi model yang berbeda untuk setiap persona, memberikan kontrol granular atas kualitas dan biaya AI:

```env
# Provider default (fallback)
AI_PROVIDER=gemini

# Konfigurasi provider per persona
AI_PROVIDER_ENGINEER=openai    # Engineer menggunakan OpenAI
AI_PROVIDER_DRAFTER=gemini     # Drafter menggunakan Gemini
AI_PROVIDER_ESR=gemini         # ESR menggunakan Gemini

# API Keys untuk kedua provider
GEMINI_API_KEY=your_actual_gemini_api_key_here
OPENAI_API_KEY=your_actual_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Model configuration per persona
# OpenAI models: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview, gpt-4o (latest & best)
OPENAI_MODEL_ENGINEER=gpt-4o           # Engineer menggunakan GPT-4o (terbaru & terbaik)
OPENAI_MODEL_DRAFTER=gpt-4o            # Drafter menggunakan GPT-4o (terbaru & terbaik)
OPENAI_MODEL_ESR=gpt-4o                # ESR menggunakan GPT-4o (terbaru & terbaik)

# Gemini models: gemini-1.5-flash, gemini-2.5-pro (latest & best)
GEMINI_MODEL_ENGINEER=gemini-2.5-pro   # Engineer menggunakan Gemini 2.5 Pro (terbaru & terbaik)
GEMINI_MODEL_DRAFTER=gemini-2.5-pro    # Drafter menggunakan Gemini 2.5 Pro (terbaru & terbaik)
GEMINI_MODEL_ESR=gemini-2.5-pro        # ESR menggunakan Gemini 2.5 Pro (terbaru & terbaik)
```

**Keunggulan Menggunakan Model AI Terbaru & Terbaik:**
- 🏆 **Kualitas Output Terbaik**: Model terbaru memberikan respons dengan akurasi dan relevansi tertinggi
- 🧠 **Kemampuan Reasoning Canggih**: Gemini 2.5 Pro memiliki kemampuan thinking dan analisis yang superior
- 📋 **Multimodal Support**: Mendukung berbagai jenis input (teks, gambar, audio, video, PDF)
- 📄 **Context Window Besar**: Dapat memproses hingga 1M+ token untuk dokumen dan kode yang sangat panjang
- 💻 **Advanced Coding**: Kemampuan coding dan debugging yang sangat canggih
- 🔮 **Future-Ready**: Selalu menggunakan teknologi AI terdepan yang tersedia

**Contoh Skenario Penggunaan:**
- **Engineer**: Menggunakan GPT-4o untuk analisis struktural kompleks dengan akurasi dan reasoning terdepan
- **Drafter**: Menggunakan Gemini-2.5-Pro untuk pembuatan dokumentasi teknis dengan kualitas terbaik
- **ESR**: Menggunakan model terbaru untuk laporan survei dengan presisi dan detail maksimal

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

### Error: "API key tidak valid"
- Pastikan API key sudah benar
- Periksa apakah API key masih aktif
- Untuk OpenAI, pastikan akun memiliki credit

### Error: "Rate limit exceeded"
- Tunggu beberapa menit sebelum mencoba lagi
- Untuk OpenAI, upgrade tier akun jika diperlukan

### Error: "Network timeout"
- Periksa koneksi internet
- Coba ganti provider AI

## Keamanan

⚠️ **PENTING**: 
- Jangan commit file `.env` ke repository
- Jangan share API key di public
- Gunakan environment variables di production
- Rotasi API key secara berkala

## Monitoring

Semua error AI akan dicatat di log Laravel. Monitor file:
```
storage/logs/laravel.log
```

Untuk production, pertimbangkan menggunakan monitoring service seperti Sentry atau Bugsnag.