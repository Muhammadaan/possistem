# TODO — Sistem POS Multi-Cabang

Sumber: `doc/erd.md` + `doc/prd.md`. Keputusan: fullstack + UI, master `suppliers` global, stok boleh minus, multi-cabang per `branch_id`.

## 1. Database / Migrasi
- [ ] `branches`: `id, code UNIQUE, name, address NULL, phone NULL, is_active default true`
- [ ] `suppliers` (global): `id, name UNIQUE, phone NULL, address NULL, is_active default true`
- [ ] `users`: tambah `role ENUM OWNER,CASHIER default CASHIER`, `branch_id FK NULL -> branches nullOnDelete`
- [ ] `products`: tambah `branch_id FK cascade`, ubah unique `sku` -> composite `(branch_id, sku)`, kolom `selling_price decimal(15,2), average_cost decimal(15,2) default 0, stock decimal(15,3) default 0`
- [ ] `purchase_price_tiers`: pastikan FK `product_id cascade`, unique `(product_id, min_qty)`
- [ ] `purchases`: tambah `branch_id FK cascade, supplier_id FK nullOnDelete, user_id FK, invoice_no UNIQUE, purchase_date, total decimal(15,2)`
- [ ] `purchase_items`: `purchase_id, product_id, qty decimal(15,3), price decimal(15,2), subtotal decimal(15,2)`
- [ ] `sales`: tambah `branch_id FK cascade, user_id FK, invoice_no UNIQUE, sale_date, total, payment_method, paid_amount, change_amount`
- [ ] `sale_items`: `sale_id, product_id, qty, price, cost (snapshot HPP), subtotal, profit`
- [ ] `stock_movements`: tambah `branch_id FK cascade`, `type ENUM PURCHASE,SALE,ADJUSTMENT`, `reference_type VARCHAR, reference_id BIGINT`, `qty signed, stock_before/after`, index `(branch_id, product_id, created_at)`

## 2. Model & Relasi
- [ ] `Branch`: hasMany Product, Purchase, Sale, StockMovement, User
- [ ] `Supplier`: hasMany Purchase
- [ ] `User`: belongsTo Branch, enum role, scope `forBranch()`, helper `isOwner()`
- [ ] `Product`: belongsTo Branch, hasMany Tier/PurchaseItem/SaleItem/StockMovement, scope `active(), forBranch()`
- [ ] `Purchase/Sale`: belongsTo Branch/Supplier/User, hasMany Items
- [ ] Policy/Scope: Owner semua cabang, Kasir hanya `branch_id`-nya

## 3. Domain Service (transaction + lockForUpdate)
- [ ] `InvoiceNo`: generator `PB-{CODE}-YYYYMM-####` / `PJ-{CODE}-YYYYMM-####` anti-duplikat
- [ ] `TierPrice::resolve(product, qty)`: max `min_qty <= qty`
- [ ] `PurchaseService::create(branch, supplier, items)`: hitung total, update stock + average_cost (handle old_stock<=0), tulis ledger PURCHASE
- [ ] `SaleService::create(branch, items, payment)`: snapshot cost, hitung profit, stock boleh minus, tulis ledger SALE
- [ ] `StockAdjustmentService`: koreksi manual + ledger ADJUSTMENT + alasan

## 4. Backend HTTP (auth + verified)
- [ ] FormRequest: Branch, Supplier, Product+Tier, Purchase, Sale, Adjustment (validasi cabang: produk harus 1 cabang dengan header)
- [ ] Controller + routes: Branches (owner only), Suppliers, Products, Purchases, Sales/POS, StockMovements (read-only), Reports
- [ ] Seed + factory: 2 cabang, 1 owner, 2 kasir, supplier, produk + tier contoh

## 5. UI Inertia React
- [ ] Layout + branch switcher (owner) / badge cabang (kasir)
- [ ] `branches`, `suppliers`, `products` (CRUD + tier editor inline)
- [ ] `purchases/create` (multi-row + auto tier price + total live), `purchases/index/show`
- [ ] `sales/pos` (search SKU, cart, payment, paid/change, struk), `sales/index/show`
- [ ] `stocks/ledger` (filter cabang/produk/tanggal, highlight minus)
- [ ] `dashboard` (omzet, profit, margin%, top produk, stok minus — per cabang)

## 6. Verifikasi
- [ ] `php artisan migrate --seed` jalan bersih
- [ ] Test: avg cost, tier lookup, profit immutable, isolasi cabang, kasir lintas cabang ditolak, invoice unik
- [ ] `pint --test`, `phpstan`, `npm run types:check`
