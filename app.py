import uvicorn
import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from backend.main import app

if __name__ == "__main__":
    print(f"Starting Brand AI-Readiness Audit server on http://127.0.0.1:8000 ...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
