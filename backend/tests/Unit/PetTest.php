<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Pet;

class PetTest extends TestCase
{
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
}
