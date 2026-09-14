<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchasePriceTier extends Model
{
    protected $fillable = ['product_id', 'min_qty', 'purchase_price'];

    protected function casts(): array
    {
        return [
            'min_qty' => 'decimal:3',
            'purchase_price' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
