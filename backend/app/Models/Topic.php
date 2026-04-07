<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    protected $fillable = ['domain_id', 'code', 'name', 'position'];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function learningObjectives(): HasMany
    {
        return $this->hasMany(LearningObjective::class);
    }
}
