<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin d'un shelter 1
        User::create([
            'name' => 'Shelter Admin',
            'username' => 'admin1',
            'email' => 'admin@shelter.com',
            'phone' => '0600000000',
            'avatar' => null,
            'location' => 'Casablanca',
            'role' => 'admin',
            'shelter_id' => 1,
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅
        ]);

        // Admin du shelter #2
        User::create([
            'name' => 'Shelter Admin 2',
            'username' => 'admin2',
            'email' => 'admin2@shelter.com',
            'phone' => '0655555555',
            'avatar' => null,
            'location' => 'Rabat',
            'role' => 'admin',
            'shelter_id' => 2,
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅
        ]);

        // Admin du shelter #3
        User::create([
            'name' => 'Shelter Admin 3',
            'username' => 'admin3',
            'email' => 'admin3@shelter.com',
            'phone' => '0666666666',
            'avatar' => null,
            'location' => 'Marrakech',
            'role' => 'admin',
            'shelter_id' => 3,
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅
        ]);

        // Admin du shelter #4
        User::create([
            'name' => 'Shelter Admin 4',
            'username' => 'admin4',
            'email' => 'admin4@shelter.com',
            'phone' => '0677777777',
            'avatar' => null,
            'location' => 'Tangier',
            'role' => 'admin',
            'shelter_id' => 4,
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅
        ]);

        // Admin du shelter #5
        User::create([
            'name' => 'Shelter Admin 5',
            'username' => 'admin5',
            'email' => 'admin5@shelter.com',
            'phone' => '0688888888',
            'avatar' => null,
            'location' => 'Agadir',
            'role' => 'admin',
            'shelter_id' => 5,
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅
        ]);

        // Admin du shelter #6
        User::create([
            'name' => 'Shelter Admin 6',
            'username' => 'admin6',
            'email' => 'fatimaezzahraabdessettar@gmail.com',
            'phone' => '0688888888',
            'avatar' => null,
            'location' => 'Casablanca',
            'role' => 'admin',
            'shelter_id' => 6,
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅
        ]);

        // Simple user
        User::create([
            'name' => 'Test User',
            'username' => 'user1',
            'email' => 'user@test.com',
            'phone' => '0611111111',
            'location' => 'Rabat',
            'password' => Hash::make('password'),
            'email_verified_at' => now(), // ✅ Si tu veux qu'il soit vérifié aussi
        ]);
    }
}