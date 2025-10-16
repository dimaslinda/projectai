# Chat History Auto-Cleanup

## Overview

Fitur ini secara otomatis menghapus chat history yang lebih dari 36 bulan untuk menjaga performa database dan menghemat storage.

## Komponen

### 1. Artisan Command

**File**: `app/Console/Commands/CleanupOldChatHistory.php`

**Command**: `php artisan chat:cleanup-old-history`

**Opsi**:
- `--dry-run`: Menampilkan data yang akan dihapus tanpa benar-benar menghapus

**Fitur**:
- Menghapus chat history yang lebih dari 36 bulan berdasarkan `created_at`
- Progress bar untuk proses penghapusan
- Konfirmasi sebelum menghapus
- Chunked deletion untuk menghindari memory issues
- Logging output ke file

### 2. Scheduled Task

**File**: `bootstrap/app.php`

**Schedule**: Setiap bulan pada tanggal 1 jam 2:00 AM

**Konfigurasi**:
```php
$schedule->command('chat:cleanup-old-history')
    ->monthly()
    ->at('02:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/chat-cleanup.log'));
```

## Penggunaan

### Manual Execution

```bash
# Dry run - lihat apa yang akan dihapus
php artisan chat:cleanup-old-history --dry-run

# Eksekusi sebenarnya
php artisan chat:cleanup-old-history
```

### Melihat Schedule

```bash
# Lihat daftar scheduled tasks
php artisan schedule:list

# Jalankan scheduler (untuk testing)
php artisan schedule:run
```

### Monitoring

Log output disimpan di: `storage/logs/chat-cleanup.log`

## Database Impact

### Target Table
- `chat_histories` - menghapus records dengan `created_at < 36 months ago`

### Performance Considerations
- Menggunakan chunked deletion (1000 records per chunk)
- Index pada `created_at` untuk query yang efisien
- Background execution untuk menghindari timeout

## Production Setup

### 1. Cron Job Setup

Tambahkan ke crontab server:
```bash
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

### 2. Monitoring

- Check log file: `storage/logs/chat-cleanup.log`
- Monitor database size sebelum dan sesudah cleanup
- Set up alerts jika cleanup gagal

### 3. Backup Strategy

Pastikan backup database dilakukan sebelum cleanup otomatis:
- Backup harian pada jam 1:00 AM
- Cleanup berjalan pada jam 2:00 AM

## Customization

### Mengubah Periode Retention

Edit file `app/Console/Commands/CleanupOldChatHistory.php`:
```php
// Ubah dari 36 bulan ke periode lain
$cutoffDate = Carbon::now()->subMonths(24); // 24 bulan
```

### Mengubah Schedule

Edit file `bootstrap/app.php`:
```php
// Contoh: jalankan setiap minggu
$schedule->command('chat:cleanup-old-history')
    ->weekly()
    ->sundays()
    ->at('02:00');
```

## Troubleshooting

### Command Tidak Terdaftar
```bash
php artisan list | grep cleanup
```

### Schedule Tidak Berjalan
```bash
# Test manual
php artisan schedule:run

# Check cron job
crontab -l
```

### Memory Issues
- Kurangi chunk size di command
- Pastikan PHP memory limit cukup
- Monitor server resources saat cleanup

## Security Notes

- Command meminta konfirmasi sebelum menghapus
- Dry-run mode untuk testing aman
- Log semua aktivitas cleanup
- Tidak ada soft delete - data benar-benar terhapus

## Related Files

- `app/Console/Commands/CleanupOldChatHistory.php` - Main command
- `bootstrap/app.php` - Schedule configuration
- `database/migrations/2024_01_20_000003_create_chat_histories_table.php` - Table structure
- `app/Models/ChatHistory.php` - Model