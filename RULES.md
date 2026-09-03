# Aturan Role — Angkringan Lor Dalan

**Versi:** 2.1 (RBAC)  
**Tanggal:** 03 Sep 2026  
**File terkait:** `backend/auth.py`, `backend/routers/*.py`, `backend/models.py`, `index.html` guard, `static/js/script.js`

## 1. Ringkasan Role

| Role | Login? | Cara Masuk | Deskripsi |
|------|--------|------------|-----------|
| **Pelanggan** | **TIDAK** | Buka `index.html` langsung atau `http://127.0.0.1:8000/` tanpa login | Pengunjung umum / pembeli. Bisa lihat menu & pesan. |
| **Kasir** | YA | `login.html` → `kasir` + password → approve superadmin | Melayani pesanan, lihat keranjang customer & total bayar. |
| **Admin** | YA | `login.html` → `admin` + password → approve superadmin | Kelola menu (CRUD + label SOLD/HABIS). |
| **Superadmin** | YA (super) | `superadmin / Solojogja1` atau `admin / Solojogja1` (alias) | Full akses + approval + monitor online/offline. |

---

## 2. Matrix Hak Akses (RBAC)

### 2.1 Menu (Makanan & Minuman)

| Endpoint | Pelanggan | Kasir | Admin | Superadmin |
|----------|-----------|-------|-------|------------|
| `GET /api/menu/` list | ✅ public (hanya `is_active=true`) | ✅ | ✅ | ✅ |
| `GET /api/menu/{id}` detail | ✅ public | ✅ | ✅ | ✅ |
| `POST /api/menu/` tambah | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `PUT /api/menu/{id}` edit | ❌ | ❌ | ✅ | ✅ |
| `DELETE /api/menu/{id}` soft-delete (`is_active=False`) | ❌ | ❌ | ✅ | ✅ |
| `PATCH /api/menu/{id}/sold` toggle HABIS/SOLD | ❌ | ❌ | ✅ | ✅ |
| Frontend: badge SOLD & disable `+` jika `is_sold=true` | lihat | lihat | atur | atur |

**Field baru `Menu.is_sold` (`backend/models.py:33`):**
```python
is_sold = Column(Boolean, default=False) # True = HABIS / SOLD, label merah
```
Jika `is_sold=true`:
- Card menu overlay `SOLD - HABIS` (CSS `.menu-item.sold` grayscale 60% + badge merah)
- Tombol `+` disable, tooltip "Menu habis"
- Keranjang: tidak bisa `tambahMenu()` untuk id sold (validasi `static/js/script.js:199`)
- Pesanan: backend `pesanan.py:102` tolak `menu.is_sold==True` dengan `400 Menu habis (SOLD)`

**Admin panel di `index.html#adminPanel` (hanya `role` admin/superadmin):**
- Form `Tambah Menu` : id, nama, harga, kategori, gambar, deskripsi
- Tabel menu dengan tombol `Edit | Hapus | Toggle SOLD`
- Tombol `SOLD` → `PATCH /api/menu/{id}/sold {"is_sold": true/false}`

### 2.2 Pesanan — Kasir Focus

| Endpoint / Aksi | Pelanggan | Kasir | Admin | Superadmin |
|-----------------|-----------|-------|-------|------------|
| `POST /api/pesanan/` buat pesanan (pilih menu + qty) | ✅ public (tanpa token) | ✅ (via kasir input) | ✅ | ✅ |
| `GET /api/pesanan/` list + filter `?q=` | ❌ (public tidak lihat daftar) | ✅ | ✅ | ✅ |
| `GET /api/pesanan/{nota}` detail struk | ✅ jika tau nota sendiri | ✅ | ✅ | ✅ |
| `PATCH /api/pesanan/{nota}/status` ubah Antri/Proses/Siap/Lunas | ❌ | ✅ | ✅ | ✅ |
| `PATCH /api/pesanan/{nota}/lunas` Tandai Lunas | ❌ | ✅ | ✅ | ✅ |
| `DELETE /api/pesanan/{nota}` hapus satu | ❌ | ✅ | ✅ | ✅ |
| `DELETE /api/pesanan/` hapus semua | ❌ | ❌ | ❌ | ✅ (superadmin only) |

**Kasir panel di `index.html#kasirPanel` (role kasir/admin/superadmin):**
- Daftar pesanan real-time (auto-refresh 5s jika kasir)
- Kolom: `Nota | Pelanggan/Meja | Menu dipilih (qty x harga) | Total Bayar Rp | Metode | Status`
- Tombol `Lihat Struk`, `Ubah Status`, `Tandai Lunas (Bayar)`
- Ringkasan: `Total Omzet Hari Ini`, `Yang harus dibayar customer` = `belum_lunas_omzet` dari `GET /api/pembayaran/rangkuman`
- Tambahan relevan: `Cetak Struk` (`window.print`), `Filter Antri/Proses/Siap`, `WA Customer` click-to-chat `wa.me/`

### 2.3 Pembayaran & Statistik

| Endpoint | Pelanggan | Kasir | Admin | Superadmin |
|----------|-----------|-------|-------|------------|
| `GET /api/pembayaran/rangkuman` | ❌ | ✅ | ✅ | ✅ |
| `GET /api/stat` totalData/totalAntri/totalOmzet | ❌ | ✅ | ✅ | ✅ |
| Frontend `#pembayaran` card | ❌ hidden | ✅ | ✅ | ✅ |

Tambahan relevan kasir: `Rincian per Metode (Tunai/QRIS/Transfer/Bon)` + `Sudah Lunas vs Belum Lunas`.

### 2.4 User & Approval — Superadmin Focus

| Endpoint | Pelanggan | Kasir | Admin | Superadmin |
|----------|-----------|-------|-------|------------|
| `POST /api/auth/register-public` daftar kasir/admin | ❌ | ❌ daftar diri | ❌ | ❌ |
| `GET /api/auth/pending` list pending | ❌ | ❌ 403 | ❌ 403 | ✅ |
| `POST /api/auth/approve/{id}` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/auth/reject/{id}` | ❌ | ❌ | ❌ | ✅ |
| `GET /api/auth/active` online/offline + `GET /api/auth/users` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/auth/heartbeat` `POST /api/auth/logout` | ❌ | ✅ | ✅ | ✅ |
| `GET /api/auth/me` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/auth/register` buat langsung aktif | ❌ | ❌ | ❌ | ✅ |

**Superadmin panel di `index.html#superadminPanel` (`backend/routers/auth.py:215`):**
- `Pending Approval` (poll 5s) → Approve/Tolak
- `Akun Aktif — Online/Idle/Offline` dot hijau/kuning/abu, `last_seen_text` (online <90s, idle 90s-5m, offline >5m) — heartbeat 15s `index.html:526`
- Tambahan relevan: `Kirim notif`, `Reset password`, `Nonaktifkan akun`, `Lihat last_login`

---

## 3. Pelanggan Tanpa Login — Flow Lengkap

```
index.html (tanpa token) → guard index.html:14 tidak redirect, set role="pelanggan"
  → Lihat #makanan + #minuman (GET /api/menu/ public, fallback DAFTAR_MENU jika offline)
  → Jika is_sold → card SOLD, tombol + disable
  → Klik + → keranjang (static/js/script.js:199 validar is_sold)
  → Isi form pelanggan (nama, meja wajib) + auto-sync draft (isAuto)
  → Simpan Pesanan → POST /api/pesanan/ public tanpa Authorization
     → backend hitung total, generate ANG-000x, simpan Pesanan+PesananItem
  → Tampil struk + Cetak
  → Tidak lihat #daftar / #pembayaran / #adminPanel / #superadminPanel
  → Tombol [Login Kasir/Admin] di topbar → login.html
```

---

## 4. Penegakan di Backend (contoh)

```python
# backend/auth.py
async def get_current_admin(...): # admin atau superadmin
    if current_user.role not in ["admin","superadmin"]: raise 403
async def get_current_kasir_or_above(...): # kasir, admin, superadmin
    if current_user.role not in ["kasir","admin","superadmin"]: raise 403

# backend/routers/menu.py
@router.get("/") # public
def list_menu(..., db: Session = Depends(get_db)): # tanpa Depends(auth)

@router.post("/", dependencies=[Depends(get_current_admin)]) # admin only

# backend/routers/pesanan.py
@router.post("/") # public create
@router.get("/", dependencies=[Depends(get_current_kasir_or_above)])
```

Semua 401/403 di `static/js/script.js:apiFetch` → jika 401 redirect `login.html`, jika 403 tampil toast `Hanya admin/superadmin`.

---

## 5. Tambahan Relevan per Role (sudah/belum)

- **Pelanggan:** promo strip, estimasi waktu masak 5-10m, catat `WA` untuk notif, QR payment, rating bintang menu.
- **Kasir:** shortcut `Tandai Lunas`, suara ding pesanan baru (WebAudio), filter `Antri` only, total tagihan besar di topbar, reprint struk.
- **Admin:** upload gambar menu (base64/static/images), edit harga kategori bulk, hide SOLD dari pelanggan tapi tetap di DB, history edit.
- **Superadmin:** export Excel omzet, thermal print ESC/POS, audit log siapa ubah status, ban user, chart omzet harian `GET /api/stat`.

---

## 6. Cara Uji

```bash
# Public
curl http://127.0.0.1:8000/api/menu/ # 200 tanpa token
curl -X POST http://127.0.0.1:8000/api/pesanan/ -H "Content-Type: application/json" -d '{"nama":"Budi","meja":"Meja 01","items":[{"menu_id":"naskuc","qty":1}]}' # 201

# Kasir (login dulu)
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login-json -H "Content-Type: application/json" -d '{"username":"lana","password":"lana123"}' | jq -r .access_token)
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/pesanan/ # 200
curl -X POST http://127.0.0.1:8000/api/menu/ -H "Authorization: Bearer $TOKEN" ... # 403

# Admin
# Superadmin
TOKEN_SA=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login-json -d '{"username":"superadmin","password":"Solojogja1"}' | jq -r .access_token)
curl -H "Authorization: Bearer $TOKEN_SA" http://127.0.0.1:8000/api/auth/active # 200
curl -X PATCH http://127.0.0.1:8000/api/menu/naskuc/sold -H "Authorization: Bearer $TOKEN_SA" -d '{"is_sold":true}' # 200
```

---

> Implementasi kode ada di `backend/*.py` dan `index.html` + `static/js/script.js`. Matur nuwun, Lur!
