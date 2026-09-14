import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BranchSwitcher from '@/components/branch-switcher';
import QtyInput from '@/components/qty-input';
import RupiahInput from '@/components/rupiah-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatIDR, formatQty } from '@/lib/utils';

type Branch = { id: number; code: string; name: string };
type Product = { id: number; sku: string; name: string; selling_price: string; stock: string };

export default function Pos({ branch, branches, isOwner, products }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; products: Product[] }) {
    const [cart, setCart] = useState<{ product_id: number; qty: number; price: number }[]>([]);
    const [q, setQ] = useState('');
    const form = useForm({ branch_id: branch.id, payment_method: 'CASH', paid_amount: 0, items: cart });

    const add = (p: Product) => {
        const ex = cart.find((c) => c.product_id === p.id);
        if (ex) setCart(cart.map((c) => (c.product_id === p.id ? { ...c, qty: c.qty + 1 } : c)));
        else setCart([...cart, { product_id: p.id, qty: 1, price: Number(p.selling_price) }]);
    };

    const total = cart.reduce((s, c) => s + c.qty * c.price, 0);

    const submit = () => {
        form.setData('items', cart);
        form.setData('paid_amount', form.data.paid_amount || total);
        form.post('/sales');
    };

    const filtered = products.filter((p) => p.sku.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase()));

    return (
        <>
            <Head title="Kasir" />
            <div className="grid gap-4 p-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Kasir — {branch.code}</h1>
                        <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                    </div>
                    <Input placeholder="Cari SKU/nama..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />
                    <div className="grid gap-2">
                        {filtered.slice(0, 30).map((p) => (
                            <Card key={p.id} className="flex items-center justify-between p-2">
                                <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku} | stok {formatQty(p.stock)} | {formatIDR(p.selling_price)}</div></div>
                                <Button size="sm" onClick={() => add(p)}>+</Button>
                            </Card>
                        ))}
                    </div>
                </div>
                <div>
                    <Card className="space-y-2 p-4">
                        <h2 className="font-semibold">Keranjang ({cart.length})</h2>
                        {cart.map((c, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="flex-1 text-sm">{products.find((p) => p.id === c.product_id)?.name}</span>
                                <QtyInput value={c.qty} onValueChange={(n) => setCart(cart.map((x, j) => (j === i ? { ...x, qty: n } : x)))} className="w-20" />
                                <RupiahInput value={c.price} onValueChange={(n) => setCart(cart.map((x, j) => (j === i ? { ...x, price: n } : x)))} className="w-36" />
                                <Button size="sm" variant="outline" onClick={() => setCart(cart.filter((_, j) => j !== i))}>x</Button>
                            </div>
                        ))}
                        <div className="text-right font-bold">Total: {formatIDR(total)}</div>
                        <div className="flex gap-2">
                            <select value={form.data.payment_method} onChange={(e) => form.setData('payment_method', e.target.value)} className="rounded border p-2">
                                <option>CASH</option><option>QRIS</option><option>DEBIT</option><option>TRANSFER</option>
                            </select>
                            <RupiahInput value={form.data.paid_amount} onValueChange={(n) => form.setData('paid_amount', n)} placeholder="Dibayar" />
                        </div>
                        <div className="text-sm">Kembali: {formatIDR(Math.max(0, (form.data.paid_amount || 0) - total))}</div>
                        <Button onClick={submit} disabled={form.processing || cart.length === 0}>Bayar</Button>
                    </Card>
                </div>
            </div>
        </>
    );
}
