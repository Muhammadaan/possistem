<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    /**
     * @param  array<int, array{product_id:int, qty:float, price:float}>  $items
     */
    public static function create(
        Branch $branch,
        ?int $supplierId,
        ?int $userId,
        string $purchaseDate,
        array $items
    ): Purchase {
        return DB::transaction(function () use ($branch, $supplierId, $userId, $purchaseDate, $items) {
            $total = 0;
            $rows = [];

            foreach ($items as $item) {
                $product = Product::where('id', $item['product_id'])
                    ->where('branch_id', $branch->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $qty = (float) $item['qty'];
                $price = (float) $item['price'];
                $subtotal = round($qty * $price, 2);
                $total += $subtotal;

                $rows[] = ['product' => $product, 'qty' => $qty, 'price' => $price, 'subtotal' => $subtotal];
            }

            $purchase = Purchase::create([
                'branch_id' => $branch->id,
                'supplier_id' => $supplierId,
                'user_id' => $userId,
                'invoice_no' => InvoiceNoService::nextPurchaseNo($branch->code),
                'purchase_date' => $purchaseDate,
                'total' => round($total, 2),
            ]);

            foreach ($rows as $row) {
                /** @var Product $product */
                $product = $row['product'];
                $oldStock = (float) $product->stock;
                $oldAvg = (float) $product->average_cost;

                $newStock = $oldStock + $row['qty'];
                $newAvg = $oldStock <= 0
                    ? $row['price']
                    : (($oldStock * $oldAvg + $row['qty'] * $row['price']) / $newStock);

                $product->update([
                    'stock' => $newStock,
                    'average_cost' => round($newAvg, 2),
                ]);

                $purchase->items()->create([
                    'product_id' => $product->id,
                    'qty' => $row['qty'],
                    'price' => $row['price'],
                    'subtotal' => $row['subtotal'],
                ]);

                StockMovement::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'type' => StockMovement::TYPE_PURCHASE,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'qty' => $row['qty'],
                    'stock_before' => $oldStock,
                    'stock_after' => $newStock,
                ]);
            }

            return $purchase->load('items');
        });
    }
}
