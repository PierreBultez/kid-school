<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cycle extends Model
{
    protected $fillable = ['code', 'name', 'position'];

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function transversalSkills(): HasMany
    {
        return $this->hasMany(TransversalSkill::class);
    }
}
