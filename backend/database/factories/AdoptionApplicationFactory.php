<?php

namespace Database\Factories;

use App\Models\AdoptionApplication;
use App\Models\User;
use App\Models\Pet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdoptionApplication>
 */
class AdoptionApplicationFactory extends Factory
{
    protected $model = AdoptionApplication::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'pet_id' => Pet::factory(),
            'form_data' => [
                'applicant_name' => fake()->name(),
                'email' => fake()->email(),
                'phone' => fake()->phoneNumber(),
                'housing_type' => fake()->randomElement(['apartment', 'house', 'condo']),
                'has_yard' => fake()->boolean(),
            ],
            'reviewed_by' => null,
            'status' => fake()->randomElement(['pending', 'approved', 'denied', 'canceled']),
        ];
    }
}
