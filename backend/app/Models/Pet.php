<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Pet extends Model
{
    use HasFactory;
    protected $fillable = [
        'name','species','type','age','description','profile_picture',
        'shelter_id','added_by','adopted_by','gender','status'
    ];
    protected $casts = [
        'age' => 'integer',
    ];

    public function shelter()
    {
        return $this->belongsTo(Shelter::class);
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function adoptedBy()
    {
        return $this->belongsTo(User::class, 'adopted_by');
    }

    public function adoptionApplications()
    {
        return $this->hasMany(AdoptionApplication::class);
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }
    // Helper methods
    public function belongsToShelter(int $shelterId): bool
    {
        return $this->shelter_id === $shelterId;
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function isAdopted(): bool
    {
        return $this->status === 'adopted';
    }
}

