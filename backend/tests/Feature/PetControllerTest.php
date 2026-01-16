<?php

namespace Tests\Feature;

use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PetControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    // ==========================================
    // PUBLIC INDEX TESTS (No authentication)
    // ==========================================

    public function test_public_can_list_available_pets()
    {
        $shelter = Shelter::factory()->create();
        $availablePet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);
        Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'adopted']);
        Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'pending']);

        $response = $this->getJson('/api/pets');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['id' => $availablePet->id]);
    }

    public function test_public_can_list_pets_with_shelter_info()
    {
        $shelter = Shelter::factory()->create(['name' => 'Happy Paws']);
        Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

        $response = $this->getJson('/api/pets');

        $response->assertStatus(200);
        $response->assertJsonPath('0.shelter.name', 'Happy Paws');
    }

    public function test_public_list_pets_excludes_unavailable_status()
    {
        $shelter = Shelter::factory()->create();
        Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);
        Pet::factory(3)->create(['shelter_id' => $shelter->id, 'status' => 'adopted']);

        $response = $this->getJson('/api/pets');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
    }

    // ==========================================
    // SHOW PET TESTS (Authenticated)
    // ==========================================

    public function test_authenticated_user_can_view_pet_details()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->getJson('/api/pets/' . $pet->id);

        $response->assertStatus(200);
        $response->assertJsonPath('id', $pet->id);
        $response->assertJsonPath('name', $pet->name);
    }

    public function test_unauthenticated_user_cannot_view_pet_details()
    {
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->getJson('/api/pets/' . $pet->id);

        $response->assertStatus(401);
    }

    public function test_viewing_nonexistent_pet_returns_404()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/pets/99999');

        $response->assertStatus(404);
    }

    // ==========================================
    // MY PETS TESTS (Admin only)
    // ==========================================

    public function test_admin_can_list_their_shelter_pets()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $pet1 = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Fluffy']);
        $pet2 = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Max']);
        $otherShelter = Shelter::factory()->create();
        Pet::factory()->create(['shelter_id' => $otherShelter->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets');

        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['name' => 'Fluffy']);
        $response->assertJsonFragment(['name' => 'Max']);
    }

    public function test_admin_mypets_excludes_other_shelters_pets()
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter1->id]);

        Pet::factory(3)->create(['shelter_id' => $shelter1->id]);
        Pet::factory(2)->create(['shelter_id' => $shelter2->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets');

        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }

    public function test_non_admin_cannot_access_mypets()
    {
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/admin/pets');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_mypets()
    {
        $response = $this->getJson('/api/admin/pets');

        $response->assertStatus(401);
    }

    // ==========================================
    // STORE PET TESTS (Admin only)
    // ==========================================

    public function test_admin_can_create_pet_with_required_fields()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $image = UploadedFile::fake()->image('pet.jpg');

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Buddy',
            'gender' => 'male',
            'status' => 'available',
            'description' => 'A friendly golden retriever',
            'profile_picture' => $image,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('name', 'Buddy');
        $response->assertJsonPath('gender', 'male');
        $response->assertJsonPath('status', 'available');
        $this->assertDatabaseHas('pets', [
            'name' => 'Buddy',
            'shelter_id' => $shelter->id,
            'added_by' => $admin->id,
        ]);
    }

    public function test_admin_can_create_pet_with_all_fields()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $image = UploadedFile::fake()->image('pet.jpg');

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Bella',
            'species' => 'Dog',
            'type' => 'Labrador',
            'age' => 3,
            'gender' => 'female',
            'status' => 'available',
            'description' => 'Beautiful and playful',
            'profile_picture' => $image,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('species', 'Dog');
        $response->assertJsonPath('type', 'Labrador');
        $response->assertJsonPath('age', 3);
    }

    public function test_admin_can_create_pet_with_image()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $image = UploadedFile::fake()->image('pet.jpg', 200, 200);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Charlie',
            'gender' => 'male',
            'status' => 'available',
            'description' => 'Cute puppy',
            'profile_picture' => $image,
        ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('profile_picture'));
        Storage::disk('public')->assertExists('pets');
    }

    public function test_pet_creation_requires_name()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'gender' => 'male',
            'status' => 'available',
            'description' => 'Missing name',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('name');
    }

    public function test_pet_creation_requires_gender()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'status' => 'available',
            'description' => 'Missing gender',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('gender');
    }

    public function test_pet_creation_requires_status()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'female',
            'description' => 'Missing status',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('status');
    }

    public function test_pet_creation_requires_description()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'male',
            'status' => 'available',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('description');
    }

    public function test_pet_creation_validates_gender_enum()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'unknown',
            'status' => 'available',
            'description' => 'Invalid gender',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('gender');
    }

    public function test_pet_creation_validates_status_enum()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'male',
            'status' => 'unknown',
            'description' => 'Invalid status',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('status');
    }

    public function test_pet_creation_validates_profile_picture_is_image()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $notImage = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'male',
            'status' => 'available',
            'description' => 'Invalid image',
            'profile_picture' => $notImage,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('profile_picture');
    }

    public function test_pet_creation_validates_profile_picture_max_size()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);

        $largeImage = UploadedFile::fake()->image('pet.jpg')->size(10000);

        $response = $this->actingAs($admin)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'male',
            'status' => 'available',
            'description' => 'Too large',
            'profile_picture' => $largeImage,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('profile_picture');
    }

    public function test_non_admin_cannot_create_pet()
    {
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

        $response = $this->actingAs($user)->postJson('/api/admin/pets', [
            'name' => 'Pet',
            'gender' => 'male',
            'status' => 'available',
            'description' => 'Test',
        ]);

        $response->assertStatus(403);
    }

    // ==========================================
    // UPDATE PET TESTS (Admin only)
    // ==========================================

    public function test_admin_can_update_pet()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'OldName']);

        $response = $this->actingAs($admin)->putJson('/api/admin/pets/' . $pet->id, [
            'name' => 'NewName',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('name', 'NewName');
        $this->assertDatabaseHas('pets', ['id' => $pet->id, 'name' => 'NewName']);
    }

    public function test_admin_can_update_pet_status()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'status' => 'available']);

        $response = $this->actingAs($admin)->putJson('/api/admin/pets/' . $pet->id, [
            'status' => 'adopted',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'adopted');
    }

    public function test_admin_can_update_pet_image()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $newImage = UploadedFile::fake()->image('new.jpg');

        $response = $this->actingAs($admin)->putJson('/api/admin/pets/' . $pet->id, [
            'profile_picture' => $newImage,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('profile_picture'));
    }

    public function test_admin_cannot_update_another_shelters_pet()
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter1->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter2->id]);

        $response = $this->actingAs($admin)->putJson('/api/admin/pets/' . $pet->id, [
            'name' => 'Hacked',
        ]);

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Unauthorized']);
    }

    public function test_non_admin_cannot_update_pet()
    {
        $shelter = Shelter::factory()->create();
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->putJson('/api/admin/pets/' . $pet->id, [
            'name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    // ==========================================
    // DESTROY PET TESTS (Admin only)
    // ==========================================

    public function test_admin_can_delete_pet()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->deleteJson('/api/admin/pets/' . $pet->id);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Pet deleted successfully']);
        $this->assertDatabaseMissing('pets', ['id' => $pet->id]);
    }

    public function test_admin_cannot_delete_another_shelters_pet()
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter1->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter2->id]);

        $response = $this->actingAs($admin)->deleteJson('/api/admin/pets/' . $pet->id);

        $response->assertStatus(403);
        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_non_admin_cannot_delete_pet()
    {
        $shelter = Shelter::factory()->create();
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->deleteJson('/api/admin/pets/' . $pet->id);

        $response->assertStatus(403);
    }

    // ==========================================
    // STATS TESTS (Admin only)
    // ==========================================

    public function test_admin_can_view_pet_statistics()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        Pet::factory(5)->create(['shelter_id' => $shelter->id, 'status' => 'available']);
        Pet::factory(3)->create(['shelter_id' => $shelter->id, 'status' => 'adopted']);
        Pet::factory(2)->create(['shelter_id' => $shelter->id, 'status' => 'pending']);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/stats');

        $response->assertStatus(200);
        $response->assertJsonPath('total', 10);
        $response->assertJsonPath('available', 5);
        $response->assertJsonPath('adopted', 3);
        $response->assertJsonPath('pending', 2);
    }

    public function test_stats_includes_breakdown_by_species()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        Pet::factory(3)->create(['shelter_id' => $shelter->id, 'species' => 'Dog']);
        Pet::factory(2)->create(['shelter_id' => $shelter->id, 'species' => 'Cat']);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/stats');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'by_species');
    }

    public function test_stats_includes_breakdown_by_gender()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        Pet::factory(4)->create(['shelter_id' => $shelter->id, 'gender' => 'male']);
        Pet::factory(6)->create(['shelter_id' => $shelter->id, 'gender' => 'female']);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/stats');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'by_gender');
    }

    public function test_stats_excludes_other_shelters_pets()
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter1->id]);

        Pet::factory(5)->create(['shelter_id' => $shelter1->id]);
        Pet::factory(10)->create(['shelter_id' => $shelter2->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/stats');

        $response->assertStatus(200);
        $response->assertJsonPath('total', 5);
    }

    public function test_non_admin_cannot_view_stats()
    {
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/admin/pets/dashboard/stats');

        $response->assertStatus(403);
    }

    // ==========================================
    // RECENT ACTIVITY TESTS (Admin only)
    // ==========================================

    public function test_admin_can_view_recent_activity()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        Pet::factory(3)->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/activity');

        $response->assertStatus(200);
        $response->assertJsonStructure(['recent_additions', 'recent_adoptions']);
    }

    public function test_recent_activity_limits_additions_to_five()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        Pet::factory(10)->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/activity');

        $response->assertStatus(200);
        $response->assertJsonCount(5, 'recent_additions');
    }

    public function test_recent_activity_includes_recent_adoptions()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        Pet::factory(3)->create(['shelter_id' => $shelter->id, 'status' => 'adopted']);
        Pet::factory(2)->create(['shelter_id' => $shelter->id, 'status' => 'available']);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/activity');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'recent_adoptions');
    }

    public function test_recent_activity_excludes_other_shelters()
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter1->id]);

        Pet::factory(2)->create(['shelter_id' => $shelter1->id]);
        Pet::factory(5)->create(['shelter_id' => $shelter2->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/dashboard/activity');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'recent_additions');
    }

    public function test_non_admin_cannot_view_recent_activity()
    {
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/admin/pets/dashboard/activity');

        $response->assertStatus(403);
    }

    // ==========================================
    // SHOW FOR ADMIN TESTS (Admin only)
    // ==========================================

    public function test_admin_can_view_pet_for_editing()
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/' . $pet->id);

        $response->assertStatus(200);
        $response->assertJsonPath('id', $pet->id);
    }

    public function test_admin_cannot_view_another_shelters_pet_for_editing()
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'shelter_id' => $shelter1->id]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter2->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/pets/' . $pet->id);

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_view_pet_for_admin_editing()
    {
        $shelter = Shelter::factory()->create();
        $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->getJson('/api/admin/pets/' . $pet->id);

        $response->assertStatus(403);
    }
}
