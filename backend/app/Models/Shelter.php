<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Shelter extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'address', 'city', 'country', 'phone', 'email'];

    public function pets()
    {
        return $this->hasMany(Pet::class);
    }
    public function admin()
    {
        return $this->hasOne(\App\Models\User::class);
    }
}


