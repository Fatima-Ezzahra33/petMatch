<?php

namespace Tests\Unit;

use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use App\Models\AdoptionApplication;
use App\Models\Favorite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetTest extends TestCase
{
    use RefreshDatabase;

    public function test_belongs_to_shelter_returns_true_when_ids_match(): void
    {
        $pet = new Pet(['shelter_id' => 10]);

        $this->assertTrue($pet->belongsToShelter(10));
    }

    public function test_belongs_to_shelter_returns_false_when_ids_do_not_match(): void
    {
        $pet = new Pet(['shelter_id' => 10]);

        $this->assertFalse($pet->belongsToShelter(5));
    }

    public function test_is_available_returns_true_only_for_available_status(): void
    {
        $petAvailable = new Pet(['status' => 'available']);
        $petPending = new Pet(['status' => 'pending']);
        $petAdopted = new Pet(['status' => 'adopted']);

        $this->assertTrue($petAvailable->isAvailable());
        $this->assertFalse($petPending->isAvailable());
        $this->assertFalse($petAdopted->isAvailable());
    }

    public function test_is_adopted_returns_true_only_for_adopted_status(): void
    {
        $petAdopted = new Pet(['status' => 'adopted']);
        $petAvailable = new Pet(['status' => 'available']);
        $petPending = new Pet(['status' => 'pending']);

        $this->assertTrue($petAdopted->isAdopted());
        $this->assertFalse($petAvailable->isAdopted());
        $this->assertFalse($petPending->isAdopted());
    }

    public function test_age_is_cast_to_integer(): void
    {
        $pet = new Pet(['age' => '7']);

        $this->assertIsInt($pet->age);
        $this->assertSame(7, $pet->age);
    }

    /**
     * Test Pet model has correct fillable attributes
     */
    public function test_pet_has_correct_fillable_attributes(): void
    {
        $fillable = ['name', 'species', 'type', 'age', 'description', 'profile_picture', 'shelter_id', 'added_by', 'adopted_by', 'gender', 'status'];
        $pet = new Pet();

        $this->assertEquals($fillable, $pet->getFillable());
    }

    /**
     * Test shelter relationship returns the associated shelter
     */
    public function test_shelter_relationship_returns_associated_shelter(): void
    {
        $shelter = Shelter::factory()->create();
        $pet = Pet::factory()->create(['shelter_id' => $shelter->id]);

        $this->assertInstanceOf(Shelter::class, $pet->shelter);
        $this->assertEquals($shelter->id, $pet->shelter->id);
    }

    /**
     * Test addedBy relationship returns the user who added the pet
     */
    public function test_added_by_relationship_returns_adding_user(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create(['added_by' => $user->id]);

        $this->assertInstanceOf(User::class, $pet->addedBy);
        $this->assertEquals($user->id, $pet->addedBy->id);
    }

    /**
     * Test addedBy relationship returns null when no user assigned
     */
    public function test_added_by_relationship_returns_null_when_not_assigned(): void
    {
        $pet = Pet::factory()->create(['added_by' => null]);

        $this->assertNull($pet->addedBy);
    }

    /**
     * Test adoptedBy relationship returns the user who adopted the pet
     */
    public function test_adopted_by_relationship_returns_adopting_user(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create(['adopted_by' => $user->id]);

        $this->assertInstanceOf(User::class, $pet->adoptedBy);
        $this->assertEquals($user->id, $pet->adoptedBy->id);
    }

    /**
     * Test adoptedBy relationship returns null when pet not adopted
     */
    public function test_adopted_by_relationship_returns_null_when_not_adopted(): void
    {
        $pet = Pet::factory()->create(['adopted_by' => null]);

        $this->assertNull($pet->adoptedBy);
    }

    /**
     * Test adoptionApplications relationship
     */
    public function test_adoption_applications_relationship(): void
    {
        $pet = Pet::factory()->create();
        $users = User::factory(3)->create();

        $users->each(fn ($user) => AdoptionApplication::factory()->create([
            'pet_id' => $pet->id,
            'user_id' => $user->id,
        ]));

        $this->assertTrue($pet->adoptionApplications()->exists());
        $this->assertCount(3, $pet->adoptionApplications);
    }

    /**
     * Test adoptionApplications returns empty when none exist
     */
    public function test_adoption_applications_returns_empty_when_none_exist(): void
    {
        $pet = Pet::factory()->create();

        $this->assertFalse($pet->adoptionApplications()->exists());
        $this->assertCount(0, $pet->adoptionApplications);
    }

    /**
     * Test favoritedBy many-to-many relationship
     */
    public function test_favorited_by_relationship_returns_users(): void
    {
        $pet = Pet::factory()->create();
        $users = User::factory(4)->create();

        $users->each(fn ($user) => Favorite::factory()->create([
            'pet_id' => $pet->id,
            'user_id' => $user->id,
        ]));

        $this->assertTrue($pet->favoritedBy()->exists());
        $this->assertCount(4, $pet->favoritedBy);
        $users->each(fn ($user) => $this->assertTrue($pet->favoritedBy->contains($user)));
    }

    /**
     * Test favoritedBy returns empty when no users favorited
     */
    public function test_favorited_by_returns_empty_when_no_favorites(): void
    {
        $pet = Pet::factory()->create();

        $this->assertFalse($pet->favoritedBy()->exists());
        $this->assertCount(0, $pet->favoritedBy);
    }

    /**
     * Test favoritedBy relationship includes timestamps
     */
    public function test_favorited_by_relationship_includes_timestamps(): void
    {
        $pet = Pet::factory()->create();
        $user = User::factory()->create();

        Favorite::factory()->create([
            'pet_id' => $pet->id,
            'user_id' => $user->id,
        ]);

        $favoriteUser = $pet->favoritedBy()->first();
        $this->assertNotNull($favoriteUser->pivot->created_at);
        $this->assertNotNull($favoriteUser->pivot->updated_at);
    }

    /**
     * Test pet can be created with all attributes
     */
    public function test_pet_can_be_created_with_all_attributes(): void
    {
        $shelter = Shelter::factory()->create();
        $addedByUser = User::factory()->create();

        $data = [
            'name' => 'Buddy',
            'species' => 'Canine',
            'type' => 'Golden Retriever',
            'age' => 3,
            'description' => 'Friendly and energetic dog',
            'profile_picture' => 'buddy.jpg',
            'shelter_id' => $shelter->id,
            'added_by' => $addedByUser->id,
            'adopted_by' => null,
            'gender' => 'male',
            'status' => 'available',
        ];

        $pet = Pet::create($data);

        foreach ($data as $key => $value) {
            $this->assertEquals($value, $pet->$key);
        }
    }

    /**
     * Test pet timestamps are created automatically
     */
    public function test_pet_timestamps_are_created_automatically(): void
    {
        $pet = Pet::factory()->create();

        $this->assertNotNull($pet->created_at);
        $this->assertNotNull($pet->updated_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $pet->created_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $pet->updated_at);
    }

    /**
     * Test multiple users can favorite the same pet
     */
    public function test_multiple_users_can_favorite_same_pet(): void
    {
        $pet = Pet::factory()->create();
        $users = User::factory(3)->create();

        $users->each(fn ($user) => $user->favoritePets()->attach($pet));

        $this->assertCount(3, $pet->favoritedBy);
    }

    /**
     * Test pet can be associated with multiple adoption applications
     */
    public function test_pet_can_have_multiple_adoption_applications(): void
    {
        $pet = Pet::factory()->create();
        User::factory(5)->create()->each(fn ($user) => 
            AdoptionApplication::factory()->create([
                'pet_id' => $pet->id,
                'user_id' => $user->id,
            ])
        );

        $this->assertCount(5, $pet->adoptionApplications);
    }

    /**
     * Test pet relationships are properly configured
     */
    public function test_pet_relationships_are_properly_configured(): void
    {
        $shelter = Shelter::factory()->create();
        $addedByUser = User::factory()->create();
        $adoptedByUser = User::factory()->create();

        $pet = Pet::factory()->create([
            'shelter_id' => $shelter->id,
            'added_by' => $addedByUser->id,
            'adopted_by' => $adoptedByUser->id,
        ]);

        // Test all relationships are accessible
        $this->assertEquals($shelter->id, $pet->shelter->id);
        $this->assertEquals($addedByUser->id, $pet->addedBy->id);
        $this->assertEquals($adoptedByUser->id, $pet->adoptedBy->id);

        // Test reverse relationships
        $this->assertTrue($shelter->pets->contains($pet));
        $this->assertTrue($addedByUser->addedPets->contains($pet));
        $this->assertTrue($adoptedByUser->adoptedPets->contains($pet));
    }
}
