import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { formatIDR, formatQty } from '@/lib/utils';

export default function PurchaseShow({ purchase }: { purchase: { invoice_no: string; purchase_date: string; total: string; supplier?: { name: string }; branch: { code: string }; items: { id: number; qty: string; price: string; subtotal: string; product: { sku: string; name: string } }[] } }) {
    return (
        <>
            <Head title={purchase.invoice_no} />
            <div className="space-y-4 p-4">
                <h1 className="text-xl font-semibold">{purchase.invoice_no} — {purchase.branch.code}</h1>
                <Card className="p-4 text-sm">Supplier: {purchase.supplier?.name} | Tanggal: {purchase.purchase_date} | Total: {formatIDR(purchase.total)}</Card>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Barang</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Harga</th><th className="p-2 text-right">Subtotal</th></tr></thead>
                        <tbody>{purchase.items.map((i) => (<tr key={i.id} className="border-t"><td className="p-2">{i.product.sku} - {i.product.name}</td><td className="p-2 text-right">{formatQty(i.qty)}</td><td className="p-2 text-right">{formatIDR(i.price)}</td><td className="p-2 text-right">{formatIDR(i.subtotal)}</td></tr>))}</tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
