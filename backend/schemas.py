from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# ---- Menu ----
class MenuBase(BaseModel):
    id: str
    nama: str
    harga: int
    kategori: str
    gambar: str
    deskripsi: Optional[str] = None

class MenuCreate(MenuBase):
    pass

class MenuOut(MenuBase):
    is_active: bool = True
    class Config:
        from_attributes = True

# ---- Pesanan Item ----
class PesananItemBase(BaseModel):
    menu_id: str
    qty: int

class PesananItemCreate(PesananItemBase):
    pass

class PesananItemOut(BaseModel):
    id: int
    nota: str
    menu_id: str
    nama: str
    harga: int
    qty: int
    subtotal: int
    kategori: Optional[str] = None
    gambar: Optional[str] = None
    class Config:
        from_attributes = True

# ---- Pesanan ----
class PesananCreate(BaseModel):
    nama: str
    meja: str
    wa: Optional[str] = "-"
    jml_orang: Optional[str] = "1 Orang"
    pembayaran: Optional[str] = "Tunai (Cash)"
    status: Optional[str] = "Antri"
    tanggal: Optional[date] = None
    jam: Optional[str] = None
    catatan: Optional[str] = "-"
    items: List[PesananItemCreate]

class PesananUpdate(BaseModel):
    nama: Optional[str] = None
    meja: Optional[str] = None
    wa: Optional[str] = None
    jml_orang: Optional[str] = None
    pembayaran: Optional[str] = None
    status: Optional[str] = None
    tanggal: Optional[date] = None
    jam: Optional[str] = None
    catatan: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class PesananOut(BaseModel):
    nota: str
    nama: str
    meja: str
    wa: str
    jml_orang: str
    total: int
    totalFormatted: Optional[str] = None
    pembayaran: str
    status: str
    tanggal: date
    jam: str
    catatan: str
    waktu_simpan: datetime
    items: List[PesananItemOut] = []

    class Config:
        from_attributes = True

# ---- Pembayaran Rangkuman ----
class MetodeStat(BaseModel):
    count: int
    sum: int
    formatted: str

class PembayaranRangkuman(BaseModel):
    total_transaksi: int
    total_omzet: int
    total_omzet_formatted: str
    lunas_count: int
    lunas_omzet: int
    lunas_formatted: str
    belum_count: int
    belum_omzet: int
    belum_formatted: str
    per_metode: dict

class StatOut(BaseModel):
    totalData: int
    totalAntri: int
    totalOmzet: int
    totalOmzetFormatted: str

# ---- User & Auth ----
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = "kasir"  # kasir, admin, superadmin

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "kasir"

class UserRegisterPublic(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: str
    role: str  # kasir atau admin saja

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    is_superuser: bool
    is_approved: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    last_active: Optional[datetime] = None
    is_online: Optional[bool] = False
    class Config:
        from_attributes = True

class UserPendingOut(UserBase):
    id: int
    role: str
    is_active: bool
    is_approved: bool
    created_at: datetime
    class Config:
        from_attributes = True

class UserOnlineOut(UserBase):
    id: int
    role: str
    is_active: bool
    is_superuser: bool
    is_approved: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    last_active: Optional[datetime] = None
    is_online: bool
    online_status: str  # online, offline, idle
    last_seen_text: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
