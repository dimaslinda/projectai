<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Engineer Users
        User::create([
            'name' => 'John Engineer',
            'email' => 'john.engineer@company.com',
            'password' => Hash::make('password'),
            'role' => 'engineer',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Sarah Engineer',
            'email' => 'sarah.engineer@company.com',
            'password' => Hash::make('password'),
            'role' => 'engineer',
            'email_verified_at' => now(),
        ]);

        // Drafter Users
        User::create([
            'name' => 'Mike Drafter',
            'email' => 'mike.drafter@company.com',
            'password' => Hash::make('password'),
            'role' => 'drafter',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Lisa Drafter',
            'email' => 'lisa.drafter@company.com',
            'password' => Hash::make('password'),
            'role' => 'drafter',
            'email_verified_at' => now(),
        ]);

        // ESR Users
        User::create([
            'name' => 'David ESR',
            'email' => 'david.esr@company.com',
            'password' => Hash::make('password'),
            'role' => 'esr',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Emma ESR',
            'email' => 'emma.esr@company.com',
            'password' => Hash::make('password'),
            'role' => 'esr',
            'email_verified_at' => now(),
        ]);
    }
}