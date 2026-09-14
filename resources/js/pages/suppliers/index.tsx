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

type Supplier = {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    is_active: boolean;
};

export default function SuppliersIndex({
    suppliers,
}: {
    suppliers: { data: Supplier[] };
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [deleting, setDeleting] = useState<Supplier | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const form = useForm({
        name: '',
        phone: '',
        address: '',
        is_active: true as boolean,
    });

    const openCreate = () => {
        setEditing(null);
        form.setData({ name: '', phone: '', address: '', is_active: true });
        setOpen(true);
    };
    const openEdit = (s: Supplier) => {
        setEditing(s);
        form.setData({
            name: s.name,
            phone: s.phone ?? '',
            address: s.address ?? '',
            is_active: s.is_active,
        });
        setOpen(true);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing)
            router.put(`/suppliers/${editing.id}`, form.data as never, {
                onSuccess: () => setOpen(false),
                preserveScroll: true,
            });
        else
            form.post('/suppliers', {
                onSuccess: () => setOpen(false),
                preserveScroll: true,
            });
    };

    return (
        <>
            <Head title="Supplier" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Supplier (global)</h1>
                    <Button onClick={openCreate}>+ Tambah Supplier</Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-2 text-left">Nama</th>
                                <th className="p-2 text-left">Telepon</th>
                                <th className="p-2 text-left">Alamat</th>
                                <th className="p-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.data.map((s) => (
                                <tr key={s.id} className="border-t">
                                    <td className="p-2">{s.name}</td>
                                    <td className="p-2">{s.phone}</td>
                                    <td className="p-2">{s.address}</td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEdit(s)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDeleting(s)}
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
                            {editing ? 'Edit Supplier' : 'Tambah Supplier'}
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
                            <Label>Telepon</Label>
                            <Input
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
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
                                router.delete(`/suppliers/${deleting.id}`, {
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
