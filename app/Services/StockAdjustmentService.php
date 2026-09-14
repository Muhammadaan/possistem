<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockAdjustmentService
{
    public static function adjust(
        Branch $branch,
        int $productId,
        float $newStock,
        ?int $userId = null,
        ?string $note = null
    ): StockMovement {
        return DB::transaction(function () use ($branch, $productId, $newStock, $note) {
            /** @var Product $product */
            $product = Product::where('id', $productId)
                ->where('branch_id', $branch->id)
                ->lockForUpdate()
                ->firstOrFail();

            $before = (float) $product->stock;
            $product->update(['stock' => $newStock]);

            return StockMovement::create([
                'branch_id' => $branch->id,
                'product_id' => $product->id,
                'type' => StockMovement::TYPE_ADJUSTMENT,
                'reference_type' => null,
                'reference_id' => null,
                'qty' => $newStock - $before,
                'stock_before' => $before,
                'stock_after' => $newStock,
                'note' => $note,
            ]);
        });
    }
}
