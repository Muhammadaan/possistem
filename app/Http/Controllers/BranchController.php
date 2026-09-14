<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchRequest;
use App\Models\Branch;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()->isOwner(), 403);

        return Inertia::render('branches/index', [
            'branches' => Branch::orderBy('code')->paginate(20),
        ]);
    }

    public function store(StoreBranchRequest $request)
    {
        Branch::create($request->validated());

        return redirect()->back()->with('success', 'Cabang dibuat.');
    }

    public function update(StoreBranchRequest $request, Branch $branch)
    {
        $branch->update($request->validated());

        return redirect()->back()->with('success', 'Cabang diupdate.');
    }

    public function destroy(Branch $branch)
    {
        abort_unless(request()->user()->isOwner(), 403);

        if ($branch->products()->exists() || $branch->purchases()->exists() || $branch->sales()->exists() || $branch->users()->exists()) {
            return redirect()->back()->withErrors(['delete' => 'Cabang tidak bisa dihapus karena sudah ada data terkait.']);
        }

        $branch->delete();

        return redirect()->back()->with('success', 'Cabang dihapus.');
    }
}
