import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

# Load environment variables
load_dotenv()

# 1. Import models here so SQLModel detects all table definitions
import api.models  # noqa: F401

DATABASE_URL = os.getenv("DATABASE_URL")

# Guard against missing DATABASE_URL to avoid AttributeError on start
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set in environment or .env file")

# Fix legacy host string formats
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=120,
    echo=False,
    connect_args={"connect_timeout": 10},  # fail in 5s instead of hanging
)

def create_db_and_tables():
    """Call this inside FastAPI lifespan to automatically generate missing tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session