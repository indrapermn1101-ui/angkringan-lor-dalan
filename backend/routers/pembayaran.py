from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user, get_current_kasir_or_above

router = APIRouter(prefix="/api", tags=["Pembayaran & Statistik"])

def format_rupiah(num: int) -> str:
    return "Rp " + f"{num:,}".replace(",", ".")

@router.get("/pembayaran/rangkuman", response_model=schemas.PembayaranRangkuman)
def rangkuman_pembayaran(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_kasir_or_above)):
    pesanan_all = db.query(models.Pesanan).all()
    total = len(pesanan_all)
    omzet = sum(p.total for p in pesanan_all) if pesanan_all else 0

    lunas_list = [p for p in pesanan_all if "selesai" in p.status.lower() or "lunas" in p.status.lower()]
    belum_list = [p for p in pesanan_all if "selesai" not in p.status.lower() and "lunas" not in p.status.lower()]

    lunas_omzet = sum(p.total for p in lunas_list)
    belum_omzet = sum(p.total for p in belum_list)

    def stat_metode(keyword: str):
        filtered = [p for p in pesanan_all if keyword.lower() in p.pembayaran.lower()]
        s = sum(p.total for p in filtered)
        return {"count": len(filtered), "sum": s, "formatted": f"{format_rupiah(s)} ({len(filtered)})"}

    per_metode = {
        "tunai": stat_metode("tunai"),
        "qris": stat_metode("qris"),
        "transfer": stat_metode("transfer"),
        "bon": stat_metode("bon"),
    }

    return {
        "total_transaksi": total,
        "total_omzet": omzet,
        "total_omzet_formatted": format_rupiah(omzet),
        "lunas_count": len(lunas_list),
        "lunas_omzet": lunas_omzet,
        "lunas_formatted": format_rupiah(lunas_omzet),
        "belum_count": len(belum_list),
        "belum_omzet": belum_omzet,
        "belum_formatted": format_rupiah(belum_omzet),
        "per_metode": per_metode
    }

@router.get("/stat", response_model=schemas.StatOut)
def get_stat(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_kasir_or_above)):
    total = db.query(models.Pesanan).count()
    antri = db.query(models.Pesanan).filter(
        (models.Pesanan.status == "Antri") | (models.Pesanan.status == "Proses Masak")
    ).count()
    omzet = db.query(func.coalesce(func.sum(models.Pesanan.total), 0)).scalar() or 0
    # exclude Batal if ada
    omzet_batal = db.query(func.coalesce(func.sum(models.Pesanan.total), 0)).filter(models.Pesanan.status != "Batal").scalar() or 0
    # use total omzet (non-batal) sama seperti frontend: filter status !== Batal
    # jika tidak ada Batal, sama dengan omzet
    total_omzet = omzet_batal if db.query(models.Pesanan).filter(models.Pesanan.status == "Batal").count() > 0 else omzet
    return {
        "totalData": total,
        "totalAntri": antri,
        "totalOmzet": total_omzet,
        "totalOmzetFormatted": format_rupiah(total_omzet)
    }
