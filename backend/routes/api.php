<?php

use App\Http\Controllers\Api\ChildController;
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
});
