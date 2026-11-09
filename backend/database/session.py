import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database file location in backend/database/aquawatch.db
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "aquawatch.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# create_engine with check_same_thread=False for SQLite in multithreaded FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency for yielding DB sessions and ensuring clean closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
