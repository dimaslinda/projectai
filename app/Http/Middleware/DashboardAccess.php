<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DashboardAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();
        $allowedRoles = ['admin', 'superadmin'];

        // If user doesn't have admin/superadmin role, redirect to chat
        if (!in_array($user->role, $allowedRoles)) {
            return redirect()->route('chat.index')->with('info', 'Redirected to Chat AI - Dashboard access is limited to administrators.');
        }

        return $next($request);
    }
}