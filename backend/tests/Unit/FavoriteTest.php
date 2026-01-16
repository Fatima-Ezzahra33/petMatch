<?php

namespace Tests\Unit;

use App\Models\Favorite;
use App\Models\User;
use App\Models\Pet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Favorite model has correct fillable attributes
     */
    public function test_favorite_has_correct_fillable_attributes(): void
    {
        $fillable = ['user_id', 'pet_id'];
        $favorite = new Favorite();

        $this->assertEquals($fillable, $favorite->getFillable());
    }

    /**
     * Test user relationship returns the associated user
     */
    public function test_user_relationship_returns_associated_user(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        $favorite = Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        $this->assertInstanceOf(User::class, $favorite->user);
        $this->assertEquals($user->id, $favorite->user->id);
    }

    /**
     * Test pet relationship returns the associated pet
     */
    public function test_pet_relationship_returns_associated_pet(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        $favorite = Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        $this->assertInstanceOf(Pet::class, $favorite->pet);
        $this->assertEquals($pet->id, $favorite->pet->id);
    }

    /**
     * Test favorite can be created with user and pet
     */
    public function test_favorite_can_be_created_with_user_and_pet(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();

        $favorite = Favorite::create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        $this->assertNotNull($favorite->id);
        $this->assertEquals($user->id, $favorite->user_id);
        $this->assertEquals($pet->id, $favorite->pet_id);
    }

    /**
     * Test favorite timestamps are created automatically
     */
    public function test_favorite_timestamps_are_created_automatically(): void
    {
        $favorite = Favorite::factory()->create();

        $this->assertNotNull($favorite->created_at);
        $this->assertNotNull($favorite->updated_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $favorite->created_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $favorite->updated_at);
    }

    /**
     * Test user can have multiple favorites
     */
    public function test_user_can_have_multiple_favorites(): void
    {
        $user = User::factory()->create();
        $pets = Pet::factory(5)->create();

        $pets->each(fn ($pet) => Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertCount(5, Favorite::where('user_id', $user->id)->get());
    }

    /**
     * Test pet can be favorited by multiple users
     */
    public function test_pet_can_be_favorited_by_multiple_users(): void
    {
        $pet = Pet::factory()->create();
        $users = User::factory(3)->create();

        $users->each(fn ($user) => Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]));

        $this->assertCount(3, Favorite::where('pet_id', $pet->id)->get());
    }

    /**
     * Test removing favorite deletes the record
     */
    public function test_removing_favorite_deletes_the_record(): void
    {
        $favorite = Favorite::factory()->create();
        $id = $favorite->id;

        $favorite->delete();

        $this->assertNull(Favorite::find($id));
    }

    /**
     * Test favorite has correct relationships set up
     */
    public function test_favorite_relationships_are_properly_configured(): void
    {
        $user = User::factory()->create();
        $pet = Pet::factory()->create();
        $favorite = Favorite::factory()->create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
        ]);

        // Test that we can access user and pet through favorite
        $this->assertEquals($user->name, $favorite->user->name);
        $this->assertEquals($pet->name, $favorite->pet->name);

        // Test that we can access favorites through user and pet
        $this->assertTrue($user->favorites->contains($favorite));
        $this->assertTrue($pet->favoritedBy->contains($user));
    }
}
