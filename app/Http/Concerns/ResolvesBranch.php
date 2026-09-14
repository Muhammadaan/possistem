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
            abort_unless($user->branch_id !== null, 403, 'Kasir belum ditempatkan ke cabang.');

            return Branch::findOrFail($user->branch_id);
        }

        $branchId = $request->input('branch_id', $request->query('branch_id'));

        if (is_numeric($branchId)) {
            return Branch::findOrFail((int) $branchId);
        }

        // Owner tanpa branch_id: fallback ke cabang aktif pertama agar tidak 422.
        $fallback = Branch::where('is_active', true)->orderBy('code')->first()
            ?? Branch::orderBy('code')->first();

        abort_unless($fallback !== null, 404, 'Belum ada cabang. Buat cabang dulu di menu Cabang.');

        return $fallback;
    }

    /** @return array<int, array{id: int, code: string, name: string}> */
    protected function branchOptions(): array
    {
        $user = request()->user();

        $query = $user !== null && ! $user->isOwner()
            ? Branch::where('id', $user->branch_id)
            : Branch::orderBy('code');

        return $query->get(['id', 'code', 'name'])
            ->map(fn (Branch $branch): array => [
                'id' => $branch->id,
                'code' => $branch->code,
                'name' => $branch->name,
            ])
            ->all();
    }
}
