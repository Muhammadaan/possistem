import { useState } from 'react';
import { Input } from '@/components/ui/input';

type Product = { id: number; sku: string; name: string };

/** Dropdown barang dengan search SKU/nama. */
export default function ProductPicker({
    products,
    value,
    onSelect,
    placeholder = 'Ketik SKU/nama...',
}: {
    products: Product[];
    value: number;
    onSelect: (id: number) => void;
    placeholder?: string;
}) {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const selected = products.find((p) => p.id === value);

    const query = q.trim().toLowerCase();
    const filtered = (
        query
            ? products.filter(
                  (p) =>
                      p.sku.toLowerCase().includes(query) ||
                      p.name.toLowerCase().includes(query),
              )
            : products
    ).slice(0, 10);

    return (
        <div className="relative w-64">
            <Input
                placeholder={
                    selected
                        ? `${selected.sku} - ${selected.name}`
                        : placeholder
                }
                value={
                    open
                        ? q
                        : selected
                          ? `${selected.sku} - ${selected.name}`
                          : ''
                }
                onFocus={() => {
                    setQ('');
                    setOpen(true);
                }}
                onChange={(e) => {
                    setQ(e.target.value);
                    setOpen(true);
                }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded border bg-white shadow-lg">
                    {filtered.length === 0 && (
                        <div className="text-muted-foreground p-2 text-sm">
                            Tidak ketemu
                        </div>
                    )}
                    {filtered.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSelect(p.id);
                                setQ('');
                                setOpen(false);
                            }}
                            className={`hover:bg-muted block w-full p-2 text-left text-sm ${p.id === value ? 'bg-muted font-medium' : ''}`}
                        >
                            <div className="font-mono text-xs">{p.sku}</div>
                            <div>{p.name}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
