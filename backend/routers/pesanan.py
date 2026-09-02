from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user

router = APIRouter(prefix="/api/pesanan", tags=["Pesanan"])

def format_rupiah(num: int) -> str:
    return "Rp " + f"{num:,}".replace(",", ".")

def generate_nota(db: Session) -> str:
    # Ambil nota terakhir, parse angka
    last = db.query(models.Pesanan).order_by(models.Pesanan.nota.desc()).first()
    if not last:
        return "ANG-0001"
    try:
        num = int(last.nota.split("-")[1])
        return f"ANG-{num+1:04d}"
    except:
        count = db.query(models.Pesanan).count() + 1
        return f"ANG-{count:04d}"

def pesanan_to_out(pesanan: models.Pesanan) -> schemas.PesananOut:
    total_fmt = format_rupiah(pesanan.total)
    items_out = []
    for it in pesanan.items:
        items_out.append(schemas.PesananItemOut(
            id=it.id,
            nota=it.nota,
            menu_id=it.menu_id,
            nama=it.nama,
            harga=it.harga,
            qty=it.qty,
            subtotal=it.subtotal,
            kategori=it.kategori,
            gambar=it.gambar
        ))
    return schemas.PesananOut(
        nota=pesanan.nota,
        nama=pesanan.nama,
        meja=pesanan.meja,
        wa=pesanan.wa,
        jml_orang=pesanan.jml_orang,
        total=pesanan.total,
        totalFormatted=total_fmt,
        pembayaran=pesanan.pembayaran,
        status=pesanan.status,
        tanggal=pesanan.tanggal,
        jam=pesanan.jam,
        catatan=pesanan.catatan,
        waktu_simpan=pesanan.waktu_simpan,
        items=items_out
    )

@router.get("/", response_model=List[schemas.PesananOut])
def list_pesanan(
    q: Optional[str] = Query(None, description="Cari nama/meja/nota/menu"),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.Pesanan).order_by(models.Pesanan.waktu_simpan.desc())
    if status:
        query = query.filter(models.Pesanan.status.ilike(f"%{status}%"))
    if q:
        q_lower = f"%{q.lower()}%"
        # filter via python for items.nama, or via join
        # Simple: filter Pesanan where nama/meja/nota ilike, plus join items
        query = query.outerjoin(models.PesananItem).filter(
            (func.lower(models.Pesanan.nama).like(q_lower)) |
            (func.lower(models.Pesanan.meja).like(q_lower)) |
            (func.lower(models.Pesanan.nota).like(q_lower)) |
            (func.lower(models.PesananItem.nama).like(q_lower))
        ).distinct()
    pesanan_list = query.offset(skip).limit(limit).all()
    return [pesanan_to_out(p) for p in pesanan_list]

@router.get("/{nota}", response_model=schemas.PesananOut)
def get_pesanan(nota: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    pesanan = db.query(models.Pesanan).filter(models.Pesanan.nota == nota).first()
    if not pesanan:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return pesanan_to_out(pesanan)

@router.post("/", response_model=schemas.PesananOut, status_code=201)
def create_pesanan(payload: schemas.PesananCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if not payload.nama or not payload.meja:
        raise HTTPException(status_code=400, detail="Nama dan Meja wajib diisi")
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(status_code=400, detail="Minimal 1 menu wajib dipilih")

    # Validasi menu & hitung total
    total = 0
    items_data = []
    for it in payload.items:
        menu = db.query(models.Menu).filter(models.Menu.id == it.menu_id).first()
        if not menu:
            raise HTTPException(status_code=404, detail=f"Menu {it.menu_id} tidak ditemukan")
        if it.qty <= 0:
            raise HTTPException(status_code=400, detail="Qty harus >0")
        subtotal = menu.harga * it.qty
        total += subtotal
        items_data.append({
            "menu_id": menu.id,
            "nama": menu.nama,
            "harga": menu.harga,
            "qty": it.qty,
            "subtotal": subtotal,
            "kategori": menu.kategori,
            "gambar": menu.gambar
        })

    nota = generate_nota(db)
    tanggal = payload.tanggal or date.today()
    jam = payload.jam or datetime.now().strftime("%H:%M")

    db_pesanan = models.Pesanan(
        nota=nota,
        nama=payload.nama,
        meja=payload.meja,
        wa=payload.wa or "-",
        jml_orang=payload.jml_orang or "1 Orang",
        total=total,
        pembayaran=payload.pembayaran or "Tunai (Cash)",
        status=payload.status or "Antri",
        tanggal=tanggal,
        jam=jam,
        catatan=payload.catatan or "-",
        waktu_simpan=datetime.utcnow()
    )
    db.add(db_pesanan)
    db.flush()  # untuk FK

    for item in items_data:
        db_item = models.PesananItem(
            nota=nota,
            menu_id=item["menu_id"],
            nama=item["nama"],
            harga=item["harga"],
            qty=item["qty"],
            subtotal=item["subtotal"],
            kategori=item["kategori"],
            gambar=item["gambar"]
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_pesanan)
    # reload items
    pesanan = db.query(models.Pesanan).filter(models.Pesanan.nota == nota).first()
    return pesanan_to_out(pesanan)

@router.patch("/{nota}/status", response_model=schemas.PesananOut)
def update_status(nota: str, payload: schemas.StatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    pesanan = db.query(models.Pesanan).filter(models.Pesanan.nota == nota).first()
    if not pesanan:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    pesanan.status = payload.status
    db.commit()
    db.refresh(pesanan)
    return pesanan_to_out(pesanan)

@router.patch("/{nota}/lunas", response_model=schemas.PesananOut)
def tandai_lunas(nota: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    pesanan = db.query(models.Pesanan).filter(models.Pesanan.nota == nota).first()
    if not pesanan:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    pesanan.status = "Selesai / Lunas"
    db.commit()
    db.refresh(pesanan)
    return pesanan_to_out(pesanan)

@router.patch("/{nota}", response_model=schemas.PesananOut)
def update_pesanan(nota: str, payload: schemas.PesananUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    pesanan = db.query(models.Pesanan).filter(models.Pesanan.nota == nota).first()
    if not pesanan:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pesanan, key, value)
    db.commit()
    db.refresh(pesanan)
    return pesanan_to_out(pesanan)

@router.delete("/{nota}")
def delete_pesanan(nota: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    pesanan = db.query(models.Pesanan).filter(models.Pesanan.nota == nota).first()
    if not pesanan:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    db.delete(pesanan)
    db.commit()
    return {"message": f"Pesanan {nota} dihapus"}

@router.delete("/")
def delete_all_pesanan(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    count = db.query(models.Pesanan).count()
    if count == 0:
        raise HTTPException(status_code=404, detail="Belum ada data pesanan")
    db.query(models.PesananItem).delete()
    db.query(models.Pesanan).delete()
    db.commit()
    return {"message": f"Semua {count} pesanan dihapus"}
