from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from .database import engine, Base
from .routers import menu, pesanan, pembayaran, auth

# Buat tabel jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Angkringan Lor Dalan API",
    description="Backend FastAPI + SQLite untuk Sistem Pemesanan Warung Makan Tradisional. 16 Menu, Pesanan, Pembayaran, Statistik.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS agar frontend bisa fetch dari Live Server atau file://
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(menu.router)
app.include_router(pesanan.router)
app.include_router(pembayaran.router)
app.include_router(auth.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Angkringan Lor Dalan API running", "version": "1.0.0"}

@app.get("/api")
def api_root():
    return {
        "message": "Angkringan Lor Dalan API",
        "docs": "/docs",
        "menu": "/api/menu",
        "pesanan": "/api/pesanan",
        "pembayaran": "/api/pembayaran/rangkuman",
        "stat": "/api/stat"
    }

# Serve frontend static files
# Struktur baru (rapi): static/css, static/js, static/images, static/assets
# Struktur lama (legacy): /images, /style.css, /script.js, /AGK.jpg tetap didukung
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRONTEND_DIR = BASE_DIR  # index.html ada di PRAKTEK/
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")
IMAGES_DIR = os.path.join(FRONTEND_DIR, "images")  # legacy
IMAGES_NEW = os.path.join(STATIC_DIR, "images")    # baru: static/images

# Mount /static untuk struktur baru (css, js, images, assets)
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount /images untuk legacy (backward compat) dan juga untuk direct /images
# Jika ada static/images, mount juga sebagai /static/images sudah tercover via /static
# Tapi untuk request lama /images/nasi-kucing.jpg tetap support
if os.path.exists(IMAGES_NEW):
    # Mount legacy /images ke static/images jika legacy tidak ada
    if not os.path.exists(IMAGES_DIR):
        app.mount("/images", StaticFiles(directory=IMAGES_NEW), name="images_new")
    else:
        # Jika keduanya ada, mount legacy tetap, tapi static sudah cover
        app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")
elif os.path.exists(IMAGES_DIR):
    app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# Serve index.html di root
if os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    # Untuk akses file legacy di root seperti /AGK.jpg, /style.css, /script.js
    # Serta fallback untuk frontend jika diakses via / (index.html)
    try:
        app.mount("/legacy", StaticFiles(directory=FRONTEND_DIR, html=True), name="legacy")
    except:
        pass
    # Mount frontend dir di "/" sebagai fallback terakhir (serve index.html & legacy assets)
    # Ini diletakkan paling akhir agar tidak override /api & /static
    try:
        app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    except:
        pass

# Untuk development: jika dijalankan via `uvicorn backend.main:app --reload` dari PRAKTEK/
# Akses: http://127.0.0.1:8000/ -> frontend, http://127.0.0.1:8000/docs -> Swagger
