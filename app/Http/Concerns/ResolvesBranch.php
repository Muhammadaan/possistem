<?php

namespace App\Http\Concerns;

use App\Models\Branch;
use Illuminate\Http\Request;

trait ResolvesBranch
{
    protected function resolveBranch(Request $request): Branch
    {
        $user = $request->user();

        if (! $user->isOwner()) {
            abort_unless($user->branch_id, 403, 'Kasir belum ditempatkan ke cabang.');

            return Branch::findOrFail($user->branch_id);
        }

        $branchId = $request->input('branch_id', $request->query('branch_id'));

        if ($branchId) {
            return Branch::findOrFail($branchId);
        }

        // Owner tanpa branch_id: fallback ke cabang aktif pertama agar tidak 422.
        $fallback = Branch::where('is_active', true)->orderBy('code')->first()
            ?? Branch::orderBy('code')->first();

        abort_unless($fallback, 404, 'Belum ada cabang. Buat cabang dulu di menu Cabang.');

        return $fallback;
    }

    protected function branchOptions(): array
    {
        $user = request()->user();

        if ($user && ! $user->isOwner()) {
            return Branch::where('id', $user->branch_id)->get(['id', 'code', 'name'])->toArray();
        }

        return Branch::orderBy('code')->get(['id', 'code', 'name', 'is_active'])->toArray();
    }
}
