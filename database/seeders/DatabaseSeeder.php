<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use App\Services\PurchaseService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $pusat = Branch::firstOrCreate(['code' => 'PUSAT'], [
            'name' => 'Toko Pusat', 'address' => 'Jl. Merdeka 1', 'is_active' => true,
        ]);
        $cabang = Branch::firstOrCreate(['code' => 'CBG-01'], [
            'name' => 'Cabang 01', 'address' => 'Jl. Maju 2', 'is_active' => true,
        ]);

        $supplier = Supplier::firstOrCreate(['name' => 'Distributor Utama']);

        User::firstOrCreate(['email' => 'owner@pos.test'], [
            'name' => 'Owner', 'password' => 'password', 'role' => 'OWNER', 'branch_id' => null,
        ]);
        User::firstOrCreate(['email' => 'kasir@pos.test'], [
            'name' => 'Kasir Pusat', 'password' => 'password', 'role' => 'CASHIER', 'branch_id' => $pusat->id,
        ]);

        foreach ([$pusat, $cabang] as $branch) {
            $aqua = Product::firstOrCreate(['branch_id' => $branch->id, 'sku' => 'AQUA-600'], [
                'name' => 'Aqua 600ml', 'unit' => 'pcs', 'selling_price' => 5000, 'is_active' => true,
            ]);
            $aqua->priceTiers()->delete();
            $aqua->priceTiers()->createMany([
                ['min_qty' => 1, 'purchase_price' => 3500],
                ['min_qty' => 12, 'purchase_price' => 3200],
            ]);

            $mie = Product::firstOrCreate(['branch_id' => $branch->id, 'sku' => 'MIE-GRG'], [
                'name' => 'Indomie Goreng', 'unit' => 'pcs', 'selling_price' => 3500, 'is_active' => true,
            ]);

            if ((float) $aqua->fresh()->stock <= 0) {
                PurchaseService::create($branch, $supplier->id, null, now()->toDateTimeString(), [
                    ['product_id' => $aqua->id, 'qty' => 24, 'price' => 3200],
                    ['product_id' => $mie->id, 'qty' => 40, 'price' => 2800],
                ]);
            }
        }
    }
}
