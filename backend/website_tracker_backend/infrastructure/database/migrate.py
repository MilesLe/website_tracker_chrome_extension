"""
Database migration script.
Drops all existing tables and recreates them from scratch.
This is a destructive operation - all data will be lost!
"""
import os
import sys
from pathlib import Path
from datetime import date, timedelta
import uuid

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env from backend directory
    backend_dir = Path(__file__).parent.parent.parent.parent
    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        # Try loading from current directory
        load_dotenv()
except ImportError:
    # python-dotenv not installed, continue without it
    pass

from website_tracker_backend.infrastructure.database.connection import engine, Base, SessionLocal
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


def seed_fake_data():
    """
    Seed the database with fake data for the past week.
    Creates a test user, tracked sites, and usage records.
    """
    logger.info("Seeding fake data for the past week...")
    
    # Check if we're in development mode
    environment = os.getenv("ENVIRONMENT", "prod").lower()
    is_dev = environment == "dev"
    
    if is_dev:
        logger.info("=" * 60)
        logger.info("🔧 DEVELOPMENT MODE DETECTED")
        logger.info(f"   ENVIRONMENT variable: {environment}")
        logger.info("   Using hardcoded user ID '123' to match extension")
        logger.info("=" * 60)
        user_id = "123"
    else:
        logger.info(f"Production mode (ENVIRONMENT={environment}) - generating random user ID")
        user_id = str(uuid.uuid4())
        logger.info(f"Generated user ID: {user_id}")
    
    db = SessionLocal()
    try:
        # Create a test user
        user = User(id=user_id, email="test@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created test user: {user.id}")
        
        # Create tracked sites
        tracked_sites = [
            TrackedSite(user_id=user.id, domain="youtube.com", daily_limit=60),
            TrackedSite(user_id=user.id, domain="reddit.com", daily_limit=30),
            TrackedSite(user_id=user.id, domain="twitter.com", daily_limit=45),
        ]
        for site in tracked_sites:
            db.add(site)
        db.commit()
        logger.info(f"Created {len(tracked_sites)} tracked sites")
        
        # Generate usage records for the past 7 days
        today = date.today()
        usage_records = []
        
        # Define usage patterns for each day (domain: minutes)
        # Some days over limit, some under, some at limit
        usage_patterns = [
            # Day 1 (7 days ago) - mixed usage
            {"youtube.com": 45.5, "reddit.com": 25.0, "twitter.com": 20.0},
            # Day 2 (6 days ago) - over limits
            {"youtube.com": 75.0, "reddit.com": 35.0, "twitter.com": 50.0},
            # Day 3 (5 days ago) - under limits
            {"youtube.com": 30.0, "reddit.com": 15.0, "twitter.com": 10.0},
            # Day 4 (4 days ago) - at limits
            {"youtube.com": 60.0, "reddit.com": 30.0, "twitter.com": 45.0},
            # Day 5 (3 days ago) - mixed usage
            {"youtube.com": 55.0, "reddit.com": 20.0, "twitter.com": 40.0},
            # Day 6 (2 days ago) - minimal usage
            {"youtube.com": 10.0, "reddit.com": 5.0, "twitter.com": 8.0},
            # Day 7 (yesterday) - heavy usage
            {"youtube.com": 90.0, "reddit.com": 40.0, "twitter.com": 60.0},
        ]
        
        for i, pattern in enumerate(usage_patterns):
            day_date = today - timedelta(days=7 - i)
            for domain, minutes in pattern.items():
                usage_record = UsageRecord(
                    user_id=user.id,
                    domain=domain,
                    date=day_date,
                    minutes=minutes,
                )
                usage_records.append(usage_record)
                db.add(usage_record)
        
        db.commit()
        logger.info(f"Created {len(usage_records)} usage records for the past 7 days")
        logger.info("✅ Fake data seeded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to seed fake data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


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
        
        # Seed fake data for the past week
        seed_fake_data()
        
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
