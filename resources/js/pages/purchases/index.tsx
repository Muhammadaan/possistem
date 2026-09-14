import { Head, Link } from '@inertiajs/react';
import BranchSwitcher from '@/components/branch-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Branch = { id: number; code: string; name: string };
type Purchase = { id: number; invoice_no: string; purchase_date: string; total: string; supplier?: { name: string } };

export default function PurchasesIndex({ branch, branches, isOwner, purchases }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; purchases: { data: Purchase[] } }) {
    return (
        <>
            <Head title="Pembelian" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Pembelian — {branch.code}</h1>
                    <div className="flex gap-2">
                        <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                        <Link href={`/purchases/create?branch_id=${branch.id}`}><Button>Buat Pembelian</Button></Link>
                    </div>
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Supplier</th><th className="p-2 text-right">Total</th></tr></thead>
                        <tbody>
                            {purchases.data.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2"><Link className="text-blue-600 underline" href={`/purchases/${p.id}`}>{p.invoice_no}</Link></td>
                                    <td className="p-2">{p.purchase_date}</td><td className="p-2">{p.supplier?.name}</td><td className="p-2 text-right">{p.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
