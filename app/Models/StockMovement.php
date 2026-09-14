<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = [
        'branch_id', 'product_id', 'type', 'reference_type', 'reference_id',
        'qty', 'stock_before', 'stock_after', 'note',
    ];

    public const TYPE_PURCHASE = 'PURCHASE';

    public const TYPE_SALE = 'SALE';

    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
            'stock_before' => 'decimal:3',
            'stock_after' => 'decimal:3',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }
}
