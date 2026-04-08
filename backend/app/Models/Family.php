<?php

namespace App\Models;

use Database\Factories\FamilyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Family extends Model
{
    /** @use HasFactory<FamilyFactory> */
    use HasFactory;

    protected $fillable = ['owner_user_id', 'name'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Child::class);
    }
}
