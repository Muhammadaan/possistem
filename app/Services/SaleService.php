<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class SaleService
{
    /**
     * @param  array<int, array{product_id:int, qty:float, price:float}>  $items
     */
    public static function create(
        Branch $branch,
        ?int $userId,
        string $saleDate,
        string $paymentMethod,
        float $paidAmount,
        array $items
    ): Sale {
        return DB::transaction(function () use ($branch, $userId, $saleDate, $paymentMethod, $paidAmount, $items) {
            $total = 0;
            $rows = [];

            foreach ($items as $item) {
                $product = Product::where('id', $item['product_id'])
                    ->where('branch_id', $branch->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $qty = (float) $item['qty'];
                $price = (float) $item['price'];
                $cost = (float) $product->average_cost;
                $subtotal = round($qty * $price, 2);
                $profit = round(($price - $cost) * $qty, 2);
                $total += $subtotal;

                $rows[] = compact('product', 'qty', 'price', 'cost', 'subtotal', 'profit');
            }

            $total = round($total, 2);

            $sale = Sale::create([
                'branch_id' => $branch->id,
                'user_id' => $userId,
                'invoice_no' => InvoiceNoService::nextSaleNo($branch->code),
                'sale_date' => $saleDate,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'paid_amount' => $paidAmount,
                'change_amount' => round(max(0, $paidAmount - $total), 2),
            ]);

            foreach ($rows as $row) {
                /** @var Product $product */
                $product = $row['product'];
                $oldStock = (float) $product->stock;
                $newStock = $oldStock - $row['qty'];

                $product->update(['stock' => $newStock]);

                $sale->items()->create([
                    'product_id' => $product->id,
                    'qty' => $row['qty'],
                    'price' => $row['price'],
                    'cost' => $row['cost'],
                    'subtotal' => $row['subtotal'],
                    'profit' => $row['profit'],
                ]);

                StockMovement::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'type' => StockMovement::TYPE_SALE,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'qty' => -$row['qty'],
                    'stock_before' => $oldStock,
                    'stock_after' => $newStock,
                ]);
            }

            return $sale->load('items');
        });
    }
}
