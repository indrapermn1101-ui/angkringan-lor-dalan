"""
Seed 16 menu ke SQLite.
Jalankan: python -m backend.seed   (dari folder PRAKTEK)
atau:     python backend/seed.py
"""
import sys
import os
# Pastikan bisa import backend saat run dari PRAKTEK/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, engine, Base
from backend.models import Menu, User
from backend.auth import get_password_hash

# Data menu sama dengan DAFTAR_MENU di static/js/script.js:3 (rapi: static/images/)
DAFTAR_MENU = [
    { "id": "naskuc", "nama": "Nasi Kucing", "harga": 5000, "kategori": "Nasi", "gambar": "static/images/nasi-kucing.jpg", "deskripsi": "Nasi porsi kucing sambal teri pedas" },
    { "id": "nasbak", "nama": "Nasi Bakar Ayam", "harga": 15000, "kategori": "Nasi", "gambar": "static/images/nasi-bakar.jpg", "deskripsi": "Nasi bakar daun pisang isi ayam suwir" },
    { "id": "nasGor", "nama": "Nasi Goreng Jawa", "harga": 14000, "kategori": "Nasi", "gambar": "static/images/nasi-goreng.jpg", "deskripsi": "Nasi goreng jawa + telur + kerupuk" },
    { "id": "sate_usus", "nama": "Sate Usus", "harga": 3500, "kategori": "Sate", "gambar": "static/images/sate-usus.jpg", "deskripsi": "Sate usus ayam bumbu kecap" },
    { "id": "sate_telur", "nama": "Sate Telur Puyuh", "harga": 4000, "kategori": "Sate", "gambar": "static/images/sate-telur.jpg", "deskripsi": "Sate telur puyuh bacem manis" },
    { "id": "sate_ayam", "nama": "Sate Ayam", "harga": 5000, "kategori": "Sate", "gambar": "static/images/sate-ayam.jpg", "deskripsi": "Sate ayam bumbu kacang pedas" },
    { "id": "sate_ati", "nama": "Sate Ati Ampela", "harga": 4500, "kategori": "Sate", "gambar": "static/images/sate-ati.jpg", "deskripsi": "Sate ati ampela bumbu kuning" },
    { "id": "gor_tahu", "nama": "Tahu Bacem", "harga": 2000, "kategori": "Gorengan", "gambar": "static/images/tahu-bacem.jpg", "deskripsi": "Tahu bacem manis gurih" },
    { "id": "gor_tempe", "nama": "Tempe Mendoan", "harga": 2000, "kategori": "Gorengan", "gambar": "static/images/tempe-mendoan.jpg", "deskripsi": "Tempe mendoan anget" },
    { "id": "gor_bakwan", "nama": "Bakwan Goreng", "harga": 2000, "kategori": "Gorengan", "gambar": "static/images/bakwan.jpg", "deskripsi": "Bakwan sayur renyah" },
    { "id": "sosis", "nama": "Sosis Bakar", "harga": 6000, "kategori": "Bakaran", "gambar": "static/images/sosis-bakar.jpg", "deskripsi": "Sosis bakar pedas manis" },
    { "id": "kopi_joss", "nama": "Kopi Joss Arang", "harga": 8000, "kategori": "Minuman", "gambar": "static/images/kopi-joss.jpg", "deskripsi": "Kopi khas Jogja + arang membara" },
    { "id": "wedang_jahe", "nama": "Wedang Jahe Susu", "harga": 8000, "kategori": "Minuman", "gambar": "static/images/wedang-jahe.jpg", "deskripsi": "Wedang jahe susu hangat" },
    { "id": "teh", "nama": "Teh Hangat / Es Teh", "harga": 5000, "kategori": "Minuman", "gambar": "static/images/teh.jpg", "deskripsi": "Teh tubruk / es teh manis" },
    { "id": "es_jeruk", "nama": "Es Jeruk Peras", "harga": 7000, "kategori": "Minuman", "gambar": "static/images/es-jeruk.jpg", "deskripsi": "Es jeruk peras segar" },
    { "id": "indomie", "nama": "Indomie Goreng/Telor", "harga": 13000, "kategori": "Mie", "gambar": "static/images/indomie.jpg", "deskripsi": "Indomie goreng + telur" },
]

def seed():
    # Buat tabel
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Cek sudah ada?
        existing = db.query(Menu).count()
        if existing > 0:
            print(f"Sudah ada {existing} menu, update jika ada perubahan path/gambar.")
            updated = 0
            for m in DAFTAR_MENU:
                found = db.query(Menu).filter(Menu.id == m["id"]).first()
                if not found:
                    db.add(Menu(**m))
                    print(f"  + Tambah {m['id']} {m['nama']}")
                    updated += 1
                else:
                    # Update gambar jika masih pakai path lama images/ -> static/images/
                    if found.gambar != m["gambar"] or found.harga != m["harga"] or found.nama != m["nama"]:
                        found.gambar = m["gambar"]
                        found.nama = m["nama"]
                        found.harga = m["harga"]
                        found.kategori = m["kategori"]
                        found.deskripsi = m["deskripsi"]
                        print(f"  ~ Update {m['id']} gambar/harga")
                        updated += 1
            db.commit()
            if updated == 0:
                print("Seed update selesai. Tidak ada perubahan.")
            else:
                print(f"Seed update selesai. {updated} perubahan.")
            # Pastikan superadmin ada meski menu sudah ada
            seed_superadmin(db)
            return

        for m in DAFTAR_MENU:
            db.add(Menu(**m))
        db.commit()
        print(f"Berhasil seed {len(DAFTAR_MENU)} menu ke SQLite.")
        for m in DAFTAR_MENU:
            print(f"  - {m['id']:12} {m['nama']:20} Rp {m['harga']}")

        # Seed default superadmin
        seed_superadmin(db)

    finally:
        db.close()

def seed_superadmin(db):
    """Buat default superadmin jika belum ada"""
    username = "superadmin"
    password = "Solojogja1"
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        # Update password & role jika perlu
        from backend.auth import verify_password
        need_update = False
        if not verify_password(password, existing.hashed_password):
            existing.hashed_password = get_password_hash(password)
            need_update = True
        if not existing.is_superuser or not existing.is_active or existing.role != "superadmin" or not existing.is_approved:
            existing.is_superuser = True
            existing.is_active = True
            existing.is_approved = True
            existing.role = "superadmin"
            need_update = True
        if need_update:
            db.commit()
            print(f"  ~ Update superadmin -> superadmin/Solojogja1 role=superadmin")
        else:
            print(f"Superadmin sudah ada: {username} / Solojogja1 (role={existing.role})")
        # Pastikan alias admin juga ada & update
        admin = db.query(User).filter(User.username == "admin").first()
        if admin and (admin.role != "superadmin" or not admin.is_active):
            admin.role = "superadmin"
            admin.is_active = True
            admin.is_approved = True
            admin.is_superuser = True
            if not verify_password(password, admin.hashed_password):
                admin.hashed_password = get_password_hash(password)
            db.commit()
            print(f"  ~ Update alias admin -> superadmin role")
        return
    # Buat baru
    superadmin = User(
        username=username,
        email="superadmin@angkringan-lor-dalan.local",
        full_name="Super Admin Lor Dalan",
        hashed_password=get_password_hash(password),
        role="superadmin",
        is_active=True,
        is_approved=True,
        is_superuser=True
    )
    db.add(superadmin)
    # Juga buat alias 'admin' untuk kemudahan
    admin_alias = User(
        username="admin",
        email="admin@angkringan-lor-dalan.local",
        full_name="Admin Lor Dalan",
        hashed_password=get_password_hash(password),
        role="superadmin",
        is_active=True,
        is_approved=True,
        is_superuser=True
    )
    if not db.query(User).filter(User.username == "admin").first():
        db.add(admin_alias)
    db.commit()
    print(f"[OK] Default superadmin dibuat:")
    print(f"   - Username: superadmin (alias: admin)")
    print(f"   - Password: Solojogja1")
    print(f"   - Role: superadmin (bisa approve kasir/admin)")
    print(f"   - Login: POST /api/auth/login (form-data) atau /api/auth/login-json (JSON)")

if __name__ == "__main__":
    seed()
