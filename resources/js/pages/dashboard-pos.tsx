import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import BranchSwitcher from '@/components/branch-switcher';

type Branch = { id: number; code: string; name: string };

export default function DashboardPos({ branch, branches, isOwner, omzetToday, profitToday, marginToday, lowStocks }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; omzetToday: number; profitToday: number; marginToday: number; lowStocks: { id: number; sku: string; name: string; stock: string }[] }) {
    return (
        <>
            <Head title="Dashboard POS" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Dashboard — {branch.code} / {branch.name}</h1>
                    <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-4"><div className="text-sm text-muted-foreground">Omzet Hari Ini</div><div className="text-2xl font-bold">{omzetToday.toLocaleString()}</div></Card>
                    <Card className="p-4"><div className="text-sm text-muted-foreground">Profit Hari Ini</div><div className="text-2xl font-bold">{profitToday.toLocaleString()}</div></Card>
                    <Card className="p-4"><div className="text-sm text-muted-foreground">Margin %</div><div className="text-2xl font-bold">{marginToday}%</div></Card>
                </div>
                <Card className="overflow-hidden p-0">
                    <div className="p-2 font-semibold">Stok Terendah</div>
                    <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">SKU</th><th className="p-2 text-left">Nama</th><th className="p-2 text-right">Stok</th></tr></thead>
                        <tbody>{lowStocks.map((p) => (<tr key={p.id} className="border-t"><td className="p-2 font-mono">{p.sku}</td><td className="p-2">{p.name}</td><td className={`p-2 text-right ${Number(p.stock) < 0 ? 'text-red-600 font-bold' : ''}`}>{p.stock}</td></tr>))}</tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
