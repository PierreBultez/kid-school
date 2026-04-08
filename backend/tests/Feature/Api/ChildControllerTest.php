<?php

use App\Models\Child;
use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeParentWithFamily(): User
{
    $user = User::factory()->create(['role' => 'parent']);
    Family::factory()->create(['owner_user_id' => $user->id]);

    return $user->fresh();
}

it('lists only children of the authenticated family', function () {
    $parent = makeParentWithFamily();
    $other = makeParentWithFamily();

    Child::factory()->count(2)->create(['family_id' => $parent->family->id]);
    Child::factory()->count(3)->create(['family_id' => $other->family->id]);

    $response = $this->actingAs($parent)->getJson('/api/children');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('creates a child for the authenticated family', function () {
    $parent = makeParentWithFamily();

    $response = $this->actingAs($parent)->postJson('/api/children', [
        'display_name' => 'Lou',
        'birthdate' => now()->subYears(9)->toDateString(),
        'grade_level' => 'CM1',
    ]);

    $response->assertCreated();
    expect(Child::where('family_id', $parent->family->id)->where('display_name', 'Lou')->exists())->toBeTrue();
});

it('rejects a child younger than 7 years old', function () {
    $parent = makeParentWithFamily();

    $response = $this->actingAs($parent)->postJson('/api/children', [
        'display_name' => 'Bébé',
        'birthdate' => now()->subYears(5)->toDateString(),
        'grade_level' => 'CM1',
    ]);

    $response->assertStatus(422);
});

it('rejects an invalid grade level', function () {
    $parent = makeParentWithFamily();

    $response = $this->actingAs($parent)->postJson('/api/children', [
        'display_name' => 'Lou',
        'birthdate' => now()->subYears(9)->toDateString(),
        'grade_level' => 'CE2',
    ]);

    $response->assertStatus(422);
});

it('forbids accessing a child from another family', function () {
    $parent = makeParentWithFamily();
    $other = makeParentWithFamily();
    $otherChild = Child::factory()->create(['family_id' => $other->family->id]);

    $this->actingAs($parent)->getJson("/api/children/{$otherChild->id}")->assertForbidden();
    $this->actingAs($parent)->deleteJson("/api/children/{$otherChild->id}")->assertForbidden();
});

it('updates a child of the authenticated family', function () {
    $parent = makeParentWithFamily();
    $child = Child::factory()->create(['family_id' => $parent->family->id, 'grade_level' => 'CM1']);

    $response = $this->actingAs($parent)->patchJson("/api/children/{$child->id}", [
        'grade_level' => 'CM2',
    ]);

    $response->assertOk();
    expect($child->fresh()->grade_level)->toBe('CM2');
});

it('selects an active child profile on the user', function () {
    $parent = makeParentWithFamily();
    $child = Child::factory()->create(['family_id' => $parent->family->id]);

    $response = $this->actingAs($parent)->postJson("/api/children/{$child->id}/select");

    $response->assertOk()->assertJson(['active_child_id' => $child->id]);
    expect($parent->fresh()->active_child_id)->toBe($child->id);
});

it('forbids selecting a child from another family', function () {
    $parent = makeParentWithFamily();
    $other = makeParentWithFamily();
    $otherChild = Child::factory()->create(['family_id' => $other->family->id]);

    $this->actingAs($parent)
        ->postJson("/api/children/{$otherChild->id}/select")
        ->assertForbidden();
});
