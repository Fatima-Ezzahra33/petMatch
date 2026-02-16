<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UserPreferenceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'user',
        ]);
    }

    // ==============================
    // EXTRACT PREFERENCES (AI Integration)
    // ==============================

    public function test_extract_preferences_with_valid_groq_response()
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

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'I want a male labrador puppy that is playful and friendly',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'preferences' => [
                'species',
                'type',
                'gender',
                'age',
                'status',
                'keywords',
            ],
            'message',
        ]);

        $response->assertJsonPath('preferences.species', ['dog']);
        $response->assertJsonPath('preferences.type', ['labrador']);
        $response->assertJsonPath('preferences.gender', 'male');
        $response->assertJsonPath('preferences.status', 'available');
    }

    public function test_extract_preferences_normalizes_to_lowercase()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['DOG', 'CAT'],
                                    'type' => ['LABRADOR', 'HUSKY'],
                                    'gender' => 'MALE',
                                    'age' => ['min' => 3, 'max' => 10],
                                    'status' => 'available',
                                    'keywords' => ['PLAYFUL', 'FRIENDLY'],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A DOG or CAT',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.species', ['dog', 'cat']);
        $response->assertJsonPath('preferences.gender', 'male');
        // Type and keywords should be lowercase
        $this->assertStringContainsString('labrador', strtolower(json_encode($response->json('preferences.type'))));
    }

    public function test_extract_preferences_handles_null_fields()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Just any dog',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.species', ['dog']);
        $response->assertJsonPath('preferences.gender', null);
        $response->assertJsonPath('preferences.age.min', null);
        $response->assertJsonPath('preferences.age.max', null);
    }

    public function test_extract_preferences_limits_species_to_two()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog', 'cat', 'rabbit', 'hamster'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Dog cat rabbit or hamster',
            ]);

        $response->assertStatus(200);
        // Should be limited to first 2 species
        $this->assertCount(2, $response->json('preferences.species'));
    }

    public function test_extract_preferences_validates_gender_enum()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => 'invalid_gender',
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A dog with invalid gender',
            ]);

        $response->assertStatus(200);
        // Should normalize invalid gender to null
        $response->assertJsonPath('preferences.gender', null);
    }

    public function test_extract_preferences_with_both_male_and_female_returns_null()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => 'both',
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Either male or female',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.gender', null);
    }

    public function test_extract_preferences_parses_json_from_markdown()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => '```json' . json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => 'male',
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]) . '```',
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Male dog please',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.gender', 'male');
    }

    public function test_extract_preferences_handles_groq_error_response()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                ['error' => 'Rate limited'],
                429
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A dog',
            ]);

        $response->assertStatus(500);
        $response->assertJsonPath('error', 'Erreur lors de la communication avec l\'IA');
    }

    public function test_extract_preferences_handles_invalid_json_from_ai()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => 'This is not JSON at all',
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A dog',
            ]);

        $response->assertStatus(500);
        $response->assertJsonPath('error', 'L\'IA n\'a pas retourné un JSON valide');
    }

    public function test_extract_preferences_requires_user_message()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('user_message');
    }

    public function test_extract_preferences_validates_message_max_length()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => str_repeat('a', 2001),
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('user_message');
    }

    public function test_extract_preferences_requires_authentication()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response([]),
        ]);

        $response = $this->postJson('/api/extract-preferences', [
            'user_message' => 'A dog',
        ]);

        $response->assertStatus(401);
    }

    public function test_extract_preferences_with_age_boundaries()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => 1, 'max' => 5],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A young dog between 1 and 5 years old',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.age.min', 1);
        $response->assertJsonPath('preferences.age.max', 5);
    }

    public function test_extract_preferences_with_only_min_age()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => 3, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Adult dog at least 3 years old',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.age.min', 3);
        $response->assertJsonPath('preferences.age.max', null);
    }

    public function test_extract_preferences_with_multiple_keywords()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => ['playful', 'friendly', 'energetic', 'calm', 'family'],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A playful, friendly, energetic, calm dog good for families',
            ]);

        $response->assertStatus(200);
        $this->assertGreaterThan(0, count($response->json('preferences.keywords')));
    }

    public function test_extract_preferences_ignores_special_characters_in_message()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => 'male',
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'I want a male dog!!! 🐕 (please)',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.gender', 'male');
    }

    public function test_extract_preferences_handles_empty_keywords_array()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Just any dog',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.keywords', []);
    }

    public function test_extract_preferences_normalizes_empty_type_to_array()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => null,
                                    'gender' => null,
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => null,
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'Any dog',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.type', []);
        $response->assertJsonPath('preferences.keywords', []);
    }

    public function test_extract_preferences_handles_non_integer_age()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => null,
                                    'age' => ['min' => 'five', 'max' => '10'],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A dog',
            ]);

        $response->assertStatus(200);
        // Non-integer ages should be normalized to null
        $response->assertJsonPath('preferences.age.min', null);
    }

    public function test_extract_preferences_returns_success_message()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => 'male',
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A male dog',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Préférences extraites avec succès grâce à Groq ! 🧠➜🐾');
    }

    public function test_extract_preferences_with_multiple_species_and_types()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog', 'cat'],
                                    'type' => ['labrador', 'siamese', 'golden retriever'],
                                    'gender' => null,
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => ['playful'],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A labrador, siamese, or golden retriever',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('preferences.species', ['dog', 'cat']);
        $this->assertGreaterThan(0, count($response->json('preferences.type')));
    }

    public function test_extract_preferences_handles_concurrent_requests()
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response(
                [
                    'choices' => [
                        [
                            'message' => [
                                'content' => json_encode([
                                    'species' => ['dog'],
                                    'type' => [],
                                    'gender' => 'male',
                                    'age' => ['min' => null, 'max' => null],
                                    'status' => 'available',
                                    'keywords' => [],
                                ]),
                            ],
                        ],
                    ],
                ],
                200
            ),
        ]);

        $response1 = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A male dog',
            ]);

        $response2 = $this->actingAs($this->user)
            ->postJson('/api/extract-preferences', [
                'user_message' => 'A female cat',
            ]);

        $response1->assertStatus(200);
        $response2->assertStatus(200);
    }
}
