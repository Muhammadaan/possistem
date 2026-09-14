import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BranchSwitcher from '@/components/branch-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Tier = { min_qty: number; purchase_price: number };
type Product = { id: number; sku: string; name: string; unit: string; selling_price: string; average_cost: string; stock: string; is_active: boolean; price_tiers: Tier[] };
type Branch = { id: number; code: string; name: string };

export default function ProductsIndex({ branch, branches, isOwner, products, q }: { branch: Branch; branches?: Branch[]; isOwner?: boolean; products: { data: Product[] }; q?: string }) {
    const [search, setSearch] = useState(q ?? '');
    const form = useForm({ branch_id: branch.id, sku: '', name: '', unit: 'pcs', selling_price: '', is_active: true as boolean, tiers: [{ min_qty: 1, purchase_price: 0 }] as Tier[] });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/products', { onSuccess: () => form.reset('sku', 'name', 'selling_price'), preserveScroll: true });
    };

    return (
        <>
            <Head title="Produk" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Produk — {branch.code} / {branch.name}</h1>
                    <BranchSwitcher branch={branch} branches={branches} isOwner={isOwner} />
                </div>
                <Card className="p-4">
                    <form onSubmit={submit} className="grid gap-2 md:grid-cols-6">
                        <Input placeholder="SKU" value={form.data.sku} onChange={(e) => form.setData('sku', e.target.value)} required />
                        <Input placeholder="Nama" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required className="md:col-span-2" />
                        <Input placeholder="Satuan" value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} />
                        <Input placeholder="Harga jual" type="number" value={form.data.selling_price} onChange={(e) => form.setData('selling_price', e.target.value)} required />
                        <div className="flex gap-2 md:col-span-6">
                            {form.data.tiers.map((t, i) => (
                                <div key={i} className="flex gap-1">
                                    <Input type="number" placeholder="Min qty" value={t.min_qty} onChange={(e) => { const tiers = [...form.data.tiers]; tiers[i].min_qty = Number(e.target.value); form.setData('tiers', tiers); }} className="w-24" />
                                    <Input type="number" placeholder="Harga beli" value={t.purchase_price} onChange={(e) => { const tiers = [...form.data.tiers]; tiers[i].purchase_price = Number(e.target.value); form.setData('tiers', tiers); }} className="w-32" />
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => form.setData('tiers', [...form.data.tiers, { min_qty: 1, purchase_price: 0 }])}>+ Tier</Button>
                            <Button disabled={form.processing}>Simpan</Button>
                        </div>
                    </form>
                </Card>
                <form method="get" className="flex gap-2">
                    <Input placeholder="Cari SKU/nama..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    <input type="hidden" name="branch_id" value={branch.id} />
                    <Button type="submit" variant="outline">Cari</Button>
                </form>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">SKU</th><th className="p-2 text-left">Nama</th><th className="p-2 text-right">Jual</th><th className="p-2 text-right">HPP</th><th className="p-2 text-right">Stok</th><th className="p-2 text-left">Tier</th></tr></thead>
                        <tbody>
                            {products.data.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2 font-mono">{p.sku}</td><td className="p-2">{p.name}</td>
                                    <td className="p-2 text-right">{p.selling_price}</td><td className="p-2 text-right">{p.average_cost}</td>
                                    <td className={`p-2 text-right ${Number(p.stock) < 0 ? 'text-red-600 font-bold' : ''}`}>{p.stock}</td>
                                    <td className="p-2 text-xs">{p.price_tiers.map((t) => `${t.min_qty}→${t.purchase_price}`).join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
