import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

type Props = {
    value: number;
    onValueChange: (n: number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

/** Input kuantitas: fokus langsung ter-blok (ketik langsung ganti), dukung desimal maks 3 digit. */
export default function QtyInput({ value, onValueChange, placeholder = 'Qty', className, disabled }: Props) {
    const [text, setText] = useState(value ? String(value) : '');
    const [focus, setFocus] = useState(false);

    useEffect(() => {
        if (!focus) setText(value ? String(value) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, focus]);

    return (
        <Input
            inputMode="decimal"
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            value={text}
            onFocus={(e) => {
                setFocus(true);
                requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => {
                const raw = e.target.value.replace(',', '.');
                if (raw !== '' && !/^\d*\.?\d{0,3}$/.test(raw)) return;
                setText(e.target.value);
                onValueChange(raw === '' || raw === '.' ? 0 : Number(raw));
            }}
            onBlur={() => {
                setFocus(false);
                setText(value ? String(value) : '');
            }}
        />
    );
}
