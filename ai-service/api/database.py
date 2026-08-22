import os
from sqlmodel import create_engine, Session



# Fetch from environment variable if provided, else fallback to the Neon pooler URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for hosts that supply 'postgres://' instead of 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Engine configured for Neon pooler and Vercel serverless functions
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verifies connection is active before handing it out (prevents dead socket errors)
    pool_recycle=120,    # Recycles idle connections every 2 mins to match Neon's idle drop behavior
    echo=False
)

def get_session():
    with Session(engine) as session:
        yield session