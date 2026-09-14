# PRD — Sistem POS Multi-Cabang

## Latar Belakang

Usaha membutuhkan Sistem POS yang bisa dipakai di lebih dari satu cabang. ERD awal di `doc/erd.md` hanya mencakup satu toko: `products`, `purchase_price_tiers`, `purchases` + `purchase_items`, `sales` + `sale_items`, `stock_movements`, dengan HPP memakai Average Cost dan profit di-snapshot per `sale_items.cost`.

Kebutuhan baru:
1. Bisa punya banyak cabang.
2. Stok, HPP (`average_cost`), harga jual, pembelian, dan penjualan tercatat per cabang.
3. Manajemen user memakai tabel `users` yang sudah ada, dengan peran Owner (semua cabang) dan Kasir (terikat 1 cabang).
4. Tetap fullstack (backend + UI kasir/laporan), ada master supplier, stok boleh minus (sesuai keputusan sebelumnya).

Stack: Laravel 13, PHP 8.3, Inertia React, Tailwind v4, Fortify auth.

## Tujuan

1. Mendukung multi-cabang dengan data terisolasi per `branch_id`.
2. Pembelian multi-barang per cabang dengan harga tier + update Average Cost per cabang.
3. Penjualan POS per cabang dengan snapshot HPP, profit immutable, stok boleh minus tapi tercatat di ledger.
4. Role sederhana: Owner akses semua cabang, Kasir hanya cabang penempatannya.
5. UI: master cabang/produk/supplier, pembelian, kasir, riwayat, ledger stok, dashboard margin per cabang.

### Desain Multi-Cabang (keputusan)

* Tabel baru `branches`: `id, code UNIQUE, name, address, phone, is_active, timestamps`.
* `users` ditambah: `role ENUM(OWNER,CASHIER) default CASHIER`, `branch_id FK NULL` (Owner = NULL/artinya semua cabang, Kasir = wajib isi).
* `products` ditambah `branch_id FK`, unique jadi `(branch_id, sku)`. Artinya master barang per cabang (stok & `average_cost` per baris product-cabang). Paling sederhana, tidak perlu tabel pivot stok.
* `purchases` ditambah `branch_id FK`, `supplier_id FK` (master `suppliers` global), `user_id FK` (pencatat).
* `sales` ditambah `branch_id FK`, `user_id FK` (kasir).
* `stock_movements` ditambah `branch_id FK` (denormalisasi untuk query cepat + isolasi).
* `purchase_price_tiers` tidak perlu `branch_id` langsung, ikut `product.branch_id`.
* `suppliers` global (tanpa `branch_id`), bisa dipakai semua cabang.
* `invoice_no`: unik global, format `PB-{BRANCHCODE}-YYYYMM-0001` / `PJ-{BRANCHCODE}-YYYYMM-0001`.
* Rumus Average Cost per cabang: `new_avg = (old_stock*old_avg + qty*price)/(old_stock+qty)`, jika `old_stock <= 0` maka `new_avg = price`.
* Semua query transaksi wajib filter `branch_id` (scope + policy).

## User Story, Acceptance Criteria

### US-1 — Kelola Cabang (Owner)
**Sebagai** Owner, **saya ingin** menambah/nonaktifkan cabang, **agar** tiap toko punya data sendiri.

* AC1: Owner bisa CRUD `branches` (code unik, mis. `JKT-01`).
* AC2: Cabang nonaktif (`is_active=false`) tidak bisa dipilih untuk transaksi baru, tapi data historis tetap bisa dilihat.
* AC3: Kasir tidak bisa akses halaman cabang.

### US-2 — Manajemen User (Owner)
**Sebagai** Owner, **saya ingin** membuat akun Owner/Kasir dan menempatkan kasir ke cabang, **agar** akses terisolasi.

* AC1: Field `users.role` hanya `OWNER`/`CASHIER`, `branch_id` wajib jika CASHIER, boleh NULL jika OWNER.
* AC2: Login kasir otomatis terkunci ke `branch_id`-nya (tidak bisa ganti cabang via URL/API).
* AC3: Owner bisa melihat & memilih semua cabang (filter cabang di UI).

### US-3 — Master Produk per Cabang
**Sebagai** Owner/Kasir, **saya ingin** kelola barang per cabang beserta tier harga beli, **agar** harga & stok tiap toko akurat.

* AC1: Produk unik per `(branch_id, sku)`. SKU sama boleh beda cabang.
* AC2: CRUD produk: `sku, name, unit, selling_price, is_active`. `stock` & `average_cost` read-only (diupdate via pembelian/penjualan/adjustment).
* AC3: Tier harga beli per produk: `(product_id, min_qty)` unik, contoh 1→11.000, 4→10.000, 11→9.500.
* AC4: Kasir hanya lihat/edit produk cabangnya.

### US-4 — Master Supplier (global)
**Sebagai** Owner, **saya ingin** kelola supplier sekali untuk semua cabang.

* AC1: CRUD `suppliers` (`name UNIQUE, phone, address, is_active`).
* AC2: Pembelian per cabang bisa pilih supplier global mana pun.

### US-5 — Pembelian per Cabang
**Sebagai** Kasir/Owner, **saya ingin** mencatat pembelian multi-barang ke cabang saya, **agar** stok & HPP bertambah.

* AC1: Form: pilih supplier, tanggal, multi-row `(product_id cabangnya, qty, price auto-suggest dari tier max min_qty<=qty tapi bisa edit, subtotal)`.
* AC2: Saat simpan (1 transaksi DB + `lockForUpdate`): total = sum subtotal, `stock += qty`, update `average_cost` per rumus di atas, tulis `stock_movements PURCHASE` dengan `stock_before/after` + `branch_id`.
* AC3: `invoice_no` auto `PB-{BRANCHCODE}-...` unik.
* AC4: Tidak bisa beli produk cabang lain.

### US-6 — Penjualan / Kasir per Cabang
**Sebagai** Kasir, **saya ingin** jualan cepat (search SKU/nama, cart, bayar), **agar** antrean lancar.

* AC1: Cart hanya produk `is_active` cabang kasir. Bisa qty desimal.
* AC2: Saat bayar (1 transaksi DB): snapshot `sale_items.cost = product.average_cost`, `subtotal=qty*price`, `profit=(price-cost)*qty`, update `total`, `paid_amount`, `change_amount`, `stock -= qty` (boleh minus), tulis `stock_movements SALE`.
* AC3: `payment_method`: CASH/QRIS/DEBIT/TRANSFER. `paid>=total` (kecuali QRIS/debit pas).
* AC4: Profit historis tidak berubah walau `average_cost` kemudian berubah.
* AC5: `invoice_no` auto `PJ-{BRANCHCODE}-...` unik. Ada struk.

### US-7 — Ledger Stok & Adjustment per Cabang
**Sebagai** Owner, **saya ingin** melihat histori stok per cabang, **agar** bisa audit selisih/minus.

* AC1: `stock_movements` menyimpan `branch_id, product_id, type PURCHASE/SALE/ADJUSTMENT, reference_type/id, qty signed, stock_before/after`.
* AC2: Adjustment manual (Owner) tercatat sebagai ADJUSTMENT dengan alasan.
* AC3: Filter per cabang + produk + rentang tanggal. Stok minus ditandai merah.

### US-8 — Laporan & Dashboard per Cabang
**Sebagai** Owner, **saya ingin** lihat omzet, profit, margin % per cabang, **agar** tahu performa tiap toko.

* AC1: Dashboard: filter cabang (Owner) / terkunci (Kasir). Metrik: omzet, profit, margin% = profit/omzet*100, top produk, stok menipis/minus.
* AC2: Laporan penjualan & laba per periode + per cabang, export dasar.
* AC3: Kasir hanya lihat laporan cabangnya.

### Non-fungsional
* Semua endpoint transaksi: auth + authorize cabang (policy/scope), validasi FormRequest, DB transaction.
* Presisi: uang `decimal(15,2)`, qty `decimal(15,3)`.
* Test: pembelian update avg, tier lookup, profit immutable, isolasi cabang, kasir tidak bisa lintas cabang.
