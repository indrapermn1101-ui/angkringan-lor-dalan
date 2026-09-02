# Backend FastAPI + SQLite - Angkringan Lor Dalan

Backend migrasi dari LocalStorage ke SQLite + FastAPI. Frontend `index.html` tetap sama, `script.js` otomatis pakai API jika tersedia, fallback ke LocalStorage jika offline.

## Struktur

```
backend/
  main.py              # FastAPI app, CORS, StaticFiles, mount /images & /
  database.py          # SQLAlchemy engine sqlite:///./backend/angkringan.db
  models.py            # Menu, Pesanan, PesananItem (3 tabel)
  schemas.py           # Pydantic MenuOut, PesananCreate, PesananOut, dll
  routers/
    menu.py            # GET /api/menu, POST /api/menu
    pesanan.py         # CRUD /api/pesanan
    pembayaran.py      # GET /api/pembayaran/rangkuman, GET /api/stat
  seed.py              # Seed 16 menu dari DAFTAR_MENU script.js:3
  angkringan.db        # SQLite file (auto-create)
  requirements.txt
```

## Model SQLite

**menu** (16 rows): `id PK, nama, harga, kategori, gambar, deskripsi, is_active`
  - Nasi Kucing, Nasi Bakar Ayam, Nasi Goreng Jawa, 4 Sate, 3 Gorengan, Sosis, 4 Minuman, Mie

**pesanan**: `nota PK ANG-0001, nama, meja, wa, jml_orang, total, pembayaran, status, tanggal, jam, catatan, waktu_simpan`

**pesanan_item**: `id PK, nota FK, menu_id FK, nama, harga, qty, subtotal, kategori, gambar`

## API Routes

| Method | Path | Deskripsi | Ganti Frontend |
|---|---|---|---|
| `GET` | `/api/health` | Health check | `script.js:38 checkApi()` |
| `GET` | `/api` | Info | - |
| `GET` | `/api/menu/` | List menu, `?kategori=Minuman&q=sate` | `script.js:45 loadMenuFromApi()` |
| `GET` | `/api/menu/{id}` | Detail menu | - |
| `GET` | `/api/pesanan/` | List pesanan, `?q=Gilang&status=Antri&skip=0&limit=100` | `script.js:55 loadPesananFromApi()` `script.js:433 renderTable` |
| `GET` | `/api/pesanan/{nota}` | Detail | `script.js:561 lihatNota` |
| `POST` | `/api/pesanan/` | Buat pesanan `{nama, meja, wa, jml_orang, pembayaran, status, tanggal, jam, catatan, items:[{menu_id,qty}]}` server hitung total, generate nota | `script.js:354 simpanPesanan()` |
| `PATCH` | `/api/pesanan/{nota}/status` | Ubah status `{status}` | `script.js:672 ubahStatus()` |
| `PATCH` | `/api/pesanan/{nota}/lunas` | Tandai lunas | `script.js:655 tandaiLunas()` |
| `PATCH` | `/api/pesanan/{nota}` | Update field lain | - |
| `DELETE` | `/api/pesanan/{nota}` | Hapus satu | `script.js:699 hapusData()` |
| `DELETE` | `/api/pesanan/` | Hapus semua | `script.js:717 hapusSemua()` |
| `GET` | `/api/pembayaran/rangkuman` | Rangkuman omzet lunas/belum + per metode | `script.js:602 renderPembayaran` |
| `GET` | `/api/stat` | Stat totalData/totalAntri/totalOmzet | `script.js:631 updateStat` |
| `GET` | `/docs` | Swagger UI | - |
| `GET` | `/` | Frontend index.html | - |
| `GET` | `/images/*` | Foto menu JPG | - |

Swagger: `http://127.0.0.1:8000/docs`

## Cara Jalankan

### 1. Install
```bash
pip install -r backend/requirements.txt
```

### 2. Seed DB (16 menu)
```bash
python -m backend.seed
# atau
python backend/seed.py
```

### 3. Jalankan Server
```bash
# Dari folder PRAKTEK/
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Atau
uvicorn backend.main:app --reload
```

Buka:
- Frontend: http://127.0.0.1:8000/  (via FastAPI static)
- API Docs: http://127.0.0.1:8000/docs
- Frontend Live Server (alternative): http://127.0.0.1:5500/index.html (akan auto fetch ke http://127.0.0.1:8000/api via CORS)

### 4. Stop
`Ctrl+C` di terminal. DB tetap di `backend/angkringan.db`

## Frontend Integration

`script.js` sudah di-refactor:

- `API_BASE = location.port==="8000" ? "/api" : "http://127.0.0.1:8000/api"` `script.js:22`
- `checkApi()`, `loadMenuFromApi()`, `loadPesananFromApi()` `script.js:38-81`
- `DOMContentLoaded async` coba API dulu, fallback LocalStorage `script.js:91`
- `simpanPesanan() async` POST ke `/api/pesanan/` jika `API_AVAILABLE` `script.js:354`
- `tandaiLunas()`, `ubahStatus()`, `hapusData()`, `hapusSemua()`, `filterData()` semua `async` + `apiFetch` fallback

Jika backend mati, otomatis fallback ke LocalStorage (mode offline lama) tanpa error.

## Testing

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/menu/
curl -X POST http://127.0.0.1:8000/api/pesanan/ -H "Content-Type: application/json" -d '{"nama":"Gilang","meja":"Meja 01","items":[{"menu_id":"naskuc","qty":2}]}'
curl http://127.0.0.1:8000/api/pesanan/
curl http://127.0.0.1:8000/api/stat
```

## Catatan

- SQLite file: `backend/angkringan.db` (gitignore disarankan)
- Nota generate `ANG-0001` incremental via `MAX(nota)` di `routers/pesanan.py:18`
- CORS `allow_origins=["*"]` untuk dev, ganti ke domain spesifik untuk production
