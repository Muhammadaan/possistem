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

   
    }
}
