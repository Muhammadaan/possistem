import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BranchSwitcher from '@/components/branch-switcher';
import RupiahInput from '@/components/rupiah-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatIDR, formatQty } from '@/lib/utils';

type Tier = { min_qty: number; purchase_price: number };
type Product = { id: number; sku: string; name: string; unit: string; selling_price: string; average_cost: string; stock: string; is_active: boolean; price_tiers: Tier[] };
type Branch = { id: number; code: string; name: string };

export default function ProductsIndex({ branch, branches, isOwner, products, q }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; products: { data: Product[] }; q?: string }) {
    const [search, setSearch] = useState(q ?? '');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState<Product | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const form = useForm({ branch_id: branch.id, sku: '', name: '', unit: 'pcs', selling_price: '', is_active: true as boolean, tiers: [{ min_qty: 1, purchase_price: 0 }] as Tier[] });

    const openCreate = () => {
        setEditing(null);
        form.setData({ branch_id: branch.id, sku: '', name: '', unit: 'pcs', selling_price: '', is_active: true, tiers: [{ min_qty: 1, purchase_price: 0 }] });
        setOpen(true);
    };
    const openEdit = (p: Product) => {
        setEditing(p);
        form.setData({ branch_id: branch.id, sku: p.sku, name: p.name, unit: p.unit, selling_price: String(p.selling_price), is_active: p.is_active, tiers: p.price_tiers.length ? p.price_tiers.map((t) => ({ min_qty: Number(t.min_qty), purchase_price: Number(t.purchase_price) })) : [{ min_qty: 1, purchase_price: 0 }] });
        setOpen(true);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) router.put(`/products/${editing.id}`, form.data as never, { onSuccess: () => setOpen(false), preserveScroll: true });
        else form.post('/products', { onSuccess: () => setOpen(false), preserveScroll: true });
    };
    const confirmDelete = () => {
        if (!deleting) return;
        setDeleteError(null);
        router.delete(`/products/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => { setDeleting(null); setDeleteError(null); },
            onError: (errors) => setDeleteError((errors as Record<string, string>).delete ?? 'Gagal menghapus.'),
        });
    };

    return (
        <>
            <Head title="Produk" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Produk — {branch.code} / {branch.name}</h1>
                    <div className="flex gap-2"><BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} /><Button onClick={openCreate}>+ Tambah Produk</Button></div>
                </div>
                <form method="get" className="flex gap-2">
                    <Input placeholder="Cari SKU/nama..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    <input type="hidden" name="branch_id" value={branch.id} />
                    <Button type="submit" variant="outline">Cari</Button>
                </form>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">SKU</th><th className="p-2 text-left">Nama</th><th className="p-2 text-right">Jual</th><th className="p-2 text-right">HPP</th><th className="p-2 text-right">Stok</th><th className="p-2 text-left">Tier</th><th className="p-2">Aksi</th></tr></thead>
                        <tbody>
                            {products.data.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2 font-mono">{p.sku}</td><td className="p-2">{p.name}</td>
                                    <td className="p-2 text-right">{formatIDR(p.selling_price)}</td><td className="p-2 text-right">{formatIDR(p.average_cost)}</td>
                                    <td className={`p-2 text-right ${Number(p.stock) < 0 ? 'font-bold text-red-600' : ''}`}>{formatQty(p.stock)}</td>
                                    <td className="p-2 text-xs">{p.price_tiers.map((t) => `${formatQty(t.min_qty)}→${formatIDR(t.purchase_price)}`).join(', ')}</td>
                                    <td className="p-2 text-center"><div className="flex justify-center gap-1"><Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button><Button size="sm" variant="outline" onClick={() => setDeleting(p)}>Hapus</Button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>{editing ? `Edit ${editing.sku}` : 'Tambah Produk'}</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-1"><Label>SKU</Label><Input value={form.data.sku} onChange={(e) => form.setData('sku', e.target.value)} required /></div>
                            <div className="grid gap-1"><Label>Satuan</Label><Input value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} /></div>
                        </div>
                        <div className="grid gap-1"><Label>Nama</Label><Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required /></div>
                        <div className="grid gap-1"><Label>Harga jual</Label><RupiahInput value={Number(form.data.selling_price) || 0} onValueChange={(n) => form.setData('selling_price', String(n))} /></div>
                        <div className="grid gap-1">
                            <Label>Tier harga beli (min qty → harga)</Label>
                            {form.data.tiers.map((t, i) => (
                                <div key={i} className="flex gap-1">
                                    <Input type="number" value={t.min_qty} onChange={(e) => { const tiers = [...form.data.tiers]; tiers[i].min_qty = Number(e.target.value); form.setData('tiers', tiers); }} className="w-28" />
                                    <RupiahInput value={t.purchase_price} onValueChange={(n) => { const tiers = [...form.data.tiers]; tiers[i].purchase_price = n; form.setData('tiers', tiers); }} />
                                    <Button type="button" variant="outline" onClick={() => form.setData('tiers', form.data.tiers.filter((_, j) => j !== i))}>x</Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => form.setData('tiers', [...form.data.tiers, { min_qty: 1, purchase_price: 0 }])}>+ Tier</Button>
                        </div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} /> Aktif</label>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={form.processing}>Simpan</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) { setDeleting(null); setDeleteError(null); } }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Hapus {deleting?.sku}?</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Produk yang sudah ada transaksi tidak bisa dihapus.</p>
                    {deleteError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{deleteError}</p>}
                    <DialogFooter><Button variant="outline" onClick={() => { setDeleting(null); setDeleteError(null); }}>Batal</Button><Button variant="destructive" onClick={confirmDelete}>Hapus</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
