import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Branch = { id: number; code: string; name: string };
type User = { id: number; name: string; email: string; role: string; branch_id: number | null; branch?: Branch | null };

export default function UsersIndex({ users, branches }: { users: { data: User[] }; branches: Branch[] }) {
    const [editing, setEditing] = useState<User | null>(null);
    const form = useForm({ name: '', email: '', password: '', role: 'CASHIER', branch_id: '' as string | number });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/users', { onSuccess: () => form.reset(), preserveScroll: true });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        router.put(
            `/users/${editing.id}`,
            { name: form.data.name, email: form.data.email, password: form.data.password || undefined, role: form.data.role, branch_id: form.data.branch_id || null },
            { onSuccess: () => setEditing(null), preserveScroll: true },
        );
    };

    const startEdit = (u: User) => {
        setEditing(u);
        form.setData({ name: u.name, email: u.email, password: '', role: u.role, branch_id: u.branch_id ?? '' });
    };

    return (
        <>
            <Head title="Management User" />
            <div className="space-y-4 p-4">
                <h1 className="text-xl font-semibold">Management User (Owner only)</h1>

                <Card className="p-4">
                    <form onSubmit={submitCreate} className="flex flex-wrap gap-2">
                        <Input placeholder="Nama" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-44" required />
                        <Input placeholder="Email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="w-56" required />
                        <Input placeholder="Password (min 8)" type="password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className="w-44" required />
                        <select value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} className="rounded border p-2">
                            <option value="CASHIER">KASIR</option>
                            <option value="OWNER">OWNER</option>
                        </select>
                        <select value={form.data.branch_id} onChange={(e) => form.setData('branch_id', e.target.value)} className="rounded border p-2">
                            <option value="">Pilih cabang {form.data.role === 'OWNER' ? '(opsional)' : '(wajib kasir)'}</option>
                            {branches.map((b) => (<option key={b.id} value={b.id}>{b.code} - {b.name}</option>))}
                        </select>
                        <Button disabled={form.processing}>Tambah User</Button>
                    </form>
                </Card>

                {editing && (
                    <Card className="p-4">
                        <form onSubmit={submitEdit} className="flex flex-wrap gap-2">
                            <span className="w-full text-sm font-semibold">Edit #{editing.id}</span>
                            <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-44" required />
                            <Input value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="w-56" required />
                            <Input placeholder="Password baru (kosongkan jika tidak ganti)" type="password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className="w-64" />
                            <select value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} className="rounded border p-2">
                                <option value="CASHIER">KASIR</option>
                                <option value="OWNER">OWNER</option>
                            </select>
                            <select value={form.data.branch_id} onChange={(e) => form.setData('branch_id', e.target.value)} className="rounded border p-2">
                                <option value="">Tanpa cabang (owner)</option>
                                {branches.map((b) => (<option key={b.id} value={b.id}>{b.code} - {b.name}</option>))}
                            </select>
                            <Button>Simpan</Button>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Batal</Button>
                        </form>
                    </Card>
                )}

                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted"><tr><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Email</th><th className="p-2">Role</th><th className="p-2 text-left">Cabang</th><th className="p-2">Aksi</th></tr></thead>
                        <tbody>
                            {users.data.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="p-2">{u.name}</td><td className="p-2">{u.email}</td>
                                    <td className="p-2 text-center"><span className={`rounded px-2 py-0.5 text-xs ${u.role === 'OWNER' ? 'bg-black text-white' : 'bg-muted'}`}>{u.role}</span></td>
                                    <td className="p-2">{u.branch ? `${u.branch.code} - ${u.branch.name}` : '-'}</td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center gap-1">
                                            <Button size="sm" variant="outline" onClick={() => startEdit(u)}>Edit</Button>
                                            <Button size="sm" variant="outline" onClick={() => { if (confirm(`Hapus ${u.name}?`)) router.delete(`/users/${u.id}`, { preserveScroll: true }); }}>Hapus</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
