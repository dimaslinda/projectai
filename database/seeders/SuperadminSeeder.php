<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperadminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin User
        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@company.com',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'email_verified_at' => now(),
        ]);

        // Create additional admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@company.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}
