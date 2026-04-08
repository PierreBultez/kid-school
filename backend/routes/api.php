<?php

use App\Http\Controllers\Api\ChildController;
use App\Models\Child;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', function (Request $request) {
        return $request->user()->load('family');
    });

    Route::apiResource('children', ChildController::class);

    Route::middleware('web')->post('/children/{child}/select', function (Request $request, Child $child) {
        if ($request->user()->cannot('view', $child)) {
            abort(403);
        }

        $request->session()->put('active_child_id', $child->id);

        return response()->json(['active_child_id' => $child->id]);
    });
});
