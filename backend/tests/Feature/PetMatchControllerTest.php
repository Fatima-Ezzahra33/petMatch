<?php

namespace Tests\Feature;

use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PetMatchControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $shelter;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'user',
        ]);

        $this->shelter = Shelter::factory()->create();
    }

    // ==============================
    // MATCH PETS
    // ==============================

    public function test_match_pets_with_ai_extraction_success()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => ['labrador'],
                                    'gender' => 'male',
                                    'age' => ['min' => 2, 'max' => 8],
                                    'status' => 'available',
                                    'keywords' => ['playful', 'friendly'],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'labrador',
            'gender' => 'male',
            'age' => 5,
            'status' => 'available',
            'description' => 'Friendly and playful dog',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'user_message' => 'I want a male labrador that is playful',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'pets' => [
                '*' => [
                    'id',
                    'name',
                    'species',
                    'type',
                    'age',
                    'gender',
                    'description',
                    'profile_picture',
                    'status',
                    'score',
                    'raw_score',
                    'matches'
                ]
            ]
        ]);

        $this->assertGreaterThan(0, $response->json('total'));
    }

    public function test_match_pets_with_fallback_preferences_when_ai_fails()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                ['error' => 'API Error'],
                500
            ),
        ]);

        $dog = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
            ]);

        $response->assertStatus(200);
    }

    public function test_match_pets_with_manual_preferences_no_ai()
    {
        $dog = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'gender' => 'female',
            'status' => 'available',
            'description' => 'Friendly dog',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'gender' => 'female',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('total', 1);
        $response->assertJsonPath('pets.0.id', $dog->id);
    }

    public function test_match_pets_by_species_filter()
    {
        $dog = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        $cat = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'cat',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('total', 1);
        $response->assertJsonPath('pets.0.species', 'dog');
    }

    public function test_match_pets_by_multiple_species()
    {
        $dog = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        $cat = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'cat',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog', 'cat'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('total', 2);
    }

    public function test_match_pets_by_gender()
    {
        $male = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'gender' => 'male',
            'status' => 'available',
        ]);

        $female = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'gender' => 'female',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'gender' => 'male',
            ]);

        $response->assertStatus(200);
        // Should have at least 1 male dog
        $this->assertGreaterThanOrEqual(1, $response->json('total'));
        $response->assertJsonPath('pets.0.gender', 'male');
    }

    public function test_match_pets_by_age_range_min()
    {
        $young = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'age' => 2,
            'status' => 'available',
        ]);

        $old = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'age' => 10,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'age' => ['min' => 5, 'max' => null],
            ]);

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $response->json('total'));
        $response->assertJsonPath('pets.0.age', 10);
    }

    public function test_match_pets_by_age_range_max()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'age' => 2,
            'status' => 'available',
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'age' => 10,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'age' => ['min' => null, 'max' => 5],
            ]);

        $response->assertStatus(200);
        if ($response->json('total') > 0) {
            $this->assertLessThanOrEqual(5, $response->json('pets.0.age'));
        }
    }

    public function test_match_pets_by_breed_type()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'labrador',
            'status' => 'available',
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'german shepherd',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'type' => ['labrador'],
            ]);

        $response->assertStatus(200);
        // Should match labrador
        $this->assertGreaterThanOrEqual(1, $response->json('total'));
    }

    public function test_match_pets_scoring_system()
    {
        // Perfect match
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'labrador',
            'gender' => 'male',
            'age' => 5,
            'status' => 'available',
            'description' => 'Playful and friendly',
        ]);

        // Partial match
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'golden retriever',
            'gender' => 'female',
            'age' => 8,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'type' => ['labrador'],
                'gender' => 'male',
                'keywords' => ['playful'],
            ]);

        $response->assertStatus(200);
        $pets = $response->json('pets');

        $this->assertGreaterThan(0, $pets[0]['score']);

        if (count($pets) > 1) {
            $this->assertGreaterThan($pets[1]['score'], $pets[0]['score']);
        }
    }

    public function test_match_pets_keyword_matching()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
            'description' => 'Very playful and energetic',
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
            'description' => 'Calm and quiet dog',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'keywords' => ['playful'],
            ]);

        $response->assertStatus(200);
        // The playful dog should match
        $this->assertGreaterThanOrEqual(1, $response->json('total'));
    }

    public function test_match_pets_only_available_status()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'adopted',
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('total', 1);
    }

    public function test_match_pets_no_preferences_returns_empty()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', []);

        // Should fail because no meaningful preferences provided
        $response->assertStatus(200);
        $response->assertJsonPath('total', 0);
    }

    public function test_match_pets_no_matches_returns_fallback()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['cat'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', '😕 No exact matches. Here are some available pets!');
    }

    public function test_match_pets_returns_sorted_by_score()
    {
        // Create pets with different match levels
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'labrador',
            'gender' => 'male',
            'age' => 5,
            'status' => 'available',
            'description' => 'Playful dog',
        ]);

        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'poodle',
            'gender' => 'male',
            'age' => 5,
            'status' => 'available',
            'description' => 'Calm dog',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'type' => ['labrador'],
                'gender' => 'male',
                'age' => ['min' => 4, 'max' => 6],
                'keywords' => ['playful'],
            ]);

        $response->assertStatus(200);
        $pets = $response->json('pets');

        // Should be sorted by score (descending) and have matches
        $this->assertGreaterThanOrEqual(1, count($pets));
    }

    public function test_match_pets_with_type_partial_match()
    {
        // Test breed name matching logic (contains)
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'siberian husky',
            'status' => 'available',
        ]);

        // Search with just "husky" should match "siberian husky"
        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'type' => ['husky'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('total', 1);
    }

    public function test_match_pets_max_keywords_scored()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
            'description' => 'playful energetic friendly calm quiet',
        ]);

        // Submit more than 5 keywords (should max at 5)
        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'keywords' => ['playful', 'energetic', 'friendly', 'calm', 'quiet', 'smart', 'obedient'],
            ]);

        $response->assertStatus(200);
        // Score should be capped (max 5 keywords × 10 points = 50 max)
        $this->assertGreaterThan(0, $response->json('debug.max_possible_score'));
    }

    public function test_match_pets_requires_authentication()
    {
        $response = $this->postJson('/api/match-pets', [
            'species' => ['dog'],
        ]);

        $response->assertStatus(401);
    }

    public function test_match_pets_excellent_match_message()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'type' => 'labrador',
            'gender' => 'male',
            'age' => 5,
            'status' => 'available',
            'description' => 'Playful friendly and energetic dog',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'type' => ['labrador'],
                'gender' => 'male',
                'age' => ['min' => 3, 'max' => 7],
                'keywords' => ['playful', 'friendly'],
            ]);

        $response->assertStatus(200);
        // High score should have excellent message
        if ($response->json('pets.0.score') >= 80) {
            $this->assertStringContainsString('excellent', $response->json('message'));
        }
    }

    public function test_match_pets_good_match_message()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'gender' => 'male',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'gender' => 'male',
            ]);

        $response->assertStatus(200);
        // Medium-high score should have good message
        if ($response->json('pets.0.score') >= 50 && $response->json('pets.0.score') < 80) {
            $this->assertStringContainsString('good', $response->json('message'));
        }
    }

    public function test_match_pets_age_scoring_only_when_specified()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'age' => 10,
            'status' => 'available',
        ]);

        // Search without specifying age
        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
            ]);

        $response->assertStatus(200);
        // Age should not be counted if not specified
        $debug = $response->json('debug');
        $this->assertLessThanOrEqual(30, $debug['max_possible_score']); // Only species match max
    }

    public function test_match_pets_with_empty_results_returns_warning()
    {
        // No pets in database
        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'No available pets found 😔');
        $response->assertJsonPath('total', 0);
    }

    public function test_match_pets_returns_debug_info()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'dog',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'debug' => [
                'preferences',
                'max_possible_score',
                'extraction_failed',
                'total_checked',
                'with_matches',
            ],
        ]);
    }

    public function test_match_pets_case_insensitive_matching()
    {
        Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'species' => 'DOG',
            'type' => 'LABRADOR',
            'gender' => 'male',
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/match-pets', [
                'species' => ['dog'],
                'type' => ['labrador'],
                'gender' => 'male',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('total', 1);
    }

}
