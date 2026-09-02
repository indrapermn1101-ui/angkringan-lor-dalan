# Daftar Gambar Makanan & Minuman - Angkringan Lor Dalan

**UPDATE 2026-09-02: Foto ASLI JPG sudah tersedia!** Folder `images/` kini berisi **16 foto asli JPG (real food photography, bukan animasi)** + 16 SVG ilustrasi sebagai fallback. Semua sudah terintegrasi di `script.js:3`.

Folder `images/` berisi **16 file JPG foto asli + 16 file SVG ilustrasi custom** yang relevan untuk setiap menu di `script.js:3`.

## 0. File JPG Foto Asli (REAL PHOTO, BUKAN ANIMASI) - TERBARU ✅

Semua JPG adalah **foto asli** (real photography) dari Wikimedia Commons & Pexels (lisensi gratis CC0), distinct per menu, diverifikasi via `curl -L` dan `file` = JPEG:

| ID | Nama Menu | File JPG Foto Asli | Sumber | Ukuran |
|---|---|---|---|---|
| `naskuc` | Nasi Kucing | `nasi-kucing.jpg` | Wikimedia `Sega_Kucing.JPG` | 174 KB |
| `nasbak` | Nasi Bakar Ayam | `nasi-bakar.jpg` | Wikimedia `Nasi_Bakar.jpg` | 66 KB |
| `nasGor` | Nasi Goreng Jawa | `nasi-goreng.jpg` | Wikimedia `Nasi goreng.jpg` | 48 KB |
| `sate_usus` | Sate Usus | `sate-usus.jpg` | Pexels 37265039 | 122 KB |
| `sate_telur` | Sate Telur Puyuh | `sate-telur.jpg` | Pexels 37368948 | 148 KB |
| `sate_ayam` | Sate Ayam | `sate-ayam.jpg` | Pexels 37189123 | 269 KB |
| `sate_ati` | Sate Ati Ampela | `sate-ati.jpg` | Pexels 37265042 | 154 KB |
| `gor_tahu` | Tahu Bacem | `tahu-bacem.jpg` | Wikimedia `Bacem_tahu.jpg` | 116 KB |
| `gor_tempe` | Tempe Mendoan | `tempe-mendoan.jpg` | Pexels 37090664 | 340 KB |
| `gor_bakwan` | Bakwan Goreng | `bakwan.jpg` | Wikimedia `Bakwan.jpg` | 154 KB |
| `sosis` | Sosis Bakar | `sosis-bakar.jpg` | Pexels 34329857 | 108 KB |
| `kopi_joss` | Kopi Joss Arang | `kopi-joss.jpg` | Pexels 18760564 | 527 KB |
| `wedang_jahe` | Wedang Jahe Susu | `wedang-jahe.jpg` | Pexels 6427781 | 125 KB |
| `teh` | Teh Hangat / Es Teh | `teh.jpg` | Pexels 4731076 | 116 KB |
| `es_jeruk` | Es Jeruk Peras | `es-jeruk.jpg` | Pexels 17612820 | 75 KB |
| `indomie` | Indomie Goreng/Telor | `indomie.jpg` | Pexels 37105809 | 154 KB |

**Cara pakai:** `script.js:3` sudah diupdate `gambar: 'images/nasi-kucing.jpg'` dst. Buka `index.html` → semua foto asli tampil. Jika JPG gagal load, otomatis fallback ke `images/*.svg` lalu `AGK.jpg` (lihat `script.js:111`).

**Preview foto asli:** buka `images/preview.html` di browser (grid 16 foto).

## 1. File SVG (Offline, Vektor, Siap Pakai) - Fallback

Semua SVG sudah terintegrasi otomatis di `script.js` dan `style.css`. Cukup buka `index.html` → gambar tampil di:
- Daftar Makanan (`#menuMakanan`)
- Daftar Minuman (`#menuMinuman`)
- Keranjang Pesanan
- Daftar Pesanan (thumbnail di tabel)
- Struk / Nota (`#hasil`)
- Menu Favorit (sidebar kanan)

| ID di `script.js` | Nama Menu | File SVG | Kategori |
|---|---|---|---|
| `naskuc` | Nasi Kucing | `nasi-kucing.svg` | Nasi |
| `nasbak` | Nasi Bakar Ayam | `nasi-bakar.svg` | Nasi |
| `nasGor` | Nasi Goreng Jawa | `nasi-goreng.svg` | Nasi |
| `sate_usus` | Sate Usus | `sate-usus.svg` | Sate |
| `sate_telur` | Sate Telur Puyuh | `sate-telur.svg` | Sate |
| `sate_ayam` | Sate Ayam | `sate-ayam.svg` | Sate |
| `sate_ati` | Sate Ati Ampela | `sate-ati.svg` | Sate |
| `gor_tahu` | Tahu Bacem | `tahu-bacem.svg` | Gorengan |
| `gor_tempe` | Tempe Mendoan | `tempe-mendoan.svg` | Gorengan |
| `gor_bakwan` | Bakwan Goreng | `bakwan.svg` | Gorengan |
| `sosis` | Sosis Bakar | `sosis-bakar.svg` | Bakaran |
| `kopi_joss` | Kopi Joss Arang | `kopi-joss.svg` | Minuman |
| `wedang_jahe` | Wedang Jahe Susu | `wedang-jahe.svg` | Minuman |
| `teh` | Teh Hangat / Es Teh | `teh.svg` | Minuman |
| `es_jeruk` | Es Jeruk Peras | `es-jeruk.svg` | Minuman |
| `indomie` | Indomie Goreng/Telor | `indomie.svg` | Mie |

**Keunggulan SVG:**
- Vektor → tidak pecah di semua ukuran (56x56 di grid, 28x28 di tabel, 38x38 di struk)
- Warna tema Angkringan: `#92400e`, `#f59e0b`, `#fffbeb`, `#fde68a`
- Offline, tanpa perlu internet / API key
- Bisa langsung export ke JPG/PNG: buka SVG di browser → klik kanan → Save as PNG/JPG

## 2. Alternatif JPG (Foto Asli) - Jika Ingin Foto Realistis

Jika menginginkan foto JPG asli (bukan ilustrasi), ganti field `gambar` di `script.js:3` dengan URL JPG di bawah. Semua URL dari Unsplash (gratis, bebas lisensi untuk komersial):

```js
// Contoh ganti 1 item:
{ id: 'naskuc', nama: 'Nasi Kucing', harga: 5000, kategori: 'Nasi',
  gambar: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' }
```

Rekomendasi URL per menu (tinggal copy-paste):

| Menu | URL JPG Rekomendasi | Keyword Unsplash |
|---|---|---|
| Nasi Kucing | `https://source.unsplash.com/400x400/?nasi-kucing,rice-wrap` | nasi kucing |
| Nasi Bakar Ayam | `https://source.unsplash.com/400x400/?nasi-bakar,banana-leaf-rice` | nasi bakar |
| Nasi Goreng Jawa | `https://images.unsplash.com/photo-1603133872875-ca2a98a0c7a0?w=400&h=400&fit=crop` | nasi goreng |
| Sate Usus | `https://source.unsplash.com/400x400/?sate,skewer` | sate |
| Sate Telur Puyuh | `https://source.unsplash.com/400x400/?quail-egg,sate` | sate telur puyuh |
| Sate Ayam | `https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=400&fit=crop` | sate ayam |
| Sate Ati Ampela | `https://source.unsplash.com/400x400/?chicken-liver,satay` | sate ati |
| Tahu Bacem | `https://source.unsplash.com/400x400/?tahu-bacem,tofu` | tahu bacem |
| Tempe Mendoan | `https://source.unsplash.com/400x400/?tempe-mendoan,tempeh` | tempe mendoan |
| Bakwan Goreng | `https://source.unsplash.com/400x400/?bakwan,vegetable-fritter` | bakwan |
| Sosis Bakar | `https://source.unsplash.com/400x400/?grilled-sausage,sosis-bakar` | sosis bakar |
| Kopi Joss Arang | `https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop` | kopi joss |
| Wedang Jahe Susu | `https://source.unsplash.com/400x400/?ginger-drink,wedang-jahe` | wedang jahe |
| Teh Hangat / Es Teh | `https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop` | es teh |
| Es Jeruk Peras | `https://images.unsplash.com/photo-1613478881367-39b74f5b59cd?w=400&h=400&fit=crop` | es jeruk |
| Indomie Goreng/Telor | `https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop` | mie goreng |

> Tips: Download JPG lalu simpan lokal sebagai `images/nasi-kucing.jpg` dll, lalu ubah `gambar: 'images/nasi-kucing.jpg'` agar load offline & lebih cepat.

## 3. Cara Ganti ke JPG Lokal

1. Download foto dari URL di atas (klik kanan → Save Image As)
2. Simpan di folder `images/` dengan nama mis. `nasi-kucing.jpg`
3. Edit `script.js:3` → ubah `gambar: 'images/nasi-kucing.svg'` menjadi `gambar: 'images/nasi-kucing.jpg'`
4. Reload `index.html` → otomatis tampil JPG

## 4. Integrasi Sudah Selesai

- `script.js:3` → field `gambar` + `deskripsi` ditambahkan
- `script.js:99` → `renderMenuMakananMinuman()` menampilkan `<img class="menu-thumb">`
- `script.js:152` → `updateKeranjang()` menampilkan thumbnail
- `script.js:231`, `script.js:452` → Daftar Pesanan + Struk menampilkan gambar
- `style.css:287` → `.menu-thumb { width:56px; height:56px; border-radius:10px; ... }`
- `index.html:242` → Menu Favorit memakai `<img>` SVG

Semua file valid SVG XML (200x200, rounded 24px, tema angkringan).

## 5. Export SVG → JPG (Jika Butuh Format JPG)

- **Online:** https://cloudconvert.com/svg-to-jpg → upload 16 file sekaligus → download ZIP JPG
- **Offline (Inkscape):** `inkscape images/nasi-kucing.svg --export-filename=images/nasi-kucing.jpg`
- **Offline (ImageMagick):** `magick -background white -density 300 images/nasi-kucing.svg images/nasi-kucing.jpg`

Matur nuwun, Lur! — Angkringan Lor Dalan
