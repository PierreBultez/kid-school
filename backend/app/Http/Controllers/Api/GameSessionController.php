<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\Game;
use App\Models\GameSession;
use App\Models\ObjectiveProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class GameSessionController extends Controller
{
    /**
     * Start a new game session for the active child.
     */
    public function store(Request $request): JsonResource
    {
        /** @var Child $child */
        $child = $request->attributes->get('activeChild');

        $data = $request->validate([
            'game_id' => ['required', 'integer', Rule::exists('games', 'id')->where('is_published', true)],
        ]);

        $session = GameSession::create([
            'child_id' => $child->id,
            'game_id' => $data['game_id'],
            'status' => GameSession::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ]);

        return JsonResource::make($session);
    }

    /**
     * Record a single answer within an in-progress session.
     * Updates both the session aggregates and the per-objective progress.
     */
    public function answer(Request $request, GameSession $gameSession): JsonResource
    {
        $this->authorizeSession($request, $gameSession);

        if ($gameSession->status !== GameSession::STATUS_IN_PROGRESS) {
            abort(Response::HTTP_CONFLICT, 'Session is not in progress.');
        }

        $data = $request->validate([
            'learning_objective_id' => ['required', 'integer', Rule::exists('learning_objectives', 'id')],
            'correct' => ['required', 'boolean'],
        ]);

        // Make sure the answered objective is actually targeted by this game.
        $belongs = $gameSession->game->learningObjectives()
            ->where('learning_objectives.id', $data['learning_objective_id'])
            ->exists();

        if (! $belongs) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'This objective is not part of the game.');
        }

        $gameSession->total_questions++;
        if ($data['correct']) {
            $gameSession->correct_answers++;
            $gameSession->score += 10;
        }
        $gameSession->save();

        $progress = ObjectiveProgress::firstOrNew([
            'child_id' => $gameSession->child_id,
            'learning_objective_id' => $data['learning_objective_id'],
        ]);
        $progress->recordAnswer((bool) $data['correct']);

        return JsonResource::make($gameSession->fresh());
    }

    /**
     * Mark the session as completed (or abandoned) and return its final state.
     */
    public function finish(Request $request, GameSession $gameSession): JsonResource
    {
        $this->authorizeSession($request, $gameSession);

        $data = $request->validate([
            'status' => ['nullable', Rule::in([GameSession::STATUS_COMPLETED, GameSession::STATUS_ABANDONED])],
        ]);

        $gameSession->update([
            'status' => $data['status'] ?? GameSession::STATUS_COMPLETED,
            'ended_at' => now(),
        ]);

        return JsonResource::make($gameSession);
    }

    public function show(Request $request, GameSession $gameSession): JsonResource
    {
        $this->authorizeSession($request, $gameSession);

        return JsonResource::make($gameSession);
    }

    private function authorizeSession(Request $request, GameSession $session): void
    {
        /** @var Child $child */
        $child = $request->attributes->get('activeChild');

        if ($session->child_id !== $child->id) {
            abort(Response::HTTP_FORBIDDEN);
        }
    }
}
