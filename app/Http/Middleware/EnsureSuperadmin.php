<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperadmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'superadmin') {
            return redirect()
                ->route('admin.dashboard')
                ->with('error', 'Доступ к разделу интеграций есть только у superadmin.');
        }

        return $next($request);
    }
}