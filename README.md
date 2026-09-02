# Angkringan Lor Dalan - Sistem Pemesanan

Warung Makan Tradisional - Sambi Gedong, Tawengan, Sambi, Boyolali - Buka 17.00-02.00 WIB

Frontend: `index.html` + `style.css` + `script.js` (vanilla JS)  
Backend: FastAPI + SQLite (`backend/`) — migrasi dari LocalStorage

## Quick Start

### Mode Offline (tanpa backend, tetap jalan)
Double-click `index.html` atau Live Server VS Code. Data simpan di LocalStorage browser.

### Mode Online (FastAPI + SQLite, rekomendasi)
```bash
pip install -r backend/requirements.txt
python -m backend.seed
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Buka http://127.0.0.1:8000/  (frontend via FastAPI) atau http://127.0.0.1:8000/docs (Swagger)

Frontend otomatis deteksi API: jika `http://127.0.0.1:8000/api/health` OK → pakai SQLite, jika offline → fallback LocalStorage.

## Fitur

- 16 Menu (11 Makanan + 5 Minuman) dengan foto asli JPG `images/*.jpg` + SVG fallback
- Keranjang +/- , auto-sync draft, kalkulasi total
- Form pelanggan, metode bayar (Tunai/QRIS/Transfer/Bon), status (Antri/Proses/Siap/Lunas)
- Daftar Pesanan tabel + filter, Pembayaran rangkuman omzet, Stat, Struk cetak
- Jam live WIB, responsive sidebar

## Struktur

```
PRAKTEK/
  index.html
  script.js        # Frontend logic + FastAPI fetch (API_AVAILABLE)
  style.css
  AGK.jpg, logo.jpg
  images/          # 16 JPG foto asli + 16 SVG + preview.html
  backend/
    main.py
    database.py    # sqlite:///./backend/angkringan.db
    models.py      # Menu, Pesanan, PesananItem
    schemas.py
    routers/menu.py, pesanan.py, pembayaran.py
    seed.py
    angkringan.db  # SQLite (auto-create)
    requirements.txt
  REQUIREMENTS.txt # Dokumentasi requirements sistem
  REKRUTMEN.txt    # Dokumentasi rekrutmen karyawan (HR)
  README.md        # Ini
```

## API

Lihat `backend/README.md` untuk 14 routes lengkap. Ringkas:

- `GET /api/menu/` , `GET /api/pesanan/` , `POST /api/pesanan/` , `PATCH /api/pesanan/{nota}/lunas` , `DELETE /api/pesanan/{nota}` , `GET /api/stat` , `GET /api/pembayaran/rangkuman`

## Lisensi Gambar

Foto asli JPG dari Wikimedia Commons & Pexels (CC0, gratis komersial). SVG ilustrasi custom.

---
Matur Nuwun, Lur! — Hangat - Merakyat - Ngangeni
