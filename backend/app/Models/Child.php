<?php

namespace App\Models;

use Database\Factories\ChildFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Child extends Model
{
    /** @use HasFactory<ChildFactory> */
    use HasFactory;

    protected $fillable = ['family_id', 'display_name', 'avatar', 'birthdate', 'grade_level'];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }
}
