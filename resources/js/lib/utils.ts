import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatIDR(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : (value ?? 0);
    if (!Number.isFinite(n)) return 'Rp 0';

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export function parseIDR(input: string): number {
    if (!input) return 0;
    // Ambil digit dan minus, buang "Rp", titik ribuan, spasi, dll.
    // Koma dianggap desimal lalu dibulatkan (Rupiah tanpa sen).
    const normalized = input.replace(/[^0-9,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);

    return Number.isFinite(n) ? Math.round(n) : 0;
}

export function formatQty(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : (value ?? 0);
    if (!Number.isFinite(n)) return '0';

    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(n);
}

export const UNIT_OPTIONS = [
    'pcs',
    'pack',
    'dus',
    'box',
    'karton',
    'lusin',
    'kg',
    'g',
    'liter',
    'ml',
    'sachet',
    'botol',
    'kaleng',
    'set',
    'pasang',
    'roll',
    'm',
] as const;
