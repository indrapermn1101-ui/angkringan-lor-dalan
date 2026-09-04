from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from ..database import get_db
from .. import models, schemas
from ..auth import authenticate_user, create_access_token, get_current_active_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login superadmin/kasir/admin.
    - superadmin: superadmin / Solojogja1
    - kasir/admin: harus sudah disetujui superadmin
    """
    # Cek user exists dulu untuk pesan pending
    from ..auth import get_user_by_username, verify_password
    user_check = get_user_by_username(db, form_data.username)
    if user_check and not user_check.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda belum disetujui superadmin. Hubungi superadmin untuk approval.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-json", response_model=schemas.Token)
def login_json(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Login via JSON: {"username":"superadmin","password":"Solojogja1"}
    """
    from ..auth import get_user_by_username
    user_check = get_user_by_username(db, payload.username)
    if user_check and not user_check.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda belum disetujui superadmin. Hubungi superadmin untuk approval.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register-public", response_model=schemas.UserOut, status_code=201)
def register_public(payload: schemas.UserRegisterPublic, db: Session = Depends(get_db)):
    """
    Registrasi publik untuk kasir/admin.
    Tidak butuh login. Akun dibuat dengan is_active=False (pending) dan harus disetujui superadmin.
    Role hanya boleh 'kasir' atau 'admin'.
    """
    if payload.role not in ["kasir", "admin"]:
        raise HTTPException(status_code=400, detail="Role hanya boleh 'kasir' atau 'admin'")
    # Normalisasi username: trim + lower agar login case-insensitive (fix Lana/lana)
    payload.username = payload.username.strip()
    if len(payload.username) < 3:
        raise HTTPException(status_code=400, detail="Username minimal 3 karakter")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")
    existing = db.query(models.User).filter(models.User.username.ilike(payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah ada")
    if payload.email:
        existing_email = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email sudah ada")
    new_user = models.User(
        username=payload.username.strip().lower(),  # simpan lower agar konsisten dengan login
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=False,
        is_approved=False,
        is_superuser=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/pending", response_model=list[schemas.UserOut])
def list_pending(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List akun pending (is_active=False) - hanya superadmin"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Hanya superadmin bisa lihat pending")
    return db.query(models.User).filter(models.User.is_active == False).all()

@router.post("/approve/{user_id}", response_model=schemas.UserOut)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Setujui akun pending - hanya superadmin"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Hanya superadmin bisa approve")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.is_active:
        raise HTTPException(status_code=400, detail="User sudah aktif")
    user.is_active = True
    user.is_approved = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/reject/{user_id}")
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Tolak/hapus akun pending - hanya superadmin"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Hanya superadmin bisa reject")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="Tidak bisa hapus superadmin")
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} ditolak & dihapus"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@router.post("/register", response_model=schemas.UserOut)
def register(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Hanya superadmin yang bisa buat user baru langsung aktif.
    Butuh header: Authorization: Bearer <token>
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Hanya superadmin bisa buat user baru")
    if payload.role not in ["kasir", "admin"]:
        raise HTTPException(status_code=400, detail="Role hanya boleh 'kasir' atau 'admin'")
    existing = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah ada")
    new_user = models.User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
        is_approved=True,
        is_superuser=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Hanya superadmin")
    return db.query(models.User).all()

@router.post("/heartbeat")
def heartbeat(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update last_active untuk menandai online - dipanggil setiap 30 detik dari frontend"""
    current_user.last_active = datetime.utcnow()
    current_user.is_online = True
    db.commit()
    return {"status": "ok", "last_active": current_user.last_active}

@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Set offline saat logout"""
    current_user.is_online = False
    db.commit()
    return {"message": f"User {current_user.username} offline"}

@router.get("/active", response_model=list[schemas.UserOnlineOut])
def list_active_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List semua akun aktif (kasir/admin/superadmin) dengan status online/offline - hanya superadmin"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Hanya superadmin bisa lihat status online")
    users = db.query(models.User).filter(models.User.is_active == True).all()
    now = datetime.utcnow()
    result = []
    for u in users:
        # Hitung online: hanya jika akses dashboard dalam 90 detik terakhir
        # Heartbeat dikirim tiap 15 detik dari index.html, jadi jika tidak di dashboard -> offline
        is_online = False
        online_status = "offline"
        last_seen_text = "belum pernah aktif"
        if u.last_active:
            delta = (now - u.last_active).total_seconds()
            if delta < 90:  # 90 detik = online (heartbeat 15 detik)
                is_online = True
                online_status = "online"
                last_seen_text = "online"
            elif delta < 300:  # 90 detik - 5 menit = idle
                is_online = False
                online_status = "idle"
                last_seen_text = f"{int(delta//60)} menit lalu"
            elif delta < 3600:
                is_online = False
                online_status = "offline"
                last_seen_text = f"{int(delta//60)} menit lalu"
            else:
                is_online = False
                online_status = "offline"
                last_seen_text = f"{int(delta//3600)} jam lalu"
            # Jika user logout (is_online=False) paksa offline
            if not u.is_online:
                is_online = False
                online_status = "offline"
                if delta < 90:
                    last_seen_text = "baru logout"
        else:
            # Jika belum pernah aktif, cek last_login
            if u.last_login:
                delta = (now - u.last_login).total_seconds()
                last_seen_text = f"login {int(delta//60)} menit lalu"
            is_online = False
            online_status = "offline"

        result.append(schemas.UserOnlineOut(
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            id=u.id,
            is_active=u.is_active,
            is_superuser=u.is_superuser,
            is_approved=u.is_approved,
            created_at=u.created_at,
            last_login=u.last_login,
            last_active=u.last_active,
            is_online=is_online,
            online_status=online_status,
            last_seen_text=last_seen_text
        ))
    # Sort: online dulu, lalu by role superadmin -> admin -> kasir
    result.sort(key=lambda x: (not x.is_online, x.role != "superadmin", x.role != "admin"))
    return result
