<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'branch_id', 'sku', 'name', 'unit',
        'selling_price', 'average_cost', 'stock', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'selling_price' => 'decimal:2',
            'average_cost' => 'decimal:2',
            'stock' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function priceTiers(): HasMany
    {
        return $this->hasMany(PurchasePriceTier::class)->orderBy('min_qty');
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function tierPriceFor(float $qty): float
    {
        $tier = $this->priceTiers()
            ->where('min_qty', '<=', $qty)
            ->orderByDesc('min_qty')
            ->first();

        return $tier ? (float) $tier->purchase_price : (float) $this->average_cost;
    }
}
