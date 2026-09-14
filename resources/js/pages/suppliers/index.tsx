import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Supplier = { id: number; name: string; phone?: string; address?: string; is_active: boolean };

export default function SuppliersIndex({ suppliers }: { suppliers: { data: Supplier[] } }) {
    const form = useForm({ name: '', phone: '', address: '' });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/suppliers', { onSuccess: () => form.reset(), preserveScroll: true });
    };
    return (
        <>
            <Head title="Supplier" />
            <div className="space-y-4 p-4">
                <h1 className="text-xl font-semibold">Supplier (global)</h1>
                <Card className="p-4">
                    <form onSubmit={submit} className="flex flex-wrap gap-2">
                        <Input placeholder="Nama supplier" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-56" required />
                        <Input placeholder="Telepon" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className="w-40" />
                        <Input placeholder="Alamat" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} className="w-56" />
                        <Button disabled={form.processing}>Tambah</Button>
                    </form>
                </Card>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Telepon</th><th className="p-2 text-left">Alamat</th></tr></thead>
                        <tbody>{suppliers.data.map((s) => (<tr key={s.id} className="border-t"><td className="p-2">{s.name}</td><td className="p-2">{s.phone}</td><td className="p-2">{s.address}</td></tr>))}</tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
