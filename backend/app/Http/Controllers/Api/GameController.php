<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\Game;
use App\Models\ObjectiveProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

class GameController extends Controller
{
    /**
     * List the published games available to the active child profile.
     */
    /** Ordered list of supported grade levels (used for min/max comparisons). */
    private const GRADE_ORDER = ['CM1' => 1, 'CM2' => 2, '6EME' => 3];

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var Child $child */
        $child = $request->attributes->get('activeChild');
        $childGrade = self::GRADE_ORDER[$child->grade_level] ?? 0;

        $games = Game::query()
            ->where('is_published', true)
            ->with('learningObjectives:id,code,description')
            ->orderBy('name')
            ->get()
            ->filter(function (Game $game) use ($childGrade) {
                $min = self::GRADE_ORDER[$game->min_grade] ?? null;
                $max = self::GRADE_ORDER[$game->max_grade] ?? null;

                return ($min === null || $min <= $childGrade)
                    && ($max === null || $max >= $childGrade);
            })
            ->values();

        return JsonResource::collection($games);
    }

    /**
     * Show a single game by slug for the active child profile.
     */
    public function show(Request $request, string $slug): JsonResource
    {
        /** @var Child $child */
        $child = $request->attributes->get('activeChild');

        $game = Game::where('slug', $slug)
            ->where('is_published', true)
            ->with('learningObjectives:id,code,description')
            ->firstOrFail();

        $objectiveIds = $game->learningObjectives->pluck('id');

        $progressByObjective = ObjectiveProgress::where('child_id', $child->id)
            ->whereIn('learning_objective_id', $objectiveIds)
            ->get()
            ->keyBy('learning_objective_id');

        $enriched = $game->learningObjectives->map(function ($obj) use ($progressByObjective) {
            $progress = $progressByObjective->get($obj->id);

            return [
                'id' => $obj->id,
                'code' => $obj->code,
                'description' => $obj->description,
                'mastery' => $progress?->mastery ?? 0,
                'attempts' => $progress?->attempts ?? 0,
            ];
        });

        $game->unsetRelation('learningObjectives');
        $game->setAttribute('learning_objectives', $enriched->values());

        return JsonResource::make($game);
    }
}
