# API Mobile — Sistem POS

Base URL: `http://<host>/api/v1` · Auth: `Authorization: Bearer <token>` (Sanctum) · Format: JSON.

> Dokumentasi interaktif (Swagger UI, lengkap dengan contoh request/response & tombol Try it):
> **`http://<host>/docs/api`** · OpenAPI JSON: `http://<host>/docs/api.json` (package `dedoc/scramble`, otomatis dari route + FormRequest).

## Auth

### POST `/login` (rate-limit 10/menit)
```json
{ "email": "kasir@pos.test", "password": "password", "device_name": "android-oppo" }
```
Response 200:
```json
{
  "token": "3|xxxx",
  "user": { "id": 2, "name": "Kasir Pusat", "email": "kasir@pos.test", "role": "CASHIER" },
  "branch": { "id": 1, "code": "PUSAT", "name": "Toko Pusat" }
}
```
Gagal: 422 (`email: Email atau password salah.` / kasir tanpa cabang).

### POST `/logout` (auth)
Revoke token aktif. Response: `{ "message": "Logout berhasil." }`.

### GET `/me` (auth)
Profil + cabang. Kasir terkunci ke cabangnya; Owner `branch: null` (wajib kirim `branch_id` per request / default cabang aktif pertama).

## Produk

### GET `/products?q=&per_page=` (auth)
Produk aktif **cabang sendiri** saja. Kasir tanpa `branch_id` → 403.

## Penjualan

### POST `/sales` (auth)
```json
{
  "payment_method": "CASH",
  "paid_amount": 50000,
  "items": [{ "product_id": 1, "qty": 2, "price": 15000 }]
}
```
Response 201: sale + `items[].cost` (snapshot HPP) + `profit`, `invoice_no` (`PJ-{KODE}-{YYYYMM}-####`), `change_amount`. Stok boleh minus (tercatat di ledger). Produk cabang lain → 422.

`payment_method`: `CASH|QRIS|DEBIT|TRANSFER`. Owner boleh tambah `"branch_id": 2`.

### GET `/sales?date_from=&date_to=&per_page=` (auth)
Riwayat cabang sendiri (dengan `items_count`), terbaru dulu.

### GET `/sales/{id}` (auth)
Detail + item + produk untuk struk. Milik cabang lain → 403.

## Alur app mobile
1. `POST /login` → simpan token.
2. `GET /me`, `GET /products?q=` untuk katalog & pencarian.
3. Keranjang dihitung lokal, `POST /sales` saat bayar → tampilkan struk dari response.
4. `POST /logout` saat keluar.

## Error
- 401: tanpa token / token sudah di-revoke.
- 403: akses cabang lain.
- 422: validasi (`errors` object).
