<?php

namespace Tests\Feature;

use App\Models\AdoptionApplication;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdoptionApplicationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $admin;
    protected $shelter;
    protected $pet;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'user',
        ]);

        $this->shelter = Shelter::factory()->create();

        $this->admin = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
            'shelter_id' => $this->shelter->id,
        ]);

        $this->pet = Pet::factory()->create([
            'shelter_id' => $this->shelter->id,
            'status' => 'available',
        ]);
    }

    // ==============================
    // STORE (Create Application)
    // ==============================

    public function test_user_can_create_adoption_application()
    {
        $formData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '555-1234',
            'experience' => 'I have owned dogs before',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/pets/{$this->pet->id}/apply", [
                'form_data' => $formData,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'id',
            'user_id',
            'pet_id',
            'form_data',
            'status',
            'created_at',
            'updated_at',
        ]);

        $this->assertDatabaseHas('adoption_applications', [
            'user_id' => $this->user->id,
            'pet_id' => $this->pet->id,
            'status' => 'pending',
        ]);
    }

    public function test_adoption_application_requires_form_data()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/pets/{$this->pet->id}/apply", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('form_data');
    }

    public function test_adoption_application_requires_form_data_as_array()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/pets/{$this->pet->id}/apply", [
                'form_data' => 'not an array',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('form_data');
    }

    public function test_user_cannot_apply_for_nonexistent_pet()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/pets/999/apply', [
                'form_data' => ['test' => 'data'],
            ]);

        $response->assertStatus(404);
    }

    public function test_unauthenticated_user_cannot_create_application()
    {
        $response = $this->postJson("/api/pets/{$this->pet->id}/apply", [
            'form_data' => ['test' => 'data'],
        ]);

        $response->assertStatus(401);
    }

    public function test_user_cannot_apply_for_same_pet_twice()
    {
        $pet2 = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        
        AdoptionApplication::create([
            'user_id' => $this->user->id,
            'pet_id' => $pet2->id,
            'form_data' => ['data' => 'test'],
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/pets/{$pet2->id}/apply", [
                'form_data' => ['data' => 'different'],
            ]);

        // Should fail with unique constraint (422)
        $this->assertTrue($response->status() === 422 || $response->status() === 409 || $response->status() === 500);
    }

    public function test_application_can_store_complex_form_data()
    {
        $formData = [
            'personal_info' => [
                'name' => 'Jane Smith',
                'age' => 28,
                'email' => 'jane@example.com',
            ],
            'housing' => [
                'type' => 'apartment',
                'square_feet' => 1200,
                'backyard' => true,
            ],
            'experience' => 'Multiple dogs and cats',
            'references' => ['ref1@example.com', 'ref2@example.com'],
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/pets/{$this->pet->id}/apply", [
                'form_data' => $formData,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('adoption_applications', [
            'user_id' => $this->user->id,
            'pet_id' => $this->pet->id,
        ]);

        $app = AdoptionApplication::where('user_id', $this->user->id)
            ->where('pet_id', $this->pet->id)
            ->first();

        $this->assertEquals($formData, $app->form_data);
    }

    // ==============================
    // MINE (User's Applications)
    // ==============================

    public function test_user_can_list_their_applications()
    {
        AdoptionApplication::factory(3)->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/adoptions');

        $response->assertStatus(200);
        $response->assertJsonCount(3);
        $response->assertJsonStructure([
            '*' => ['id', 'user_id', 'pet_id', 'form_data', 'status', 'created_at', 'updated_at'],
        ]);
    }

    public function test_user_sees_only_own_applications()
    {
        $otherUser = User::factory()->create(['email_verified_at' => now()]);

        AdoptionApplication::factory(2)->create(['user_id' => $this->user->id]);
        AdoptionApplication::factory(3)->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/adoptions');

        $response->assertStatus(200);
        $response->assertJsonCount(2);

        $applications = $response->json();
        foreach ($applications as $app) {
            $this->assertEquals($this->user->id, $app['user_id']);
        }
    }

    public function test_user_applications_include_pet_and_user_relations()
    {
        AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/adoptions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'id',
                'user_id',
                'pet_id',
                'pet' => ['id', 'name', 'species', 'type', 'gender', 'age', 'status'],
                'user' => ['id', 'name', 'email', 'role'],
            ],
        ]);
    }

    public function test_user_applications_are_ordered_by_created_at_descending()
    {
        $app1 = AdoptionApplication::factory()->create(['user_id' => $this->user->id]);
        sleep(1);
        $app2 = AdoptionApplication::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/adoptions');

        $response->assertStatus(200);
        $applications = $response->json();

        $this->assertEquals($app2->id, $applications[0]['id']);
        $this->assertEquals($app1->id, $applications[1]['id']);
    }

    public function test_unauthenticated_user_cannot_list_applications()
    {
        $response = $this->getJson('/api/adoptions');

        $response->assertStatus(401);
    }

    // ==============================
    // FOR MY SHELTER (Admin's Applications)
    // ==============================

    public function test_admin_can_list_applications_for_their_shelter()
    {
        $pet1 = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $pet2 = Pet::factory()->create(['shelter_id' => $this->shelter->id]);

        AdoptionApplication::factory(2)->create(['pet_id' => $pet1->id]);
        AdoptionApplication::factory(1)->create(['pet_id' => $pet2->id]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/adoption-applications');

        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }

    public function test_admin_only_sees_applications_for_their_shelter()
    {
        $otherShelter = Shelter::factory()->create();
        $otherAdminPet = Pet::factory()->create(['shelter_id' => $otherShelter->id]);

        $myPet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);

        AdoptionApplication::factory(2)->create(['pet_id' => $myPet->id]);
        AdoptionApplication::factory(3)->create(['pet_id' => $otherAdminPet->id]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/adoption-applications');

        $response->assertStatus(200);
        $response->assertJsonCount(2);

        $applications = $response->json();
        foreach ($applications as $app) {
            $this->assertEquals($this->shelter->id, $app['pet']['shelter_id']);
        }
    }

    public function test_admin_applications_include_relations()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        AdoptionApplication::factory()->create(['pet_id' => $pet->id]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/adoption-applications');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'id',
                'user_id',
                'pet_id',
                'pet' => ['id', 'name', 'shelter_id'],
                'user' => ['id', 'name', 'email'],
            ],
        ]);
    }

    public function test_non_admin_cannot_list_shelter_applications()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/admin/adoption-applications');

        $response->assertStatus(403);
    }

    // ==============================
    // SHOW (View Single Application)
    // ==============================

    public function test_user_can_view_own_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/adoption-applications/{$application->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('id', $application->id);
        $response->assertJsonPath('user_id', $this->user->id);
    }

    public function test_user_cannot_view_other_users_application()
    {
        $otherUser = User::factory()->create(['email_verified_at' => now()]);
        $application = AdoptionApplication::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/adoption-applications/{$application->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_view_application_for_their_shelter()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $application = AdoptionApplication::factory()->create([
            'pet_id' => $pet->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/adoption-applications/{$application->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('id', $application->id);
    }

    public function test_admin_cannot_view_application_for_other_shelter()
    {
        $otherShelter = Shelter::factory()->create();
        $otherAdmin = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
            'shelter_id' => $otherShelter->id,
        ]);

        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create(['pet_id' => $pet->id]);

        $response = $this->actingAs($otherAdmin)
            ->getJson("/api/admin/adoption-applications/{$application->id}");

        $response->assertStatus(403);
    }

    public function test_show_application_includes_relations()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/adoption-applications/{$application->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'id',
            'user_id',
            'pet_id',
            'form_data',
            'status',
            'pet' => ['id', 'name', 'species'],
            'user' => ['id', 'name', 'email'],
        ]);
    }

    public function test_nonexistent_application_returns_404()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/adoption-applications/999');

        $response->assertStatus(404);
    }

    // ==============================
    // UPDATE (Edit Application)
    // ==============================

    public function test_user_can_update_pending_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending',
            'form_data' => ['name' => 'John Doe'],
        ]);

        $newFormData = ['name' => 'Jane Doe', 'updated' => true];

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => $newFormData,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('form_data.name', 'Jane Doe');
        $response->assertJsonPath('form_data.updated', true);

        $this->assertDatabaseHas('adoption_applications', [
            'id' => $application->id,
            'form_data' => json_encode($newFormData),
        ]);
    }

    public function test_user_cannot_update_approved_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => ['updated' => 'data'],
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Cannot edit non-pending applications');
    }

    public function test_user_cannot_update_denied_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'denied',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => ['updated' => 'data'],
            ]);

        $response->assertStatus(400);
    }

    public function test_user_cannot_update_other_users_application()
    {
        $otherUser = User::factory()->create(['email_verified_at' => now()]);
        $application = AdoptionApplication::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => ['data' => 'test'],
            ]);

        $response->assertStatus(403);
    }

    public function test_update_requires_form_data()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('form_data');
    }

    // ==============================
    // CANCEL (User Cancels Application)
    // ==============================

    public function test_user_can_cancel_pending_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}/cancel");

        $response->assertStatus(200);
        $response->assertJsonPath('application.status', 'canceled');
        $response->assertJsonPath('message', 'Application canceled successfully');

        $this->assertDatabaseHas('adoption_applications', [
            'id' => $application->id,
            'status' => 'canceled',
        ]);
    }

    public function test_user_cannot_cancel_approved_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}/cancel");

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Can only cancel pending applications');
    }

    public function test_user_cannot_cancel_denied_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'denied',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}/cancel");

        $response->assertStatus(400);
    }

    public function test_user_cannot_cancel_already_canceled_application()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'canceled',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}/cancel");

        $response->assertStatus(400);
    }

    public function test_user_cannot_cancel_other_users_application()
    {
        $otherUser = User::factory()->create(['email_verified_at' => now()]);
        $application = AdoptionApplication::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}/cancel");

        $response->assertStatus(403);
    }

    public function test_cancel_returns_application_with_relations()
    {
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}/cancel");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'application' => [
                'id',
                'user_id',
                'pet_id',
                'status',
                'pet' => ['id', 'name'],
                'user' => ['id', 'name'],
            ],
        ]);
    }

    // ==============================
    // UPDATE STATUS (Admin Approval/Denial)
    // ==============================

    public function test_admin_can_approve_application()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create([
            'pet_id' => $pet->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('application.status', 'approved');
        $response->assertJsonPath('message', 'Application approved successfully');

        $this->assertDatabaseHas('adoption_applications', [
            'id' => $application->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_deny_application()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create([
            'pet_id' => $pet->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'denied',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('application.status', 'denied');
        $response->assertJsonPath('message', 'Application denied successfully');
    }

    public function test_admin_can_cancel_application()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create([
            'pet_id' => $pet->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'canceled',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('application.status', 'canceled');
    }

    public function test_admin_can_change_application_status_multiple_times()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create([
            'pet_id' => $pet->id,
            'status' => 'pending',
        ]);

        // First approval
        $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('adoption_applications', [
            'id' => $application->id,
            'status' => 'approved',
        ]);

        // Then deny (change status)
        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'denied',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('adoption_applications', [
            'id' => $application->id,
            'status' => 'denied',
        ]);
    }

    public function test_admin_cannot_set_invalid_status()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create(['pet_id' => $pet->id]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('status');
    }

    public function test_admin_status_update_requires_status_field()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create(['pet_id' => $pet->id]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('status');
    }

    public function test_admin_cannot_update_application_from_other_shelter()
    {
        $otherShelter = Shelter::factory()->create();
        $otherAdminPet = Pet::factory()->create(['shelter_id' => $otherShelter->id]);
        $application = AdoptionApplication::factory()->create(['pet_id' => $otherAdminPet->id]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_update_application_status()
    {
        $application = AdoptionApplication::factory()->create();

        $response = $this->actingAs($this->user)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(403);
    }

    public function test_status_update_returns_application_with_relations()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create(['pet_id' => $pet->id]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'application' => [
                'id',
                'user_id',
                'pet_id',
                'status',
                'pet' => ['id', 'name', 'shelter_id'],
                'user' => ['id', 'name', 'email'],
            ],
        ]);
    }

    // ==============================
    // INTEGRATION & WORKFLOWS
    // ==============================

    public function test_full_adoption_workflow()
    {
        // User creates application
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'pet_id' => $this->pet->id,
            'status' => 'pending',
        ]);

        // User can view their application
        $response = $this->actingAs($this->user)
            ->getJson('/api/adoptions');
        $response->assertStatus(200);
        $response->assertJsonCount(1);

        // User updates application
        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => ['updated' => 'data'],
            ]);
        $response->assertStatus(200);

        // Admin views the application
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/adoption-applications');
        $response->assertStatus(200);
        $response->assertJsonCount(1);

        // Admin approves application
        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ]);
        $response->assertStatus(200);

        // User can see approved status
        $response = $this->actingAs($this->user)
            ->getJson("/api/adoption-applications/{$application->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('status', 'approved');
    }

    public function test_adoption_applications_persist_across_requests()
    {
        $formData = ['name' => 'Test', 'email' => 'test@example.com'];

        $response = $this->actingAs($this->user)
            ->postJson("/api/pets/{$this->pet->id}/apply", [
                'form_data' => $formData,
            ]);
        $response->assertStatus(201);

        $applicationId = $response->json('id');

        // Verify it persists
        $response = $this->actingAs($this->user)
            ->getJson("/api/adoption-applications/{$applicationId}");

        $response->assertStatus(200);
        $response->assertJsonPath('form_data.name', 'Test');
        $response->assertJsonPath('form_data.email', 'test@example.com');
    }

    public function test_application_statuses_are_immutable_from_pending()
    {
        $pet = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $application = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'pet_id' => $pet->id,
            'status' => 'pending',
        ]);

        // User can update form data
        $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => ['updated' => 'data'],
            ])
            ->assertStatus(200);

        // Admin approves
        $this->actingAs($this->admin)
            ->putJson("/api/admin/adoption-applications/{$application->id}/status", [
                'status' => 'approved',
            ])
            ->assertStatus(200);

        // User cannot update anymore
        $response = $this->actingAs($this->user)
            ->putJson("/api/adoptions/{$application->id}", [
                'form_data' => ['cannot' => 'update'],
            ]);

        $response->assertStatus(400);
    }

    public function test_multiple_applications_for_different_pets()
    {
        $pet1 = Pet::factory()->create(['shelter_id' => $this->shelter->id]);
        $pet2 = Pet::factory()->create(['shelter_id' => $this->shelter->id]);

        $app1 = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'pet_id' => $pet1->id,
        ]);

        $app2 = AdoptionApplication::factory()->create([
            'user_id' => $this->user->id,
            'pet_id' => $pet2->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/adoptions');

        $response->assertStatus(200);
        $response->assertJsonCount(2);

        $applications = $response->json();
        $petIds = array_map(fn($app) => $app['pet_id'], $applications);

        $this->assertContains($pet1->id, $petIds);
        $this->assertContains($pet2->id, $petIds);
    }
}
