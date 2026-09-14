import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Branch = { id: number; code: string; name: string };
type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    branch_id: number | null;
    branch?: Branch | null;
};

export default function UsersIndex({
    users,
    branches,
}: {
    users: { data: User[] };
    branches: Branch[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleting, setDeleting] = useState<User | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: 'CASHIER',
        branch_id: '' as string | number,
    });

    const openCreate = () => {
        setEditing(null);
        form.setData({
            name: '',
            email: '',
            password: '',
            role: 'CASHIER',
            branch_id: '',
        });
        setOpen(true);
    };
    const openEdit = (u: User) => {
        setEditing(u);
        form.setData({
            name: u.name,
            email: u.email,
            password: '',
            role: u.role,
            branch_id: u.branch_id ?? '',
        });
        setOpen(true);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.data.name,
            email: form.data.email,
            role: form.data.role,
            branch_id: form.data.branch_id || null,
            ...(form.data.password ? { password: form.data.password } : {}),
        };
        if (editing)
            router.put(`/users/${editing.id}`, payload as never, {
                onSuccess: () => setOpen(false),
                preserveScroll: true,
            });
        else
            form.post('/users', {
                onSuccess: () => setOpen(false),
                preserveScroll: true,
            });
    };

    return (
        <>
            <Head title="Management User" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        Management User (Owner only)
                    </h1>
                    <Button onClick={openCreate}>+ Tambah User</Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-2 text-left">Nama</th>
                                <th className="p-2 text-left">Email</th>
                                <th className="p-2">Role</th>
                                <th className="p-2 text-left">Cabang</th>
                                <th className="p-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="p-2">{u.name}</td>
                                    <td className="p-2">{u.email}</td>
                                    <td className="p-2 text-center">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs ${u.role === 'OWNER' ? 'bg-black text-white' : 'bg-muted'}`}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        {u.branch
                                            ? `${u.branch.code} - ${u.branch.name}`
                                            : '-'}
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEdit(u)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDeleting(u)}
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? `Edit ${editing.name}` : 'Tambah User'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="grid gap-3">
                        <div className="grid gap-1">
                            <Label>Nama</Label>
                            <Input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>
                                {editing
                                    ? 'Password baru (kosongkan jika tidak ganti)'
                                    : 'Password (min 8)'}
                            </Label>
                            <Input
                                type="password"
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData('password', e.target.value)
                                }
                                required={!editing}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>Role</Label>
                            <select
                                value={form.data.role}
                                onChange={(e) =>
                                    form.setData('role', e.target.value)
                                }
                                className="rounded border p-2"
                            >
                                <option value="CASHIER">KASIR</option>
                                <option value="OWNER">OWNER</option>
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label>
                                Cabang{' '}
                                {form.data.role === 'OWNER'
                                    ? '(opsional)'
                                    : '(wajib kasir)'}
                            </Label>
                            <select
                                value={form.data.branch_id}
                                onChange={(e) =>
                                    form.setData('branch_id', e.target.value)
                                }
                                className="rounded border p-2"
                            >
                                <option value="">Pilih cabang</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.code} - {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button disabled={form.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleting}
                onOpenChange={(v) => {
                    if (!v) {
                        setDeleting(null);
                        setDeleteError(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus {deleting?.name}?</DialogTitle>
                    </DialogHeader>
                    {deleteError && (
                        <p className="rounded bg-red-50 p-2 text-sm text-red-600">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleting(null);
                                setDeleteError(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                deleting &&
                                router.delete(`/users/${deleting.id}`, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setDeleting(null);
                                        setDeleteError(null);
                                    },
                                    onError: (e) =>
                                        setDeleteError(
                                            (e as Record<string, string>)
                                                .delete ?? 'Gagal menghapus.',
                                        ),
                                })
                            }
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
