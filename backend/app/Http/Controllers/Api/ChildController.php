<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChildRequest;
use App\Http\Requests\UpdateChildRequest;
use App\Models\Child;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

class ChildController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Child::class);

        $family = $request->user()->family;

        $children = $family
            ? $family->children()->orderBy('display_name')->get()
            : collect();

        return JsonResource::collection($children);
    }

    public function store(StoreChildRequest $request): JsonResource
    {
        Gate::authorize('create', Child::class);

        $child = $request->user()->family->children()->create($request->validated());

        return JsonResource::make($child);
    }

    public function show(Child $child): JsonResource
    {
        Gate::authorize('view', $child);

        return JsonResource::make($child);
    }

    public function update(UpdateChildRequest $request, Child $child): JsonResource
    {
        Gate::authorize('update', $child);

        $child->update($request->validated());

        return JsonResource::make($child);
    }

    public function destroy(Child $child): JsonResponse
    {
        Gate::authorize('delete', $child);

        $child->delete();

        return response()->json(status: 204);
    }
}
