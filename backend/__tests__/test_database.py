"""
Tests for database utilities and models.
"""
import pytest
from datetime import date, datetime
from sqlalchemy.exc import IntegrityError

from website_tracker_backend.infrastructure.adapters.user_repository_impl import SQLAlchemyUserRepository
from website_tracker_backend.infrastructure.database.models import User, TrackedSite, UsageRecord


class TestDatabase:
    """Test database utilities."""

    def test_get_or_create_user_creates_new_user(self, db_session):
        """Test that get_or_create_user creates a new user if not exists."""
        user_id = "test-user-123"
        
        user_repo = SQLAlchemyUserRepository(db_session)
        user_repo.get_or_create_user(user_id)
        
        # Verify user was created
        user = db_session.query(User).filter(User.id == user_id).first()
        assert user is not None
        assert user.id == user_id
        assert user.email is None

    def test_get_or_create_user_returns_existing_user(self, db_session, test_user):
        """Test that get_or_create_user returns existing user."""
        user_repo = SQLAlchemyUserRepository(db_session)
        user_repo.get_or_create_user(test_user.id)
        
        # Verify user still exists
        user = db_session.query(User).filter(User.id == test_user.id).first()
        assert user.id == test_user.id

    def test_user_creation_timestamp(self, db_session):
        """Test that user has creation timestamp."""
        user_repo = SQLAlchemyUserRepository(db_session)
        user_repo.get_or_create_user("new-user")
        
        user = db_session.query(User).filter(User.id == "new-user").first()
        assert user.created_at is not None
        assert isinstance(user.created_at, datetime)


class TestModels:
    """Test database models."""

    def test_user_model(self, db_session):
        """Test User model creation."""
        user = User(id="user-1")
        db_session.add(user)
        db_session.commit()
        
        assert user.id == "user-1"
        assert user.created_at is not None

    def test_tracked_site_model(self, db_session, test_user):
        """Test TrackedSite model creation."""
        site = TrackedSite(
            user_id=test_user.id,
            domain="example.com",
            daily_limit=60,
        )
        db_session.add(site)
        db_session.commit()
        
        assert site.id is not None
        assert site.domain == "example.com"
        assert site.daily_limit == 60
        assert site.user_id == test_user.id

    def test_tracked_site_unique_constraint(self, db_session, test_user):
        """Test that tracked sites have unique constraint per user."""
        site1 = TrackedSite(
            user_id=test_user.id,
            domain="example.com",
            daily_limit=60,
        )
        db_session.add(site1)
        db_session.commit()
        
        # Try to add duplicate
        site2 = TrackedSite(
            user_id=test_user.id,
            domain="example.com",
            daily_limit=30,
        )
        db_session.add(site2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_usage_record_model(self, db_session, test_user):
        """Test UsageRecord model creation."""
        record = UsageRecord(
            user_id=test_user.id,
            domain="example.com",
            date=date(2024, 1, 15),
            minutes=45.5,
        )
        db_session.add(record)
        db_session.commit()
        
        assert record.id is not None
        assert record.domain == "example.com"
        assert record.date == date(2024, 1, 15)
        assert record.minutes == 45.5

    def test_usage_record_unique_constraint(self, db_session, test_user):
        """Test that usage records have unique constraint per user/domain/date."""
        record1 = UsageRecord(
            user_id=test_user.id,
            domain="example.com",
            date=date(2024, 1, 15),
            minutes=45.5,
        )
        db_session.add(record1)
        db_session.commit()
        
        # Try to add duplicate
        record2 = UsageRecord(
            user_id=test_user.id,
            domain="example.com",
            date=date(2024, 1, 15),
            minutes=30.0,
        )
        db_session.add(record2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_cascade_delete(self, db_session, test_user, test_tracked_sites, test_usage_records):
        """Test that deleting user cascades to related records."""
        user_id = test_user.id
        
        # Verify records exist
        sites = db_session.query(TrackedSite).filter(TrackedSite.user_id == user_id).all()
        records = db_session.query(UsageRecord).filter(UsageRecord.user_id == user_id).all()
        assert len(sites) == 2
        assert len(records) == 2
        
        # Delete user
        db_session.delete(test_user)
        db_session.commit()
        
        # Verify cascade delete
        sites = db_session.query(TrackedSite).filter(TrackedSite.user_id == user_id).all()
        records = db_session.query(UsageRecord).filter(UsageRecord.user_id == user_id).all()
        assert len(sites) == 0
        assert len(records) == 0
