"""
Database migration script.
Drops all existing tables and recreates them from scratch.
This is a destructive operation - all data will be lost!
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from website_tracker_backend.infrastructure.database.connection import engine, Base
from website_tracker_backend.infrastructure.database.models import User, TrackedSite, UsageRecord
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def drop_all_tables():
    """Drop all existing tables."""
    logger.info("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("All tables dropped successfully")


def create_all_tables():
    """Create all tables from models."""
    logger.info("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("All tables created successfully")


def create_indexes():
    """Create indexes for performance."""
    from sqlalchemy import text
    
    logger.info("Creating indexes...")
    
    with engine.connect() as conn:
        # Create indexes if they don't exist
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_usage_records_user_date ON usage_records(user_id, date);",
            "CREATE INDEX IF NOT EXISTS idx_usage_records_user_domain_date ON usage_records(user_id, domain, date);",
            "CREATE INDEX IF NOT EXISTS idx_tracked_sites_user ON tracked_sites(user_id);",
        ]
        
        for index_sql in indexes:
            conn.execute(text(index_sql))
            conn.commit()
    
    logger.info("Indexes created successfully")


def migrate():
    """
    Main migration function.
    Destroys existing database and creates a new one.
    """
    database_path = os.getenv("DATABASE_URL", "sqlite:///./website_tracker.db")
    
    # Extract file path for SQLite
    if database_path.startswith("sqlite:///"):
        db_file = database_path.replace("sqlite:///", "")
        if os.path.exists(db_file):
            logger.warning(f"⚠️  WARNING: Existing database file '{db_file}' will be destroyed!")
            logger.warning("⚠️  All data will be lost!")
        else:
            logger.info(f"Creating new database file: {db_file}")
    
    try:
        # Drop all existing tables
        drop_all_tables()
        
        # Create all tables
        create_all_tables()
        
        # Create indexes
        create_indexes()
        
        logger.info("✅ Migration completed successfully!")
        logger.info("Database is ready to use.")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)
    print()
    print("⚠️  WARNING: This will DESTROY all existing data!")
    print("⚠️  All tables will be dropped and recreated.")
    print()
    
    response = input("Do you want to continue? (yes/no): ").strip().lower()
    
    if response not in ["yes", "y"]:
        print("Migration cancelled.")
        sys.exit(0)
    
    print()
    migrate()
