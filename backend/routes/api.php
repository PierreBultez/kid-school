<?php

use App\Http\Controllers\Api\ChildController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\GameSessionController;
use App\Models\Child;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', function (Request $request) {
        return $request->user()->load('family', 'activeChild');
    });

    Route::apiResource('children', ChildController::class);

    Route::post('/children/{child}/select', function (Request $request, Child $child) {
        Gate::authorize('view', $child);
        $request->user()->forceFill(['active_child_id' => $child->id])->save();

        return response()->json(['active_child_id' => $child->id]);
    });

    // Routes nécessitant un profil enfant actif
    Route::middleware('child.selected')->group(function () {
        Route::get('/games', [GameController::class, 'index']);
        Route::get('/games/{slug}', [GameController::class, 'show']);

        Route::post('/game-sessions', [GameSessionController::class, 'store']);
        Route::get('/game-sessions/{gameSession}', [GameSessionController::class, 'show']);
        Route::post('/game-sessions/{gameSession}/answer', [GameSessionController::class, 'answer']);
        Route::post('/game-sessions/{gameSession}/finish', [GameSessionController::class, 'finish']);
    });
});
