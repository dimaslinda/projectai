<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class UserExcelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = env('EXCEL_USER_IMPORT_PATH', storage_path('app/import/users.xlsx'));

        if (! file_exists($path)) {
            $this->command?->error("Excel file not found: {$path}");
            $this->command?->line('Please set EXCEL_USER_IMPORT_PATH in .env or place your Excel at storage/app/import/users.xlsx');
            return;
        }

        try {
            $spreadsheet = IOFactory::load($path);
        } catch (\Throwable $e) {
            $this->command?->error('Failed to load Excel: ' . $e->getMessage());
            return;
        }

        $sheet = $spreadsheet->getSheet(0);
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();
        $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        // Read header row (row 1)
        $headers = [];
        for ($col = 1; $col <= $highestColumnIndex; $col++) {
            $headers[$col] = strtolower(trim((string) $sheet->getCell(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col) . '1')->getCalculatedValue()));
        }

        // Find column indexes (case-insensitive, with common synonyms)
        $colEmail = $this->findHeaderIndex($headers, ['email', 'e-mail']);
        $colName = $this->findHeaderIndex($headers, ['name', 'nama', 'full name']);
        $colRole = $this->findHeaderIndex($headers, ['role', 'roles', 'jabatan', 'tipe', 'type']);
        $colPassword = $this->findHeaderIndex($headers, ['password', 'kata sandi', 'pass']);

        if (! $colEmail) {
            $this->command?->error('Email column is required. Please ensure the first row has a column named "Email".');
            return;
        }

        $preview = [];
        $created = 0;
        $updated = 0;
        $skipped = 0;

        for ($row = 2; $row <= $highestRow; $row++) {
            $email = trim(strtolower((string) $sheet->getCell(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colEmail) . $row)->getCalculatedValue()));
            if ($email === '') {
                $skipped++;
                continue;
            }

            $name = $colName ? trim((string) $sheet->getCell(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colName) . $row)->getCalculatedValue()) : null;
            $rawRole = $colRole ? trim(strtolower((string) $sheet->getCell(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colRole) . $row)->getCalculatedValue())) : '';
            $passwordRaw = $colPassword ? trim((string) $sheet->getCell(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colPassword) . $row)->getCalculatedValue()) : '';

            $role = $this->mapRole($rawRole) ?? 'user'; // default to general user
            $passwordToUse = $passwordRaw !== '' ? (string) $passwordRaw : 'password';

            $preview[] = [
                'email' => $email,
                'name' => $name ?: ucfirst(strtok($email, '@')),
                'role' => $role,
            ];

            $existing = User::where('email', $email)->first();
            if ($existing) {
                $existing->update([
                    'name' => $name ?: $existing->name,
                    'role' => $role,
                ]);
                $updated++;
            } else {
                User::create([
                    'name' => $name ?: ucfirst(strtok($email, '@')),
                    'email' => $email,
                    'password' => Hash::make($passwordToUse),
                    'role' => $role,
                    'email_verified_at' => now(),
                ]);
                $created++;
            }
        }

        $this->command?->info('Preview import (showing up to 20 rows):');
        foreach (array_slice($preview, 0, 20) as $row) {
            $this->command?->line("- {$row['email']} | {$row['name']} | {$row['role']}");
        }
        $this->command?->info("Total rows: " . count($preview));
        $this->command?->info("Created: {$created}, Updated: {$updated}, Skipped (no email): {$skipped}");
    }

    private function findHeaderIndex(array $headers, array $candidates): ?int
    {
        foreach ($candidates as $candidate) {
            $idx = array_search(strtolower($candidate), $headers, true);
            if ($idx !== false) {
                return (int) $idx;
            }
        }
        return null;
    }

    private function mapRole(?string $raw): ?string
    {
        $r = strtolower(trim((string) $raw));
        return match ($r) {
            'engineer', 'eng', 'insinyur' => 'engineer',
            'drafter', 'draft' => 'drafter',
            'esr' => 'esr',
            'superadmin', 'super admin' => 'superadmin',
            'admin' => 'admin',
            'umum', 'general', 'user', 'public' => 'user',
            default => null,
        };
    }
}