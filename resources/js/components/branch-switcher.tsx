import { router } from '@inertiajs/react';

type Branch = { id: number; code: string; name: string };

export default function BranchSwitcher({
    branch,
    branches,
    isOwner,
}: {
    branch: Branch;
    branches?: Branch[];
    isOwner?: boolean;
}) {
    if (!isOwner || !branches || branches.length <= 1) {
        return (
            <span className="bg-muted rounded px-2 py-1 text-xs font-medium">
                {branch.code} - {branch.name}
            </span>
        );
    }

    const onChange = (id: string) => {
        if (!id || Number(id) === branch.id) return;
        const url = new URL(window.location.href);
        url.searchParams.set('branch_id', id);
        router.visit(url.toString());
    };

    return (
        <select
            value={branch.id}
            onChange={(e) => onChange(e.target.value)}
            className="rounded border p-1.5 text-sm"
        >
            {branches.map((b) => (
                <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                </option>
            ))}
        </select>
    );
}
