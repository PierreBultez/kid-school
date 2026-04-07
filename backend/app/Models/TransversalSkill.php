<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransversalSkill extends Model
{
    protected $fillable = [
        'cycle_id',
        'discipline_id',
        'code',
        'name',
        'description',
        'position',
    ];

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }
}
