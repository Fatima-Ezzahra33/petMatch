<?php

namespace Tests\Feature;

use App\Models\Favorite;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteControllerTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // INDEX - LIST USER FAVORITES TESTS
    // ==========================================

    public function test_authenticated_user_can_list_their_favorites()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet1 = Pet::factory()->create(['shelter_id' => $shelter->id]);
        $pet2 = Pet::factory()->create(['shelter_id' => $shelter->id]);

        Favorite::factory()->create(['user_id' => $user->id, 'pet_id' => $pet1->id]);
        Favorite::factory()->create(['user_id' => $user->id, 'pet_id' => $pet2->id]);

        $response = $this->actingAs($user)->getJson('/api/favorites');

        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['id' => $pet1->id]);
        $response->assertJsonFragment(['id' => $pet2->id]);
    }

    public function test_user_with_no_favorites_returns_empty_list()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/favorites');

        $response->assertStatus(200);
        $response->assertJsonCount(0);
    }

    public function test_user_only_sees_their_own_favorites()
    {
        $user1 = User::factory()->create(['email_verified_at' => now()]);
        $user2 = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet1 = Pet::factory()->create(['shelter_id' => $shelter->id]);
        $pet2 = Pet::factory()->create(['shelter_id' => $shelter->id]);
        $pet3 = Pet::factory()->create(['shelter_id' => $shelter->id]);

        Favorite::factory()->create(['user_id' => $user1->id, 'pet_id' => $pet1->id]);
        Favorite::factory()->create(['user_id' => $user1->id, 'pet_id' => $pet2->id]);
        Favorite::factory()->create(['user_id' => $user2->id, 'pet_id' => $pet3->id]);

        $response = $this->actingAs($user1)->getJson('/api/favorites');

        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['id' => $pet1->id]);
        $response->assertJsonFragment(['id' => $pet2->id]);
    }

    public function test_favorites_list_includes_all_pet_data()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create(['name' => 'Happy Paws Shelter']);
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Buddy']);

        Favorite::factory()->create(['user_id' => $user->id, 'pet_id' => $pet->id]);

        $response = $this->actingAs($user)->getJson('/api/favorites');

        $response->assertStatus(200);
        $response->assertJsonPath('0.name', 'Buddy');
        $response->assertJsonPath('0.id', $pet->id);
    }

    public function test_unauthenticated_user_cannot_list_favorites()
    {
        $response = $this->getJson('/api/favorites');

        $response->assertStatus(401);
    }

    // ==========================================
    // STORE FAVORITE TESTS
    // ==========================================

    public function test_user_can_add_pet_to_favorites()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->postJson('/api/pets/' . $pet->id . '/favorites', []);

        $response->assertStatus(201);
        $response->assertJson(['message' => 'Added to favorites']);
        $this->assertDatabaseHas('favorites', [
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);
    }

    public function test_user_cannot_add_same_pet_to_favorites_twice()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        Favorite::factory()->create(['user_id' => $user->id, 'pet_id' => $pet->id]);

        $response = $this->actingAs($user)->postJson('/api/pets/' . $pet->id . '/favorites', []);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Already in favorites']);
        $this->assertDatabaseHas('favorites', ['user_id' => $user->id, 'pet_id' => $pet->id]);
        $this->assertEquals(1, Favorite::where('user_id', $user->id)->where('pet_id', $pet->id)->count());
    }

    public function test_store_favorite_returns_favorite_object()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->postJson('/api/pets/' . $pet->id . '/favorites', []);

        $response->assertStatus(201);
        $response->assertJsonStructure(['message', 'favorite']);
        $response->assertJsonPath('favorite.user_id', $user->id);
        $response->assertJsonPath('favorite.pet_id', $pet->id);
    }

    public function test_multiple_users_can_favorite_same_pet()
    {
        $user1 = User::factory()->create(['email_verified_at' => now()]);
        $user2 = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $this->actingAs($user1)->postJson('/api/pets/' . $pet->id . '/favorites', []);
        $this->actingAs($user2)->postJson('/api/pets/' . $pet->id . '/favorites', []);

        $this->assertDatabaseHas('favorites', ['user_id' => $user1->id, 'pet_id' => $pet->id]);
        $this->assertDatabaseHas('favorites', ['user_id' => $user2->id, 'pet_id' => $pet->id]);
        $this->assertEquals(2, Favorite::where('pet_id', $pet->id)->count());
    }

    public function test_unauthenticated_user_cannot_add_favorite()
    {
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->postJson('/api/pets/' . $pet->id . '/favorites', []);

        $response->assertStatus(401);
    }

    public function test_store_favorite_for_nonexistent_pet_returns_404()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->postJson('/api/pets/99999/favorites', []);

        $response->assertStatus(404);
    }

    // ==========================================
    // DESTROY FAVORITE TESTS
    // ==========================================

    public function test_user_can_remove_favorite()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        Favorite::factory()->create(['user_id' => $user->id, 'pet_id' => $pet->id]);

        $response = $this->actingAs($user)->deleteJson('/api/pets/' . $pet->id . '/favorites');

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Removed from favorites']);
        $this->assertDatabaseMissing('favorites', [
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);
    }

    public function test_user_cannot_remove_nonexistent_favorite()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($user)->deleteJson('/api/pets/' . $pet->id . '/favorites');

        $response->assertStatus(404);
        $response->assertJson(['message' => 'Not found']);
    }

    public function test_user_cannot_remove_another_users_favorite()
    {
        $user1 = User::factory()->create(['email_verified_at' => now()]);
        $user2 = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        Favorite::factory()->create(['user_id' => $user1->id, 'pet_id' => $pet->id]);

        $response = $this->actingAs($user2)->deleteJson('/api/pets/' . $pet->id . '/favorites');

        $response->assertStatus(404);
        $this->assertDatabaseHas('favorites', [
            'user_id' => $user1->id,
            'pet_id' => $pet->id,
        ]);
    }

    public function test_destroy_favorite_for_nonexistent_pet_returns_404()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->deleteJson('/api/pets/99999/favorites');

        $response->assertStatus(404);
    }

    public function test_unauthenticated_user_cannot_remove_favorite()
    {
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->deleteJson('/api/pets/' . $pet->id . '/favorites');

        $response->assertStatus(401);
    }

    // ==========================================
    // INTEGRATION TESTS
    // ==========================================

    public function test_full_favorite_workflow()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet1 = Pet::factory()->create(['shelter_id' => $shelter->id]);
        $pet2 = Pet::factory()->create(['shelter_id' => $shelter->id]);

        // User adds first pet to favorites
        $this->actingAs($user)->postJson('/api/pets/' . $pet1->id . '/favorites', []);
        $response = $this->actingAs($user)->getJson('/api/favorites');
        $response->assertJsonCount(1);

        // User adds second pet to favorites
        $this->actingAs($user)->postJson('/api/pets/' . $pet2->id . '/favorites', []);
        $response = $this->actingAs($user)->getJson('/api/favorites');
        $response->assertJsonCount(2);

        // User removes first pet from favorites
        $this->actingAs($user)->deleteJson('/api/pets/' . $pet1->id . '/favorites');
        $response = $this->actingAs($user)->getJson('/api/favorites');
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['id' => $pet2->id]);
    }

    public function test_favorites_persist_across_requests()
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id, 'name' => 'Buddy']);

        $this->actingAs($user)->postJson('/api/pets/' . $pet->id . '/favorites', []);

        // Request favorites multiple times and ensure data persists
        $response1 = $this->actingAs($user)->getJson('/api/favorites');
        $response2 = $this->actingAs($user)->getJson('/api/favorites');

        $response1->assertJsonFragment(['id' => $pet->id]);
        $response2->assertJsonFragment(['id' => $pet->id]);
        $response1->assertJsonCount(1);
        $response2->assertJsonCount(1);
    }

    public function test_admin_can_see_users_cannot_add_favorites()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $response = $this->actingAs($admin)->postJson('/api/pets/' . $pet->id . '/favorites', []);

        // Should fail for non-user role (or admin can still use it - depends on implementation)
        // This test documents that favorites should only be for regular users
        // If admins shouldn't use this endpoint, response should be 403
        // Based on the routes, this endpoint is under 'role:user' middleware
        $response->assertStatus(403);
    }
}
