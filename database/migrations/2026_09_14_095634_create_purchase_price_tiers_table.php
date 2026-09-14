<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_price_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('min_qty', 15, 3);
            $table->decimal('purchase_price', 15, 2);
            $table->timestamps();

            $table->unique(['product_id', 'min_qty']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_price_tiers');
    }
};
