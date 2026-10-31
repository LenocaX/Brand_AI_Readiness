import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

logger = logging.getLogger("canopy.database")

# Environment-based database configuration
# Primary: PostgreSQL (e.g. postgresql+psycopg://user:pass@host:5432/dbname)
# Fallback: SQLite file-based or memory for development/testing
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Default to sqlite if no explicit PostgreSQL DATABASE_URL is configured
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "canopy.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    logger.info(f"DATABASE_URL not set; using persistent local database: {DATABASE_URL}")

# Determine engine parameters based on dialect
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL:
        engine_kwargs["poolclass"] = StaticPool
else:
    # PostgreSQL settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

try:
    engine = create_engine(DATABASE_URL, **engine_kwargs)
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info(f"Database connection verified: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
except Exception as e:
    logger.warning(f"Could not connect to configured database ({e}); falling back to local SQLite.")
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "canopy.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that yields a scoped database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Creates tables if they do not exist yet.
    """
    import backend.models_db  # Ensure models are loaded
    Base.metadata.create_all(bind=engine)
