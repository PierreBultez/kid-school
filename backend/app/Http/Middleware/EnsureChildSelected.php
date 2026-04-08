<?php

namespace App\Http\Middleware;

use App\Models\Child;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureChildSelected
{
    /**
     * Handle an incoming request.
     *
     * Resolves the active child profile from the session, ensures it belongs
     * to the authenticated user's family, and exposes it on the request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $childId = $request->session()->get('active_child_id');

        if (! $user || ! $childId) {
            abort(409, 'No active child profile selected.');
        }

        $child = Child::find($childId);

        if (! $child || $user->cannot('view', $child)) {
            $request->session()->forget('active_child_id');
            abort(409, 'Active child profile is no longer available.');
        }

        $request->attributes->set('activeChild', $child);

        return $next($request);
    }
}
