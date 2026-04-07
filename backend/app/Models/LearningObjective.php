<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningObjective extends Model
{
    protected $fillable = [
        'topic_id',
        'code',
        'description',
        'level',
        'period_mode',
        'period',
        'position',
    ];

    protected $casts = [
        'period' => 'integer',
        'position' => 'integer',
    ];

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }
}
