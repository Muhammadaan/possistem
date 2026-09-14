import { Head } from '@inertiajs/react';
import BranchSwitcher from '@/components/branch-switcher';
import { Card } from '@/components/ui/card';
import { formatQty } from '@/lib/utils';

type Branch = { id: number; code: string; name: string };

export default function Ledger({ branch, branches, isOwner, movements }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; movements: { data: { id: number; type: string; qty: string; stock_before: string; stock_after: string; created_at: string; product: { sku: string; name: string }; reference_type?: string }[] } }) {
    return (
        <>
            <Head title="Ledger Stok" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Ledger Stok — {branch.code}</h1>
                    <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Waktu</th><th className="p-2 text-left">Barang</th><th className="p-2">Tipe</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Before→After</th></tr></thead>
                        <tbody>{movements.data.map((m) => (<tr key={m.id} className="border-t"><td className="p-2">{m.created_at}</td><td className="p-2">{m.product.sku} - {m.product.name}</td><td className="p-2 text-center">{m.type}</td><td className="p-2 text-right">{formatQty(m.qty)}</td><td className={`p-2 text-right ${Number(m.stock_after) < 0 ? 'font-bold text-red-600' : ''}`}>{formatQty(m.stock_before)}→{formatQty(m.stock_after)}</td></tr>))}</tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
