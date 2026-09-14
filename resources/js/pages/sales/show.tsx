import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatIDR, formatQty } from '@/lib/utils';

export default function SaleShow({ sale }: { sale: { invoice_no: string; sale_date: string; total: string; paid_amount: string; change_amount: string; payment_method: string; branch: { code: string }; items: { id: number; qty: string; price: string; cost: string; subtotal: string; profit: string; product: { sku: string; name: string } }[] } }) {
    return (
        <>
            <Head title={sale.invoice_no} />
            <div className="space-y-4 p-4">
                <h1 className="text-xl font-semibold">Struk {sale.invoice_no} — {sale.branch.code}</h1>
                <Card className="p-4 text-sm">Tanggal: {sale.sale_date} | {sale.payment_method} | Dibayar {formatIDR(sale.paid_amount)} | Kembali {formatIDR(sale.change_amount)} | Total {formatIDR(sale.total)}</Card>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Barang</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Harga</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-right">Profit</th></tr></thead>
                        <tbody>{sale.items.map((i) => (<tr key={i.id} className="border-t"><td className="p-2">{i.product.sku} - {i.product.name}</td><td className="p-2 text-right">{formatQty(i.qty)}</td><td className="p-2 text-right">{formatIDR(i.price)}</td><td className="p-2 text-right">{formatIDR(i.subtotal)}</td><td className="p-2 text-right">{formatIDR(i.profit)}</td></tr>))}</tbody>
                    </table>
                </Card>
                <Button onClick={() => window.print()}>Cetak</Button>
            </div>
        </>
    );
}
