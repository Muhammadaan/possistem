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

type Branch = {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    is_active: boolean;
};

export default function BranchesIndex({
    branches,
}: {
    branches: { data: Branch[] };
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Branch | null>(null);
    const [deleting, setDeleting] = useState<Branch | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const form = useForm({
        code: '',
        name: '',
        address: '',
        phone: '',
        is_active: true as boolean,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData({
            code: '',
            name: '',
            address: '',
            phone: '',
            is_active: true,
        });
        setOpen(true);
    };

    const openEdit = (b: Branch) => {
        setEditing(b);
        form.setData({
            code: b.code,
            name: b.name,
            address: b.address ?? '',
            phone: b.phone ?? '',
            is_active: b.is_active,
        });
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            router.put(`/branches/${editing.id}`, form.data as never, {
                onSuccess: () => setOpen(false),
                preserveScroll: true,
            });
        } else {
            form.post('/branches', {
                onSuccess: () => setOpen(false),
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Cabang" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Cabang</h1>
                    <Button onClick={openCreate}>+ Tambah Cabang</Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-2 text-left">Kode</th>
                                <th className="p-2 text-left">Nama</th>
                                <th className="p-2 text-left">Alamat</th>
                                <th className="p-2">Aktif</th>
                                <th className="p-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.data.map((b) => (
                                <tr key={b.id} className="border-t">
                                    <td className="p-2 font-mono">{b.code}</td>
                                    <td className="p-2">{b.name}</td>
                                    <td className="p-2">{b.address}</td>
                                    <td className="p-2 text-center">
                                        {b.is_active ? 'Ya' : 'Tidak'}
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEdit(b)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDeleting(b)}
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
                            {editing ? `Edit ${editing.code}` : 'Tambah Cabang'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="grid gap-3">
                        <div className="grid gap-1">
                            <Label>Kode</Label>
                            <Input
                                value={form.data.code}
                                onChange={(e) =>
                                    form.setData('code', e.target.value)
                                }
                                placeholder="JKT-01"
                                required
                            />
                        </div>
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
                            <Label>Alamat</Label>
                            <Input
                                value={form.data.address}
                                onChange={(e) =>
                                    form.setData('address', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>Telepon</Label>
                            <Input
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) =>
                                    form.setData('is_active', e.target.checked)
                                }
                            />{' '}
                            Aktif
                        </label>
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
                        <DialogTitle>Hapus {deleting?.code}?</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        Cabang yang sudah ada transaksi tidak bisa dihapus.
                    </p>
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
                                router.delete(`/branches/${deleting.id}`, {
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
