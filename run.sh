#!/bin/bash
echo "Angkringan Lor Dalan - FastAPI + SQLite"
pip install -r backend/requirements.txt
python -m backend.seed
echo "Menjalankan server di http://127.0.0.1:8000/"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
