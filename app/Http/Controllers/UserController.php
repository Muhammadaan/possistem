<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Models\Branch;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()->isOwner(), 403);

        return Inertia::render('users/index', [
            'users' => User::with('branch')->orderBy('name')->paginate(20),
            'branches' => Branch::where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'branch_id' => $data['role'] === User::ROLE_OWNER ? ($data['branch_id'] ?? null) : $data['branch_id'],
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'User dibuat.');
    }

    public function update(StoreUserRequest $request, User $user)
    {
        $data = $request->validated();

        if ($user->id === $request->user()->id && $data['role'] !== $user->role) {
            abort(422, 'Tidak bisa mengubah role sendiri.');
        }

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'branch_id' => $data['role'] === User::ROLE_OWNER ? ($data['branch_id'] ?? null) : $data['branch_id'],
        ]);

        if (! empty($data['password'])) {
            $user->update(['password' => $data['password']]);
        }

        return redirect()->back()->with('success', 'User diupdate.');
    }

    public function destroy(User $user)
    {
        abort_unless(request()->user()->isOwner(), 403);
        abort_if($user->id === request()->user()->id, 422, 'Tidak bisa hapus akun sendiri.');

        $user->delete();

        return redirect()->back()->with('success', 'User dihapus.');
    }
}
