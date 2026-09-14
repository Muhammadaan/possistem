import { Head, Link } from '@inertiajs/react';
import BranchSwitcher from '@/components/branch-switcher';
import { Card } from '@/components/ui/card';

type Branch = { id: number; code: string; name: string };

export default function SalesIndex({ branch, branches, isOwner, sales }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; sales: { data: { id: number; invoice_no: string; sale_date: string; total: string; payment_method: string }[] } }) {
    return (
        <>
            <Head title="Penjualan" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Penjualan — {branch.code}</h1>
                    <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Tanggal</th><th className="p-2">Bayar</th><th className="p-2 text-right">Total</th></tr></thead>
                        <tbody>{sales.data.map((s) => (<tr key={s.id} className="border-t"><td className="p-2"><Link href={`/sales/${s.id}`} className="text-blue-600 underline">{s.invoice_no}</Link></td><td className="p-2">{s.sale_date}</td><td className="p-2 text-center">{s.payment_method}</td><td className="p-2 text-right">{s.total}</td></tr>))}</tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
