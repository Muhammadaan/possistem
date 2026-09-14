import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatIDR, parseIDR } from '@/lib/utils';

type Props = {
    value: number | string;
    onValueChange: (n: number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

const group = (n: number) => (n ? new Intl.NumberFormat('id-ID').format(n) : '');

/** Input Rupiah: kosong di awal, ketik "10000" → tampil "Rp 10.000", simpan number. */
export default function RupiahInput({ value, onValueChange, placeholder = 'Rp 0', className, disabled }: Props) {
    const numeric = Number(value) || 0;
    const [text, setText] = useState(numeric ? formatIDR(numeric) : '');
    const [focus, setFocus] = useState(false);

    useEffect(() => {
        if (!focus) setText(numeric ? formatIDR(numeric) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, focus]);

    return (
        <Input
            inputMode="numeric"
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            value={text}
            onFocus={(e) => {
                setFocus(true);
                // Tampilkan digit polos agar gampang ditimpa, lalu blok semua.
                setText(numeric ? group(numeric) : '');
                requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => {
                const n = parseIDR(e.target.value);
                // Live format saat mengetik; kosong tetap kosong.
                setText(n ? group(n) : '');
                onValueChange(n);
            }}
            onBlur={() => {
                setFocus(false);
                setText(numeric ? formatIDR(numeric) : '');
            }}
        />
    );
}
