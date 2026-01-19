"""
Database connection and session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from typing import Generator

from .models import Base

# Export Base for use in tests and other modules
__all__ = ['Base', 'get_db', 'init_db', 'SessionLocal', 'engine']

# Database URL - SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./website_tracker.db")

# Create engine with SQLite-specific configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    poolclass=StaticPool if "sqlite" in DATABASE_URL else None,
    echo=False,  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """
    Initialize database by creating all tables.
    
    Note: This function is kept for backward compatibility.
    For production use, run the migration script: ./migrate.sh
    """
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session.
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Note: get_or_create_user moved to user_repository_impl.py
