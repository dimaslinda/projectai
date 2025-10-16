<?php

namespace App\Http\Controllers;

use App\Models\Changelog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ChangelogController extends Controller
{
    // Middleware will be applied at route level instead of controller level

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $changelogs = Changelog::with('creator')
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Changelog/Index', [
            'changelogs' => $changelogs,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Changelog/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'version' => 'required|string|max:20|unique:changelogs,version',
            'release_date' => 'required|date',
            'type' => 'required|in:major,minor,patch,hotfix',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'changes' => 'nullable|array',
            'changes.*' => 'string',
            'technical_notes' => 'nullable|array',
            'technical_notes.*' => 'string',
            'is_published' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();

        Changelog::create($validated);

        return redirect()->route('admin.changelog.index')
            ->with('success', 'Changelog entry created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Changelog $changelog): Response
    {
        $changelog->load('creator');

        return Inertia::render('Admin/Changelog/Show', [
            'changelog' => $changelog,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Changelog $changelog): Response
    {
        return Inertia::render('Admin/Changelog/Edit', [
            'changelog' => $changelog,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Changelog $changelog): RedirectResponse
    {
        $validated = $request->validate([
            'version' => 'required|string|max:20|unique:changelogs,version,' . $changelog->id,
            'release_date' => 'required|date',
            'type' => 'required|in:major,minor,patch,hotfix',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'changes' => 'nullable|array',
            'changes.*' => 'string',
            'technical_notes' => 'nullable|array',
            'technical_notes.*' => 'string',
            'is_published' => 'boolean',
        ]);

        $changelog->update($validated);

        return redirect()->route('admin.changelog.index')
            ->with('success', 'Changelog entry updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Changelog $changelog): RedirectResponse
    {
        $changelog->delete();

        return redirect()->route('admin.changelog.index')
            ->with('success', 'Changelog entry deleted successfully.');
    }

    /**
     * Toggle the published status of a changelog entry.
     */
    public function togglePublished(Changelog $changelog): RedirectResponse
    {
        $changelog->update([
            'is_published' => !$changelog->is_published,
        ]);

        $status = $changelog->is_published ? 'published' : 'unpublished';

        return redirect()->back()
            ->with('success', "Changelog entry {$status} successfully.");
    }
}
