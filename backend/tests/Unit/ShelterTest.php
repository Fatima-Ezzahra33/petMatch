<?php

namespace Tests\Unit;

use App\Models\Shelter;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShelterTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Shelter model has correct fillable attributes
     */
    public function test_shelter_has_correct_fillable_attributes(): void
    {
        $fillable = ['name', 'address', 'city', 'country', 'phone', 'email'];
        $shelter = new Shelter();

        $this->assertEquals($fillable, $shelter->getFillable());
    }

    /**
     * Test pets relationship returns all pets in shelter
     */
    public function test_pets_relationship_returns_shelter_pets(): void
    {
        $shelter = Shelter::factory()->create();
        $pets = Pet::factory(5)->create(['shelter_id' => $shelter->id]);

        $this->assertTrue($shelter->pets()->exists());
        $this->assertCount(5, $shelter->pets);
        $pets->each(fn ($pet) => $this->assertTrue($shelter->pets->contains($pet)));
    }

    /**
     * Test pets relationship returns empty collection when no pets
     */
    public function test_pets_relationship_returns_empty_collection_when_no_pets(): void
    {
        $shelter = Shelter::factory()->create();

        $this->assertFalse($shelter->pets()->exists());
        $this->assertCount(0, $shelter->pets);
    }

    /**
     * Test admin relationship returns shelter admin
     */
    public function test_admin_relationship_returns_shelter_admin(): void
    {
        $shelter = Shelter::factory()->create();
        $admin = User::factory()->create(['shelter_id' => $shelter->id]);

        $this->assertInstanceOf(User::class, $shelter->admin);
        $this->assertEquals($admin->id, $shelter->admin->id);
    }

    /**
     * Test admin relationship returns null when no admin assigned
     */
    public function test_admin_relationship_returns_null_when_no_admin(): void
    {
        $shelter = Shelter::factory()->create();

        $this->assertNull($shelter->admin);
    }

    /**
     * Test shelter can be created with all attributes
     */
    public function test_shelter_can_be_created_with_all_attributes(): void
    {
        $data = [
            'name' => 'Happy Paws Shelter',
            'address' => '123 Main St',
            'city' => 'New York',
            'country' => 'USA',
            'phone' => '555-1234',
            'email' => 'contact@happypaws.com',
        ];

        $shelter = Shelter::create($data);

        foreach ($data as $key => $value) {
            $this->assertEquals($value, $shelter->$key);
        }
    }

    /**
     * Test multiple shelters can have multiple pets
     */
    public function test_multiple_shelters_can_have_multiple_pets(): void
    {
        $shelter1 = Shelter::factory()->create();
        $shelter2 = Shelter::factory()->create();

        Pet::factory(3)->create(['shelter_id' => $shelter1->id]);
        Pet::factory(2)->create(['shelter_id' => $shelter2->id]);

        $this->assertCount(3, $shelter1->pets);
        $this->assertCount(2, $shelter2->pets);
    }

    /**
     * Test shelter timestamps are created automatically
     */
    public function test_shelter_timestamps_are_created_automatically(): void
    {
        $shelter = Shelter::factory()->create();

        $this->assertNotNull($shelter->created_at);
        $this->assertNotNull($shelter->updated_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $shelter->created_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $shelter->updated_at);
    }
}
