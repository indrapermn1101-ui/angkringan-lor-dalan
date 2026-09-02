from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Database SQLite di backend/angkringan.db
# Saat dijalankan dari folder PRAKTEK: ./backend/angkringan.db
# Saat dijalankan dari folder backend: ./angkringan.db (fallback)
if os.path.exists("backend/angkringan.db") or os.path.exists("backend"):
    SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/angkringan.db"
elif os.path.exists("angkringan.db"):
    SQLALCHEMY_DATABASE_URL = "sqlite:///./angkringan.db"
else:
    # default ke backend folder
    SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/angkringan.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
