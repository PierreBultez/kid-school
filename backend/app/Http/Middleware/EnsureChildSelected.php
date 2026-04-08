<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureChildSelected
{
    /**
     * Handle an incoming request.
     *
     * Ensures the authenticated user has an active child profile selected,
     * exposes it on the request as `activeChild`.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->active_child_id) {
            abort(409, 'No active child profile selected.');
        }

        $child = $user->activeChild;

        if (! $child || $user->cannot('view', $child)) {
            $user->forceFill(['active_child_id' => null])->save();
            abort(409, 'Active child profile is no longer available.');
        }

        $request->attributes->set('activeChild', $child);

        return $next($request);
    }
}
