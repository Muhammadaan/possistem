import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Branch = { id: number; code: string; name: string; address?: string; phone?: string; is_active: boolean };

export default function BranchesIndex({ branches }: { branches: { data: Branch[] } }) {
    const form = useForm({ code: '', name: '', address: '', phone: '', is_active: true as boolean });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/branches', { onSuccess: () => form.reset(), preserveScroll: true });
    };

    return (
        <>
            <Head title="Cabang" />
            <div className="space-y-4 p-4">
                <h1 className="text-xl font-semibold">Cabang</h1>
                <Card className="p-4">
                    <form onSubmit={submit} className="flex flex-wrap gap-2">
                        <Input placeholder="Kode (JKT-01)" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} className="w-36" required />
                        <Input placeholder="Nama cabang" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-56" required />
                        <Input placeholder="Alamat" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} className="w-56" />
                        <Input placeholder="Telepon" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className="w-40" />
                        <Button disabled={form.processing}>Tambah</Button>
                    </form>
                </Card>
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">Kode</th><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Alamat</th><th className="p-2">Aktif</th></tr></thead>
                        <tbody>
                            {branches.data.map((b) => (
                                <tr key={b.id} className="border-t"><td className="p-2 font-mono">{b.code}</td><td className="p-2">{b.name}</td><td className="p-2">{b.address}</td><td className="p-2 text-center">{b.is_active ? 'Ya' : 'Tidak'}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
