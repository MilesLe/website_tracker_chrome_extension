"""
Pytest configuration and fixtures for backend tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import date, datetime
import uuid

from website_tracker_backend.infrastructure.database.connection import Base, get_db
from website_tracker_backend.app import app
from website_tracker_backend.infrastructure.database.models import User, TrackedSite, UsageRecord


# Create in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test.
    
    Yields:
        Database session
    """
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    # Create session
    db = TestSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def override_get_db(db_session):
    """
    Override the get_db dependency to use test database.
    
    Args:
        db_session: Test database session
        
    Yields:
        Database session generator
    """
    def _get_db():
        try:
            yield db_session
        finally:
            pass
    
    return _get_db


@pytest.fixture(scope="function")
def client(override_get_db):
    """
    Create a test client with overridden database dependency.
    
    Args:
        override_get_db: Database dependency override
        
    Returns:
        FastAPI test client
    """
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_id():
    """Generate a test user ID."""
    return str(uuid.uuid4())


@pytest.fixture
def test_user(db_session, test_user_id):
    """
    Create a test user in the database.
    
    Args:
        db_session: Database session
        test_user_id: User ID
        
    Returns:
        User model instance
    """
    user = User(id=test_user_id)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_tracked_sites(db_session, test_user):
    """
    Create test tracked sites.
    
    Args:
        db_session: Database session
        test_user: User instance
        
    Returns:
        List of TrackedSite instances
    """
    sites = [
        TrackedSite(user_id=test_user.id, domain="youtube.com", daily_limit=60),
        TrackedSite(user_id=test_user.id, domain="reddit.com", daily_limit=30),
    ]
    for site in sites:
        db_session.add(site)
    db_session.commit()
    return sites


@pytest.fixture
def test_usage_records(db_session, test_user):
    """
    Create test usage records.
    
    Args:
        db_session: Database session
        test_user: User instance
        
    Returns:
        List of UsageRecord instances
    """
    records = [
        UsageRecord(
            user_id=test_user.id,
            domain="youtube.com",
            date=date(2024, 1, 15),
            minutes=45.5,
        ),
        UsageRecord(
            user_id=test_user.id,
            domain="reddit.com",
            date=date(2024, 1, 15),
            minutes=30.0,
        ),
    ]
    for record in records:
        db_session.add(record)
    db_session.commit()
    return records
