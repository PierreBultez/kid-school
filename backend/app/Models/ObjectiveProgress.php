<?php

namespace App\Models;

use Database\Factories\ObjectiveProgressFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ObjectiveProgress extends Model
{
    /** @use HasFactory<ObjectiveProgressFactory> */
    use HasFactory;

    protected $table = 'objective_progress';

    /**
     * EWMA smoothing factor for the v1 mastery score.
     * Higher = more weight on recent answers.
     */
    private const EWMA_ALPHA = 0.30;

    protected $fillable = [
        'child_id',
        'learning_objective_id',
        'attempts',
        'correct',
        'mastery',
        'streak',
        'last_practiced_at',
        'last_correct_at',
        'sm2_ease_factor',
        'sm2_interval_days',
        'sm2_repetitions',
        'sm2_due_at',
        'elo_rating',
    ];

    protected function casts(): array
    {
        return [
            'last_practiced_at' => 'datetime',
            'last_correct_at' => 'datetime',
            'sm2_due_at' => 'datetime',
            'sm2_ease_factor' => 'float',
        ];
    }

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class);
    }

    public function objective(): BelongsTo
    {
        return $this->belongsTo(LearningObjective::class, 'learning_objective_id');
    }

    /**
     * Apply a single answer to the progress record using the v1 EWMA formula.
     * SM-2 / Elo updates will plug in here later without changing call sites.
     */
    public function recordAnswer(bool $correct): void
    {
        $this->attempts++;
        if ($correct) {
            $this->correct++;
            $this->streak++;
            $this->last_correct_at = now();
        } else {
            $this->streak = 0;
        }
        $this->last_practiced_at = now();

        $value = $correct ? 100 : 0;
        $previous = $this->attempts === 1 ? $value : (int) $this->mastery;
        $this->mastery = (int) round(self::EWMA_ALPHA * $value + (1 - self::EWMA_ALPHA) * $previous);

        $this->save();
    }
}
