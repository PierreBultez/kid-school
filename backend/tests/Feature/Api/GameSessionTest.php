<?php

use App\Models\Child;
use App\Models\Cycle;
use App\Models\Discipline;
use App\Models\Domain;
use App\Models\Family;
use App\Models\Game;
use App\Models\GameSession;
use App\Models\LearningObjective;
use App\Models\ObjectiveProgress;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeChildWithObjective(): array
{
    $user = User::factory()->create(['role' => 'parent']);
    $family = Family::factory()->create(['owner_user_id' => $user->id]);
    $child = Child::factory()->create(['family_id' => $family->id, 'grade_level' => 'CM1']);
    $user->forceFill(['active_child_id' => $child->id])->save();

    $cycle = Cycle::firstOrCreate(['code' => 'C3'], ['name' => 'Cycle 3', 'position' => 3]);
    $discipline = Discipline::firstOrCreate(['code' => 'MAT'], ['name' => 'Mathématiques', 'position' => 1]);
    $domain = Domain::firstOrCreate(
        ['cycle_id' => $cycle->id, 'discipline_id' => $discipline->id, 'code' => 'EGE'],
        ['name' => 'Espace et géométrie', 'position' => 1],
    );
    $topic = Topic::firstOrCreate(
        ['domain_id' => $domain->id, 'code' => 'SYM'],
        ['name' => 'Symétrie', 'description' => 'Test topic', 'position' => 1],
    );
    $objective = LearningObjective::create([
        'topic_id' => $topic->id,
        'code' => 'TEST-OBJ-'.fake()->unique()->numerify('###'),
        'level' => 'cm1',
        'period_mode' => 'none',
        'description' => 'Reconnaître une symétrie',
    ]);

    $game = Game::factory()->create();
    $game->learningObjectives()->attach($objective->id);

    return compact('user', 'child', 'objective', 'game');
}

it('lists games available for the active child', function () {
    ['user' => $user] = makeChildWithObjective();

    $response = $this->actingAs($user)->getJson('/api/games');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

it('returns 409 when no active child is selected', function () {
    $user = User::factory()->create(['role' => 'parent']);
    Family::factory()->create(['owner_user_id' => $user->id]);

    $this->actingAs($user)->getJson('/api/games')->assertStatus(409);
});

it('runs a full game session: start, answer, finish, update mastery', function () {
    ['user' => $user, 'child' => $child, 'objective' => $objective, 'game' => $game] = makeChildWithObjective();

    // 1. Start a session
    $start = $this->actingAs($user)->postJson('/api/game-sessions', ['game_id' => $game->id]);
    $start->assertCreated();
    $sessionId = $start->json('data.id');

    // 2. Answer 3 correct, 1 wrong
    foreach ([true, true, false, true] as $correct) {
        $this->actingAs($user)->postJson("/api/game-sessions/{$sessionId}/answer", [
            'learning_objective_id' => $objective->id,
            'correct' => $correct,
        ])->assertOk();
    }

    // 3. Finish the session
    $finish = $this->actingAs($user)->postJson("/api/game-sessions/{$sessionId}/finish");
    $finish->assertOk();

    $session = GameSession::find($sessionId);
    expect($session->status)->toBe('completed');
    expect($session->total_questions)->toBe(4);
    expect($session->correct_answers)->toBe(3);
    expect($session->score)->toBe(30);
    expect($session->ended_at)->not->toBeNull();

    $progress = ObjectiveProgress::where('child_id', $child->id)
        ->where('learning_objective_id', $objective->id)
        ->first();
    expect($progress)->not->toBeNull();
    expect($progress->attempts)->toBe(4);
    expect($progress->correct)->toBe(3);
    expect($progress->mastery)->toBeGreaterThan(0)->toBeLessThanOrEqual(100);
    expect($progress->streak)->toBe(1);
});

it('forbids answering a session that does not belong to the active child', function () {
    ['user' => $user, 'game' => $game] = makeChildWithObjective();
    ['user' => $other, 'objective' => $objective] = makeChildWithObjective();

    // Start a session for the other child
    $start = $this->actingAs($other)->postJson('/api/game-sessions', ['game_id' => $game->id]);
    $sessionId = $start->json('data.id');

    // First user tries to answer it
    $this->actingAs($user)->postJson("/api/game-sessions/{$sessionId}/answer", [
        'learning_objective_id' => $objective->id,
        'correct' => true,
    ])->assertForbidden();
});
