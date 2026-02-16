<?php

namespace Database\Factories;

use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pet>
 */
class PetFactory extends Factory
{
    protected $model = Pet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->firstName(),
            'species' => fake()->randomElement(['Canine', 'Feline', 'Rodent', 'Avian']),
            'type' => fake()->randomElement(['Dog', 'Cat', 'Rabbit', 'Hamster', 'Parrot', 'Goldfish']),
            'age' => fake()->randomDigitNotNull(),
            'description' => fake()->sentence(),
            'profile_picture' => fake()->imageUrl(),
            'shelter_id' => Shelter::factory(),
            'added_by' => null,
            'adopted_by' => null,
            'gender' => fake()->randomElement(['male', 'female']),
            'status' => fake()->randomElement(['available', 'pending', 'adopted']),
        ];
    }
}
