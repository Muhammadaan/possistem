Siap. Saya rapikan menjadi **struktur tabel database + relasi antar tabel**. Untuk kebutuhan margin, kita gunakan **Average Cost/HPP rata-rata**.

## 1. `products`

| Field         | Type      | Key    | Keterangan         |
| ------------- | --------- | ------ | ------------------ |
| id            | BIGINT    | PK     | ID barang          |
| sku           | VARCHAR   | UNIQUE | Kode barang        |
| name          | VARCHAR   |        | Nama barang        |
| unit          | VARCHAR   |        | Satuan             |
| selling_price | DECIMAL   |        | Harga jual default |
| average_cost  | DECIMAL   |        | HPP rata-rata      |
| stock         | DECIMAL   |        | Stok saat ini      |
| is_active     | BOOLEAN   |        | Status barang      |
| created_at    | TIMESTAMP |        |                    |
| updated_at    | TIMESTAMP |        |                    |

> `average_cost` digunakan sebagai dasar perhitungan margin.

---

## 2. `purchase_price_tiers`

Untuk harga beli berdasarkan quantity.

| Field          | Type      | Key | Keterangan       |
| -------------- | --------- | --- | ---------------- |
| id             | BIGINT    | PK  | ID               |
| product_id     | BIGINT    | FK  | Barang           |
| min_qty        | DECIMAL   |     | Minimal quantity |
| purchase_price | DECIMAL   |     | Harga beli       |
| created_at     | TIMESTAMP |     |                  |
| updated_at     | TIMESTAMP |     |                  |

Contoh:

| product_id | min_qty | purchase_price |
| ---------: | ------: | -------------: |
|          1 |       1 |         11.000 |
|          1 |       4 |         10.000 |
|          1 |      11 |          9.500 |

---

## 3. `purchases`

Header transaksi pembelian.

| Field         | Type      | Key    | Keterangan        |
| ------------- | --------- | ------ | ----------------- |
| id            | BIGINT    | PK     | ID                |
| invoice_no    | VARCHAR   | UNIQUE | Nomor pembelian   |
| supplier      | VARCHAR   |        | Supplier          |
| purchase_date | DATETIME  |        | Tanggal pembelian |
| total         | DECIMAL   |        | Total pembelian   |
| created_at    | TIMESTAMP |        |                   |
| updated_at    | TIMESTAMP |        |                   |

---

## 4. `purchase_items`

Detail barang dalam satu pembelian.

| Field       | Type      | Key | Keterangan        |
| ----------- | --------- | --- | ----------------- |
| id          | BIGINT    | PK  | ID                |
| purchase_id | BIGINT    | FK  | Pembelian         |
| product_id  | BIGINT    | FK  | Barang            |
| qty         | DECIMAL   |     | Jumlah            |
| price       | DECIMAL   |     | Harga beli aktual |
| subtotal    | DECIMAL   |     | qty × price       |
| created_at  | TIMESTAMP |     |                   |

Contoh satu `purchase` bisa memiliki banyak `purchase_items`.

```text
PB-001
├── Aqua     10 × 9.500
├── Indomie  20 × 3.000
└── Sabun     5 × 8.000
```

---

## 5. `sales`

Header transaksi penjualan.

| Field          | Type      | Key    | Keterangan        |
| -------------- | --------- | ------ | ----------------- |
| id             | BIGINT    | PK     | ID                |
| invoice_no     | VARCHAR   | UNIQUE | Nomor transaksi   |
| sale_date      | DATETIME  |        | Tanggal transaksi |
| total          | DECIMAL   |        | Total penjualan   |
| payment_method | VARCHAR   |        | Cash/QRIS/Debit   |
| paid_amount    | DECIMAL   |        | Jumlah dibayar    |
| change_amount  | DECIMAL   |        | Kembalian         |
| created_at     | TIMESTAMP |        |                   |
| updated_at     | TIMESTAMP |        |                   |

---

## 6. `sale_items`

Detail barang yang dijual.

| Field      | Type      | Key | Keterangan             |
| ---------- | --------- | --- | ---------------------- |
| id         | BIGINT    | PK  | ID                     |
| sale_id    | BIGINT    | FK  | Penjualan              |
| product_id | BIGINT    | FK  | Barang                 |
| qty        | DECIMAL   |     | Jumlah                 |
| price      | DECIMAL   |     | Harga jual aktual      |
| cost       | DECIMAL   |     | HPP saat transaksi     |
| subtotal   | DECIMAL   |     | qty × price            |
| profit     | DECIMAL   |     | `(price - cost) × qty` |
| created_at | TIMESTAMP |     |                        |

Saya sengaja menambahkan `cost` di sini.

Misalnya saat transaksi:

```text
HPP      = 9.500
Harga    = 15.000
Qty      = 2
```

Maka:

```text
profit = (15.000 - 9.500) × 2
       = 11.000
```

Dengan begitu **margin historis tidak berubah** meskipun `average_cost` produk berubah di kemudian hari.

---

## 7. `stock_movements`

Histori perubahan stok.

| Field        | Type      | Key | Keterangan                   |
| ------------ | --------- | --- | ---------------------------- |
| id           | BIGINT    | PK  | ID                           |
| product_id   | BIGINT    | FK  | Barang                       |
| type         | VARCHAR   |     | PURCHASE / SALE / ADJUSTMENT |
| reference_id | BIGINT    |     | ID transaksi                 |
| qty          | DECIMAL   |     | Perubahan stok               |
| stock_before | DECIMAL   |     | Stok sebelum                 |
| stock_after  | DECIMAL   |     | Stok sesudah                 |
| created_at   | TIMESTAMP |     |                              |

---

# Relasi Antar Tabel

| Parent      | Relasi | Child                  | FK            |
| ----------- | ------ | ---------------------- | ------------- |
| `products`  | 1 : N  | `purchase_price_tiers` | `product_id`  |
| `purchases` | 1 : N  | `purchase_items`       | `purchase_id` |
| `products`  | 1 : N  | `purchase_items`       | `product_id`  |
| `sales`     | 1 : N  | `sale_items`           | `sale_id`     |
| `products`  | 1 : N  | `sale_items`           | `product_id`  |
| `products`  | 1 : N  | `stock_movements`      | `product_id`  |

### Visual relasi

```text
                         products
                            │
             ┌──────────────┼───────────────┐
             │              │               │
             ▼              ▼               ▼
 purchase_price_       purchase_items    sale_items
     tiers                  │               │
                            │               │
                            ▼               ▼
                       purchases           sales
                            │               │
                            └───────┬───────┘
                                    │
                                    ▼
                             stock_movements
```

## Alur harga & margin

```text
purchase_price_tiers
        │
        ▼
Harga beli
        │
        ▼
purchase_items.price
        │
        ▼
Update Average Cost
        │
        ▼
products.average_cost
        │
        ▼
Saat penjualan
        │
        ├── sale_items.price  → Harga Jual
        │
        └── sale_items.cost   → HPP
                    │
                    ▼
                 Profit
```

### Rumus

```text
HPP
= products.average_cost

Profit per item
= sale_items.price - sale_items.cost

Total Profit
= (sale_items.price - sale_items.cost) × qty

Margin %
= Profit / Penjualan × 100
```

Dengan struktur ini POS sudah mencakup **master barang, pembelian multi-barang, harga beli bertingkat, stok, penjualan multi-barang, HPP, margin, dan laporan penjualan/laba**.
