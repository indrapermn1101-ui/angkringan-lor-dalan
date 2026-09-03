from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user, get_current_admin, get_optional_user
from typing import List, Optional

router = APIRouter(prefix="/api/menu", tags=["Menu"])

# ---- PUBLIC: Pelanggan tanpa login boleh lihat menu (RULE Pelanggan) ----
@router.get("/", response_model=List[schemas.MenuOut])
def list_menu(kategori: Optional[str] = None, q: Optional[str] = None, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(get_optional_user)):
    # Pelanggan public tetap lihat hanya is_active=True (termasuk yang SOLD tapi tetap terlihat dengan label)
    query = db.query(models.Menu).filter(models.Menu.is_active == True)
    if kategori:
        query = query.filter(models.Menu.kategori == kategori)
    if q:
        query = query.filter(models.Menu.nama.ilike(f"%{q}%"))
    return query.all()

@router.get("/{menu_id}", response_model=schemas.MenuOut)
def get_menu(menu_id: str, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(get_optional_user)):
    menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    return menu

# ---- ADMIN/SUPERADMIN ONLY: CRUD Menu (RULE Admin) ----
@router.post("/", response_model=schemas.MenuOut, status_code=201)
def create_menu(menu: schemas.MenuCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    existing = db.query(models.Menu).filter(models.Menu.id == menu.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="ID menu sudah ada")
    db_menu = models.Menu(**menu.model_dump())
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    return db_menu

@router.put("/{menu_id}", response_model=schemas.MenuOut)
def update_menu(menu_id: str, payload: schemas.MenuUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(menu, key, value)
    db.commit()
    db.refresh(menu)
    return menu

@router.delete("/{menu_id}")
def delete_menu(menu_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    # soft delete
    menu.is_active = False
    db.commit()
    return {"message": "Menu dinonaktifkan"}

# ---- ADMIN: Label SOLD/HABIS (RULE Admin - jika makanan/minuman habis) ----
@router.patch("/{menu_id}/sold", response_model=schemas.MenuOut)
def toggle_sold(menu_id: str, payload: schemas.MenuSoldUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    menu.is_sold = payload.is_sold
    db.commit()
    db.refresh(menu)
    return menu
