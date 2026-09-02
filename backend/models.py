from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)  # superadmin
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="kasir", nullable=False)  # kasir, admin, superadmin
    is_active = Column(Boolean, default=True)  # False = pending approval
    is_superuser = Column(Boolean, default=False)  # True hanya untuk superadmin
    is_approved = Column(Boolean, default=True)  # Untuk flow register butuh approval
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    last_active = Column(DateTime, nullable=True)  # Untuk online/offline
    is_online = Column(Boolean, default=False)  # Flag online (diupdate via heartbeat)

class Menu(Base):
    __tablename__ = "menu"

    id = Column(String, primary_key=True, index=True)  # naskuc, sate_ayam etc.
    nama = Column(String, nullable=False)
    harga = Column(Integer, nullable=False)
    kategori = Column(String, nullable=False, index=True)
    gambar = Column(String, nullable=False)
    deskripsi = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Pesanan(Base):
    __tablename__ = "pesanan"

    nota = Column(String, primary_key=True, index=True)  # ANG-0001
    nama = Column(String, nullable=False)
    meja = Column(String, nullable=False)
    wa = Column(String, default="-")
    jml_orang = Column(String, default="1 Orang")
    total = Column(Integer, nullable=False, default=0)
    pembayaran = Column(String, nullable=False, default="Tunai (Cash)")
    status = Column(String, nullable=False, default="Antri", index=True)
    tanggal = Column(Date, nullable=False, index=True)
    jam = Column(String, nullable=False)  # HH:MM
    catatan = Column(String, default="-")
    waktu_simpan = Column(DateTime, default=datetime.utcnow)

    items = relationship("PesananItem", back_populates="pesanan", cascade="all, delete-orphan")

class PesananItem(Base):
    __tablename__ = "pesanan_item"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nota = Column(String, ForeignKey("pesanan.nota", ondelete="CASCADE"), nullable=False, index=True)
    menu_id = Column(String, ForeignKey("menu.id"), nullable=False)
    nama = Column(String, nullable=False)
    harga = Column(Integer, nullable=False)
    qty = Column(Integer, nullable=False)
    subtotal = Column(Integer, nullable=False)
    kategori = Column(String, nullable=True)
    gambar = Column(String, nullable=True)

    pesanan = relationship("Pesanan", back_populates="items")
    menu = relationship("Menu")
