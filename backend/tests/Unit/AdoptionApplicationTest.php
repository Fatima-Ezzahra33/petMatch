<?php

namespace Tests\Unit;

use App\Models\AdoptionApplication;
use App\Models\User;
use App\Models\Pet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdoptionApplicationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test AdoptionApplication model has correct fillable attributes
     */
    public function test_adoption_application_has_correct_fillable_attributes(): void
    {
        $fillable = ['user_id', 'pet_id', 'form_data', 'reviewed_by', 'status'];
        $application = new AdoptionApplication();

        $this->assertEquals($fillable, $application->getFillable());
    }

    /**
     * Test form_data is cast to array
     */
    public function test_form_data_is_cast_to_array(): void
    {
        $formData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '555-1234',
            'experience' => 'I have owned dogs for 5 years',
        ];

        $application = AdoptionApplication::factory()->create([
            'form_data' => $formData,
        ]);

        $this->assertIsArray($application->form_data);
        $this->assertEquals($formData, $application->form_data);
    }

    /**
     * Test form_data can be accessed as array
     */
    public function test_form_data_can_be_accessed_as_array(): void
    {
        $formData = [
            'applicant_name' => 'Jane Smith',
            'housing_type' => 'house',
            'has_yard' => true,
        ];

        $application = AdoptionApplication::factory()->create([
            'form_data' => $formData,
        ]);

        $this->assertEquals('Jane Smith', $application->form_data['applicant_name']);
        $this->assertEquals('house', $application->form_data['housing_type']);
        $this->assertTrue($application->form_data['has_yard']);
    }

    /**
     * Test user relationship returns the associated user
     */
    public function test_user_relationship_returns_associated_user(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        $application = AdoptionApplication::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        $this->assertInstanceOf(User::class, $application->user);
        $this->assertEquals($user->id, $application->user->id);
    }

    /**
     * Test pet relationship returns the associated pet
     */
    public function test_pet_relationship_returns_associated_pet(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        $application = AdoptionApplication::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        $this->assertInstanceOf(Pet::class, $application->pet);
        $this->assertEquals($pet->id, $application->pet->id);
    }

    /**
     * Test reviewer relationship returns the associated reviewer
     */
    public function test_reviewer_relationship_returns_associated_reviewer(): void
    {
        $applicant = User::factory()->create();
        $reviewer = User::factory()->create();
        $pet = Pet::factory()->create();

        $application = AdoptionApplication::factory()->create([
            'user_id' => $applicant->id,
            'pet_id' => $pet->id,
            'reviewed_by' => $reviewer->id,
            'status' => 'approved',
        ]);

        $this->assertInstanceOf(User::class, $application->reviewer);
        $this->assertEquals($reviewer->id, $application->reviewer->id);
    }

    /**
     * Test reviewer relationship returns null when no reviewer assigned
     */
    public function test_reviewer_relationship_returns_null_when_not_assigned(): void
    {
        $application = AdoptionApplication::factory()->create([
            'reviewed_by' => null,
        ]);

        $this->assertNull($application->reviewer);
    }

    /**
     * Test adoption application can be created with complete data
     */
    public function test_adoption_application_can_be_created_with_complete_data(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        $reviewer = User::factory()->create();
        $formData = [
            'occupation' => 'Software Engineer',
            'living_situation' => 'Apartment',
            'experience_with_pets' => 'Yes, 2 dogs',
        ];

        $application = AdoptionApplication::create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
            'form_data' => $formData,
            'reviewed_by' => $reviewer->id,
            'status' => 'pending',
        ]);

        $this->assertNotNull($application->id);
        $this->assertEquals($user->id, $application->user_id);
        $this->assertEquals($pet->id, $application->pet_id);
        $this->assertEquals($reviewer->id, $application->reviewed_by);
        $this->assertEquals('pending', $application->status);
        $this->assertEquals($formData, $application->form_data);
    }

    /**
     * Test adoption application timestamps are created automatically
     */
    public function test_adoption_application_timestamps_are_created_automatically(): void
    {
        $application = AdoptionApplication::factory()->create();

        $this->assertNotNull($application->created_at);
        $this->assertNotNull($application->updated_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $application->created_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $application->updated_at);
    }

    /**
     * Test user can have multiple adoption applications
     */
    public function test_user_can_have_multiple_adoption_applications(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(3)->create();

        $pets->each(fn ($pet) => AdoptionApplication::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertCount(3, $user->adoptionApplications);
    }

    /**
     * Test pet can have multiple adoption applications
     */
    public function test_pet_can_have_multiple_adoption_applications(): void
    {
        $pet = Pet::factory()->create();
        $users = User::factory(4)->create();

        $users->each(fn ($user) => AdoptionApplication::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertCount(4, $pet->adoptionApplications);
    }

    /**
     * Test application can have different statuses
     */
    public function test_application_can_have_different_statuses(): void
    {
        $statuses = ['pending', 'approved', 'denied', 'canceled'];

        foreach ($statuses as $status) {
            $application = AdoptionApplication::factory()->create([
                'status' => $status,
            ]);

            $this->assertEquals($status, $application->status);
        }
    }

    /**
     * Test adoption application form_data with complex nested structure
     */
    public function test_adoption_application_form_data_with_nested_structure(): void
    {
        $complexFormData = [
            'applicant' => [
                'name' => 'John Doe',
                'age' => 35,
                'email' => 'john@example.com',
            ],
            'household' => [
                'type' => 'house',
                'has_yard' => true,
                'members' => [
                    ['name' => 'Jane Doe', 'age' => 32],
                    ['name' => 'Tommy', 'age' => 8],
                ],
            ],
            'pets_currently_owned' => [
                ['type' => 'dog', 'age' => 5],
                ['type' => 'cat', 'age' => 3],
            ],
        ];

        $application = AdoptionApplication::factory()->create([
            'form_data' => $complexFormData,
        ]);

        $this->assertEquals('John Doe', $application->form_data['applicant']['name']);
        $this->assertEquals(35, $application->form_data['applicant']['age']);
        $this->assertTrue($application->form_data['household']['has_yard']);
        $this->assertCount(2, $application->form_data['household']['members']);
        $this->assertEquals('Tommy', $application->form_data['household']['members'][1]['name']);
    }
}
