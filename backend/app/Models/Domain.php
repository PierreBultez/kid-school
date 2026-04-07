<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    protected $fillable = ['cycle_id', 'discipline_id', 'code', 'name', 'position'];

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }
}
