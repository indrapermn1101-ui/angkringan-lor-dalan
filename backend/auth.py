from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models

# Konfigurasi JWT
SECRET_KEY = "angkringan-lor-dalan-super-secret-key-solopunya-2026-ganti-di-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 jam

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    # FIX: case-insensitive & trim agar Lana/LANA/lana semua bisa login sesuai register lana
    # Username disimpan lowercase saat register, login juga dicocokkan lower
    if username:
        username = username.strip()
    return db.query(models.User).filter(models.User.username.ilike(username)).first()

def authenticate_user(db: Session, username: str, password: str):
    if username:
        username = username.strip()
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    # Update last_login & last_active & is_online saat berhasil login
    user.last_login = datetime.utcnow()
    user.last_active = datetime.utcnow()
    user.is_online = True
    db.commit()
    return user

def update_last_active(db: Session, user: models.User):
    """Update last_active setiap request authenticated"""
    user.last_active = datetime.utcnow()
    user.is_online = True
    db.commit()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="User tidak aktif")
    # Update last_active setiap request
    current_user.last_active = datetime.utcnow()
    current_user.is_online = True
    db.commit()
    return current_user

async def get_current_superuser(current_user: models.User = Depends(get_current_active_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Butuh akses superadmin")
    return current_user

# === RBAC Helpers untuk Rule Admin/Kasir/Superadmin/Pelanggan ===
async def get_current_admin(current_user: models.User = Depends(get_current_active_user)):
    """Hanya admin atau superadmin (CRUD menu + sold)"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Hanya admin / superadmin (CRUD menu)")
    return current_user

async def get_current_kasir_or_above(current_user: models.User = Depends(get_current_active_user)):
    """Kasir, admin, superadmin boleh akses pesanan & pembayaran"""
    if current_user.role not in ["kasir", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Hanya kasir / admin / superadmin")
    return current_user

async def get_optional_user(token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)), db: Session = Depends(get_db)):
    """Untuk endpoint public yang boleh tanpa login tapi jika ada token akan di-parse (pelanggan)"""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = get_user_by_username(db, username=username)
        if user and user.is_active:
            # update last_active jika ada token valid
            try:
                user.last_active = datetime.utcnow()
                user.is_online = True
                db.commit()
            except:
                pass
            return user
        return None
    except JWTError:
        return None
