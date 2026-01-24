<?php

namespace Database\Seeders;

use App\Models\Shelter;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShelterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Shelter::insert([
            ['name' => 'Happy Paws Shelter', 'city' => 'Casablanca', 'address' => 'Hay Mohammadi', 'country' => 'Morocco', 'phone' => '0600000000', 'email' => 'happypaws@gmail.com'],
            ['name' => 'Safe Haven Shelter', 'city' => 'Rabat', 'address' => 'Agdal', 'country' => 'Morocco', 'phone' => '0611111111', 'email' => 'safeHeaven@gmail.com'],
            ['name' => 'Furry Friends Shelter', 'city' => 'Marrakech', 'address' => 'Gueliz', 'country' => 'Morocco', 'phone' => '0622222222', 'email' => 'furry123@gmail.com'],
            ['name' => 'Paws and Claws Shelter', 'city' => 'Tangier', 'address' => 'Malabata', 'country' => 'Morocco', 'phone' => '0633333333', 'email' => 'clawsshelter11@gmail.com'],
            ['name' => 'fatima Home Shelter', 'city' => 'Casablanca', 'address' => 'Anfa', 'country' => 'Morocco', 'phone' => '0644444444', 'email' => 'fatimaezzahraabdessettar@gmail.com'],
            ['name' => 'Forever Home Shelter', 'city' => 'Agadir', 'address' => 'Anza', 'country' => 'Morocco', 'phone' => '0644444444', 'email' => 'ForevershelterHome@gmail.com'],
        ]);
    }
}
