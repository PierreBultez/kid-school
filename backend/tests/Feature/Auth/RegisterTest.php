<?php

use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('registers a parent and creates a family', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Pierre',
        'email' => 'pierre@example.test',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'family_name' => 'Famille Bultez',
        'consent' => true,
    ]);

    $response->assertSuccessful();

    $user = User::where('email', 'pierre@example.test')->firstOrFail();
    expect($user->role)->toBe('parent');
    expect(Family::where('owner_user_id', $user->id)->where('name', 'Famille Bultez')->exists())->toBeTrue();
});

it('rejects registration without consent', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Pierre',
        'email' => 'pierre@example.test',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'family_name' => 'Famille Bultez',
    ]);

    $response->assertStatus(422);
    expect(User::count())->toBe(0);
});

it('rejects registration without family name', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Pierre',
        'email' => 'pierre@example.test',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'consent' => true,
    ]);

    $response->assertStatus(422);
});
