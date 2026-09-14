import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BranchSwitcher from '@/components/branch-switcher';
import ProductPicker from '@/components/product-picker';
import QtyInput from '@/components/qty-input';
import RupiahInput from '@/components/rupiah-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatIDR, formatQty } from '@/lib/utils';

type Branch = { id: number; code: string; name: string };
type Supplier = { id: number; name: string };
type Product = { id: number; sku: string; name: string; price_tiers: { min_qty: string; purchase_price: string }[] };
type Purchase = { id: number; invoice_no: string; purchase_date: string; total: string; supplier?: { name: string }; items: { id: number; qty: string; price: string; subtotal: string; product: { sku: string; name: string } }[] };

export default function PurchasesIndex({ branch, branches, isOwner, purchases, suppliers, products }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; purchases: { data: Purchase[] }; suppliers: Supplier[]; products: Product[] }) {
    const [detail, setDetail] = useState<Purchase | null>(null);
    const [openCreate, setOpenCreate] = useState(false);
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

    const openCreateModal = () => {
        setRows([{ product_id: 0, qty: 1, price: 0 }]);
        form.reset();
        form.setData({ branch_id: branch.id, supplier_id: '', purchase_date: new Date().toISOString().slice(0, 16), items: [] });
        setOpenCreate(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({ ...data, branch_id: branch.id, items: rows }));
        form.post('/purchases', { onSuccess: () => setOpenCreate(false) });
    };

    const total = rows.reduce((s, r) => s + r.qty * r.price, 0);

    return (
        <>
            <Head title="Pembelian" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Pembelian — {branch.code}</h1>
                    <div className="flex gap-2">
                        <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                        <Button onClick={openCreateModal}>+ Buat Pembelian</Button>
                    </div>
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Supplier</th><th className="p-2 text-right">Total</th><th className="p-2">Aksi</th></tr></thead>
                        <tbody>
                            {purchases.data.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2 font-mono">{p.invoice_no}</td>
                                    <td className="p-2">{p.purchase_date}</td><td className="p-2">{p.supplier?.name}</td><td className="p-2 text-right">{formatIDR(p.total)}</td>
                                    <td className="p-2 text-center"><div className="flex justify-center gap-1"><Button size="sm" variant="outline" onClick={() => setDetail(p)}>Detail</Button><Link href={`/purchases/${p.id}`}><Button size="sm" variant="outline">Halaman</Button></Link></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <p className="text-xs text-muted-foreground">Pembelian tidak bisa dihapus karena mempengaruhi stok & HPP. Koreksi via adjustment stok.</p>
            </div>

            <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>{detail?.invoice_no}</DialogTitle></DialogHeader>
                    <div className="text-sm text-muted-foreground">Supplier: {detail?.supplier?.name} | Total: {detail?.total ? formatIDR(detail.total) : ''}</div>
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">Barang</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Harga</th><th className="p-2 text-right">Subtotal</th></tr></thead>
                        <tbody>{detail?.items.map((i) => (<tr key={i.id} className="border-t"><td className="p-2">{i.product.sku} - {i.product.name}</td><td className="p-2 text-right">{formatQty(i.qty)}</td><td className="p-2 text-right">{formatIDR(i.price)}</td><td className="p-2 text-right">{formatIDR(i.subtotal)}</td></tr>))}</tbody>
                    </table>
                </DialogContent>
            </Dialog>

            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader><DialogTitle>Buat Pembelian — {branch.code}</DialogTitle></DialogHeader>
                    <form onSubmit={submitCreate} className="grid gap-3">
                        <div className="flex flex-wrap gap-2">
                            <div className="grid flex-1 gap-1"><Label>Supplier</Label>
                                <select value={form.data.supplier_id} onChange={(e) => form.setData('supplier_id', e.target.value)} className="rounded border p-2">
                                    <option value="">Pilih supplier</option>
                                    {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                </select>
                            </div>
                            <div className="grid gap-1"><Label>Tanggal</Label><Input type="datetime-local" value={form.data.purchase_date} onChange={(e) => form.setData('purchase_date', e.target.value)} className="w-56" /></div>
                        </div>
                        {rows.map((r, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-2">
                                <ProductPicker products={products} value={r.product_id} onSelect={(id) => { const v = [...rows]; v[i].product_id = id; v[i].price = tierPrice(id, v[i].qty); setRows(v); }} />
                                <QtyInput value={r.qty} onValueChange={(n) => { const v = [...rows]; v[i].qty = n; v[i].price = tierPrice(v[i].product_id, n) || v[i].price; setRows(v); }} className="w-24" />
                                <RupiahInput value={r.price} onValueChange={(n) => { const v = [...rows]; v[i].price = n; setRows(v); }} className="w-40" placeholder="Harga" />
                                <span className="text-sm">{formatIDR(r.qty * r.price)}</span>
                                <Button type="button" size="sm" variant="outline" onClick={() => setRows(rows.filter((_, j) => j !== i))}>x</Button>
                            </div>
                        ))}
                        <div><Button type="button" variant="outline" onClick={() => setRows([...rows, { product_id: 0, qty: 1, price: 0 }])}>+ Baris</Button></div>
                        <DialogFooter className="items-center">
                            <span className="mr-auto font-bold">Total {formatIDR(total)}</span>
                            <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Batal</Button>
                            <Button disabled={form.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
