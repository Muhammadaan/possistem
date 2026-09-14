import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BranchSwitcher from '@/components/branch-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Branch = { id: number; code: string; name: string };
type Product = { id: number; sku: string; name: string; price_tiers: { min_qty: string; purchase_price: string }[] };

export default function PurchaseCreate({ branch, branches, isOwner, suppliers, products }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; suppliers: { id: number; name: string }[]; products: Product[] }) {
    const [rows, setRows] = useState([{ product_id: 0, qty: 1, price: 0 }]);
    const form = useForm({ branch_id: branch.id, supplier_id: '', purchase_date: new Date().toISOString().slice(0, 16), items: rows });

    const tierPrice = (pid: number, qty: number) => {
        const p = products.find((x) => x.id === pid);
        if (!p) return 0;
        let best = 0;
        for (const t of p.price_tiers) {
            if (Number(t.min_qty) <= qty) best = Number(t.purchase_price);
        }
        return best;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.setData('items', rows);
        form.post('/purchases');
    };

    const total = rows.reduce((s, r) => s + r.qty * r.price, 0);

    return (
        <>
            <Head title="Buat Pembelian" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Pembelian — {branch.code}</h1>
                    <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                </div>
                <Card className="space-y-3 p-4">
                    <div className="flex flex-wrap gap-2">
                        <select value={form.data.supplier_id} onChange={(e) => form.setData('supplier_id', e.target.value)} className="rounded border p-2">
                            <option value="">Pilih supplier</option>
                            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                        <Input type="datetime-local" value={form.data.purchase_date} onChange={(e) => form.setData('purchase_date', e.target.value)} className="w-56" />
                    </div>
                    {rows.map((r, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                            <select value={r.product_id} onChange={(e) => { const v = [...rows]; v[i].product_id = Number(e.target.value); v[i].price = tierPrice(v[i].product_id, v[i].qty); setRows(v); }} className="rounded border p-2 w-64">
                                <option value={0}>Pilih barang</option>
                                {products.map((p) => (<option key={p.id} value={p.id}>{p.sku} - {p.name}</option>))}
                            </select>
                            <Input type="number" step="0.001" value={r.qty} onChange={(e) => { const v = [...rows]; v[i].qty = Number(e.target.value); v[i].price = tierPrice(v[i].product_id, v[i].qty) || v[i].price; setRows(v); }} className="w-28" />
                            <Input type="number" step="0.01" value={r.price} onChange={(e) => { const v = [...rows]; v[i].price = Number(e.target.value); setRows(v); }} className="w-36" />
                            <span className="p-2 text-sm">{(r.qty * r.price).toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setRows([...rows, { product_id: 0, qty: 1, price: 0 }])}>+ Baris</Button>
                        <Button onClick={submit} disabled={form.processing}>Simpan (Total {total.toLocaleString()})</Button>
                    </div>
                </Card>
            </div>
        </>
    );
}
