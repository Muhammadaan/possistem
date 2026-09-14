import { Head, useForm } from '@inertiajs/react';
import { Minus, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import BranchSwitcher from '@/components/branch-switcher';
import QtyInput from '@/components/qty-input';
import RupiahInput from '@/components/rupiah-input';
import { Badge } from '@/components/ui/badge';
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
import { formatIDR, formatQty } from '@/lib/utils';

type Branch = { id: number; code: string; name: string };
type Product = {
    id: number;
    sku: string;
    name: string;
    selling_price: string;
    stock: string;
};
type CartLine = { product_id: number; qty: number; price: number };

const PAYMENTS = ['CASH', 'QRIS', 'DEBIT', 'TRANSFER'] as const;
const QUICK_CASH = [10000, 20000, 50000, 100000];

export default function Pos({
    branch,
    branches,
    isOwner,
    products,
}: {
    branch: Branch;
    branches?: Branch[];
    isOwner?: boolean;
    products: Product[];
}) {
    const [cart, setCart] = useState<CartLine[]>([]);
    const [q, setQ] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const form = useForm({
        branch_id: branch.id,
        payment_method: 'CASH',
        paid_amount: 0,
        items: cart,
    });

    const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
    const query = q.trim().toLowerCase();
    const filtered = useMemo(
        () =>
            (query
                ? products.filter(
                      (p) =>
                          p.sku.toLowerCase().includes(query) ||
                          p.name.toLowerCase().includes(query),
                  )
                : products
            ).slice(0, 60),
        [products, query],
    );

    const add = (p: Product, qty = 1) => {
        setCart((prev) => {
            const ex = prev.find((c) => c.product_id === p.id);
            if (ex)
                return prev.map((c) =>
                    c.product_id === p.id ? { ...c, qty: c.qty + qty } : c,
                );
            return [
                ...prev,
                { product_id: p.id, qty, price: Number(p.selling_price) },
            ];
        });
    };

    const bump = (id: number, delta: number) =>
        setCart((prev) =>
            prev
                .map((c) =>
                    c.product_id === id
                        ? { ...c, qty: Math.max(0, c.qty + delta) }
                        : c,
                )
                .filter((c) => c.qty > 0),
        );

    const total = cart.reduce((s, c) => s + c.qty * c.price, 0);
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const isCash = form.data.payment_method === 'CASH';
    const paid = isCash ? form.data.paid_amount || 0 : total;
    const change = Math.max(0, paid - total);
    const short = Math.max(0, total - paid);
    const canPay =
        cart.length > 0 && !form.processing && (!isCash || paid >= total);

    const submit = () => {
        if (!canPay) return;
        form.transform((data) => ({
            ...data,
            branch_id: branch.id,
            paid_amount: isCash ? paid : total,
            items: cart,
        }));
        form.post('/sales');
    };

    const pickSearch = () => {
        if (filtered.length === 0) return;
        const exact = filtered.find((p) => p.sku.toLowerCase() === query);
        add(exact ?? filtered[0]);
        setQ('');
        searchRef.current?.focus();
    };

    const quickOptions = useMemo(() => {
        const opts = [total, ...QUICK_CASH.filter((v) => v >= total)].filter(
            (v) => v > 0,
        );
        return [...new Set(opts)].slice(0, 5);
    }, [total]);

    return (
        <>
            <Head title="Kasir" />
            <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-4 lg:flex-row">
                {/* Katalog kiri */}
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold">
                            Kasir — {branch.code}
                        </h1>
                        <BranchSwitcher
                            branch={branch}
                            branches={branches}
                            isOwner={isOwner}
                        />
                        <span className="text-muted-foreground text-sm">
                            {products.length} produk
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            ref={searchRef}
                            autoFocus
                            placeholder="Cari / scan SKU atau nama… (Enter = tambah)"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') pickSearch();
                            }}
                            className="pl-9 text-base"
                        />
                        {q && (
                            <button
                                onClick={() => setQ('')}
                                className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 hover:text-foreground"
                                aria-label="Bersihkan pencarian"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((p) => {
                            const inCart =
                                cart.find((c) => c.product_id === p.id)?.qty ??
                                0;
                            const low = Number(p.stock) <= 0;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => add(p)}
                                    className="relative rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:shadow-sm active:scale-[0.98]"
                                >
                                    {inCart > 0 && (
                                        <Badge className="absolute top-1.5 right-1.5">
                                            ×{formatQty(inCart)}
                                        </Badge>
                                    )}
                                    <div className="truncate pr-10 text-sm font-medium">
                                        {p.name}
                                    </div>
                                    <div className="text-muted-foreground truncate font-mono text-xs">
                                        {p.sku}
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="font-bold">
                                            {formatIDR(p.selling_price)}
                                        </span>
                                        <span
                                            className={`text-xs ${low ? 'font-bold text-red-600' : 'text-muted-foreground'}`}
                                        >
                                            {formatQty(p.stock)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="text-muted-foreground col-span-full py-10 text-center text-sm">
                                Produk tidak ditemukan.
                            </div>
                        )}
                    </div>
                </div>

                {/* Keranjang kanan */}
                <Card className="flex w-full flex-col gap-3 p-4 lg:w-[380px] lg:shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <ShoppingCart className="h-4 w-4" />
                            Keranjang
                            <Badge variant="secondary">{formatQty(count)}</Badge>
                        </h2>
                        {cart.length > 0 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCart([])}
                            >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Kosongkan
                            </Button>
                        )}
                    </div>

                    <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 lg:max-h-none">
                        {cart.length === 0 && (
                            <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
                                Klik produk untuk menambah
                                <br />
                                atau scan barcode lalu Enter.
                            </div>
                        )}
                        {cart.map((c) => {
                            const p = byId.get(c.product_id);
                            return (
                                <div
                                    key={c.product_id}
                                    className="rounded-lg border p-2"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">
                                                {p?.name ?? `#${c.product_id}`}
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                {p ? formatIDR(p.selling_price) : ''} →{' '}
                                                {formatIDR(c.price)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setCart(
                                                    cart.filter(
                                                        (x) =>
                                                            x.product_id !==
                                                            c.product_id,
                                                    ),
                                                )
                                            }
                                            className="text-muted-foreground hover:text-red-600"
                                            aria-label="Hapus baris"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                bump(c.product_id, -1)
                                            }
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <QtyInput
                                            value={c.qty}
                                            onValueChange={(n) =>
                                                setCart(
                                                    cart.map((x) =>
                                                        x.product_id ===
                                                        c.product_id
                                                            ? { ...x, qty: n }
                                                            : x,
                                                    ),
                                                )
                                            }
                                            className="h-8 text-center"
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            onClick={() => bump(c.product_id, 1)}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                        <RupiahInput
                                            value={c.price}
                                            onValueChange={(n) =>
                                                setCart(
                                                    cart.map((x) =>
                                                        x.product_id ===
                                                        c.product_id
                                                            ? { ...x, price: n }
                                                            : x,
                                                    ),
                                                )
                                            }
                                            className="h-8"
                                        />
                                        <div className="w-24 shrink-0 text-right text-sm font-semibold">
                                            {formatIDR(c.qty * c.price)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-muted-foreground text-sm">
                            Total
                        </span>
                        <span className="text-2xl font-bold">
                            {formatIDR(total)}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        {PAYMENTS.map((m) => (
                            <Button
                                key={m}
                                size="sm"
                                variant={
                                    form.data.payment_method === m
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() =>
                                    form.setData('payment_method', m)
                                }
                            >
                                {m}
                            </Button>
                        ))}
                    </div>

                    {isCash && (
                        <>
                            <div className="flex flex-wrap gap-1.5">
                                {quickOptions.map((v) => (
                                    <Button
                                        key={v}
                                        size="sm"
                                        variant={
                                            paid === v ? 'default' : 'outline'
                                        }
                                        onClick={() =>
                                            form.setData('paid_amount', v)
                                        }
                                    >
                                        {v === total
                                            ? 'Uang pas'
                                            : formatIDR(v)}
                                    </Button>
                                ))}
                            </div>
                            <RupiahInput
                                value={form.data.paid_amount}
                                onValueChange={(n) =>
                                    form.setData('paid_amount', n)
                                }
                                placeholder="Tunai diterima"
                            />
                            <div
                                className={`text-sm font-medium ${short > 0 ? 'text-red-600' : 'text-green-700'}`}
                            >
                                {short > 0
                                    ? `Kurang ${formatIDR(short)}`
                                    : `Kembali ${formatIDR(change)}`}
                            </div>
                        </>
                    )}

                    <Button
                        size="lg"
                        onClick={() => canPay && setConfirmOpen(true)}
                        disabled={!canPay}
                        className="w-full text-base"
                    >
                        Bayar {formatIDR(total)}
                    </Button>
                </Card>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                    </DialogHeader>
                    <div className="grid max-h-56 gap-1 overflow-y-auto text-sm">
                        {cart.map((c) => {
                            const p = byId.get(c.product_id);
                            return (
                                <div
                                    key={c.product_id}
                                    className="flex justify-between gap-2"
                                >
                                    <span className="min-w-0 truncate">
                                        {p?.name ?? `#${c.product_id}`}{' '}
                                        <span className="text-muted-foreground">
                                            ×{formatQty(c.qty)}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-medium">
                                        {formatIDR(c.qty * c.price)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid gap-1 border-t pt-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span className="text-lg font-bold">
                                {formatIDR(total)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Bayar ({form.data.payment_method})
                            </span>
                            <span>{formatIDR(paid)}</span>
                        </div>
                        {isCash && (
                            <div className="flex justify-between font-medium text-green-700">
                                <span>Kembali</span>
                                <span>{formatIDR(change)}</span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cek lagi
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmOpen(false);
                                submit();
                            }}
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Memproses…'
                                : 'Ya, bayar sekarang'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
