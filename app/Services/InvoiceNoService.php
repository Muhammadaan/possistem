<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class InvoiceNoService
{
    public static function nextPurchaseNo(string $branchCode): string
    {
        $prefix = sprintf('PB-%s-%s', $branchCode, now()->format('Ym'));

        return self::next($prefix, Purchase::class);
    }

    public static function nextSaleNo(string $branchCode): string
    {
        $prefix = sprintf('PJ-%s-%s', $branchCode, now()->format('Ym'));

        return self::next($prefix, Sale::class);
    }

    private static function next(string $prefix, string $model): string
    {
        return DB::transaction(function () use ($prefix, $model) {
            $last = $model::where('invoice_no', 'like', $prefix.'-%')
                ->lockForUpdate()
                ->orderByDesc('invoice_no')
                ->value('invoice_no');

            $seq = $last ? ((int) substr($last, strlen($prefix) + 1) + 1) : 1;

            return sprintf('%s-%04d', $prefix, $seq);
        });
    }
}
