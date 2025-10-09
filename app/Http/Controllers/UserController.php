<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index()
    {
        // Check if user can manage users
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        $users = User::select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('UserManagement/Index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('UserManagement/Create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in(['engineer', 'drafter', 'esr', 'superadmin', 'user'])],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('UserManagement/Edit', [
            'user' => $user->only('id', 'name', 'email', 'role')
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['engineer', 'drafter', 'esr', 'superadmin', 'user'])],
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('users.index')->with('error', 'You cannot delete yourself.');
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * Refresh migrations (superadmin only).
     */
    public function migrateRefresh(Request $request)
    {
        if (!auth()->user()->canManageUsers()) {
            abort(403, 'Unauthorized');
        }

        try {
            // Run migrate:refresh command
            \Artisan::call('migrate:refresh', ['--seed' => true]);
            
            return redirect()->back()->with('success', 'Database refreshed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to refresh database: ' . $e->getMessage());
        }
    }
}