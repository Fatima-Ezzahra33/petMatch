<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\AdoptionApplication;
use App\Models\Favorite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test User model has correct fillable attributes
     */
    public function test_user_has_correct_fillable_attributes(): void
    {
        $fillable = ['name', 'email', 'password', 'phone', 'avatar', 'location', 'username', 'role', 'shelter_id'];
        $user = new User();

        $this->assertEquals($fillable, $user->getFillable());
    }

    /**
     * Test User model has correct hidden attributes
     */
    public function test_user_has_correct_hidden_attributes(): void
    {
        $hidden = ['password', 'remember_token'];
        $user = new User();

        $this->assertEquals($hidden, $user->getHidden());
    }

    /**
     * Test email_verified_at is cast to datetime
     */
    public function test_email_verified_at_is_cast_to_datetime(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->assertIsObject($user->email_verified_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $user->email_verified_at);
    }

    /**
     * Test password is hashed on creation
     */
    public function test_password_is_hashed_on_creation(): void
    {
        $user = User::factory()->create([
            'password' => 'plain-password',
        ]);

        $this->assertNotEquals('plain-password', $user->password);
    }

    /**
     * Test addedPets relationship returns all pets added by user
     */
    public function test_added_pets_relationship_returns_pets(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(3)->create(['added_by' => $user->id]);

        $this->assertTrue($user->addedPets()->exists());
        $this->assertCount(3, $user->addedPets);
        $pets->each(fn ($pet) => $this->assertTrue($user->addedPets->contains($pet)));
    }

    /**
     * Test adoptedPets relationship returns all pets adopted by user
     */
    public function test_adopted_pets_relationship_returns_pets(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(2)->create(['adopted_by' => $user->id]);

        $this->assertTrue($user->adoptedPets()->exists());
        $this->assertCount(2, $user->adoptedPets);
        $pets->each(fn ($pet) => $this->assertTrue($user->adoptedPets->contains($pet)));
    }

    /**
     * Test adoptionApplications relationship
     */
    public function test_adoption_applications_relationship(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(2)->create();
        
        $pets->each(fn ($pet) => AdoptionApplication::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertTrue($user->adoptionApplications()->exists());
        $this->assertCount(2, $user->adoptionApplications);
    }

    /**
     * Test favorites relationship
     */
    public function test_favorites_relationship(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(3)->create();
        
        $pets->each(fn ($pet) => Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertTrue($user->favorites()->exists());
        $this->assertCount(3, $user->favorites);
    }

    /**
     * Test favoritePets many-to-many relationship
     */
    public function test_favorite_pets_many_to_many_relationship(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(3)->create();
        
        $pets->each(fn ($pet) => Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertTrue($user->favoritePets()->exists());
        $this->assertCount(3, $user->favoritePets);
        $pets->each(fn ($pet) => $this->assertTrue($user->favoritePets->contains($pet)));
    }

    /**
     * Test favoritePets relationship includes timestamps
     */
    public function test_favorite_pets_relationship_includes_timestamps(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        
        Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        $userPet = $user->favoritePets()->first();
        $this->assertNotNull($userPet->pivot->created_at);
        $this->assertNotNull($userPet->pivot->updated_at);
    }

    /**
     * Test shelter relationship
     */
    public function test_shelter_relationship(): void
    {
        $shelter = Shelter::factory()->create();
        $user = User::factory()->create(['shelter_id' => $shelter->id]);

        $this->assertInstanceOf(Shelter::class, $user->shelter);
        $this->assertEquals($shelter->id, $user->shelter->id);
    }

    /**
     * Test isAdmin helper method returns true for admin role
     */
    public function test_is_admin_returns_true_for_admin_role(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->assertTrue($user->isAdmin());
    }

    /**
     * Test isAdmin helper method returns false for non-admin roles
     */
    public function test_is_admin_returns_false_for_non_admin_roles(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->assertFalse($user->isAdmin());
    }

    /**
     * Test isUser helper method returns true for user role
     */
    public function test_is_user_returns_true_for_user_role(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->assertTrue($user->isUser());
    }

    /**
     * Test isUser helper method returns false for non-user roles
     */
    public function test_is_user_returns_false_for_non_user_roles(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->assertFalse($user->isUser());
    }

    /**
     * Test user can have multiple relationships simultaneously
     */
    public function test_user_can_have_multiple_relationships(): void
    {
        $user = User::factory()->create();
        $shelter = Shelter::factory()->create();
        
        Pet::factory(2)->create(['added_by' => $user->id]);
        Pet::factory(1)->create(['adopted_by' => $user->id]);
        AdoptionApplication::factory(1)->create(['user_id' => $user->id]);

        $this->assertCount(2, $user->addedPets);
        $this->assertCount(1, $user->adoptedPets);
        $this->assertCount(1, $user->adoptionApplications);
    }
}
