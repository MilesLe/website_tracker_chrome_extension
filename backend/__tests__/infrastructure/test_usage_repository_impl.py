"""
Tests for usage repository implementation.
"""
import pytest
from datetime import date

from website_tracker_backend.infrastructure.adapters.usage_repository_impl import SQLAlchemyUsageRepository
from website_tracker_backend.infrastructure.database.models import UsageRecord


class TestSQLAlchemyUsageRepository:
    """Test SQLAlchemy usage repository implementation."""

    def test_upsert_usage_creates_new(self, db_session, test_user):
        """Test upsert creates new usage record."""
        repo = SQLAlchemyUsageRepository(db_session)
        
        usage_date = date(2024, 1, 15)
        repo.upsert_usage(test_user.id, "youtube.com", usage_date, 45.5)
        
        # Verify record was created
        record = db_session.query(UsageRecord).filter(
            UsageRecord.user_id == test_user.id,
            UsageRecord.domain == "youtube.com",
            UsageRecord.date == usage_date,
        ).first()
        
        assert record is not None
        assert record.minutes == 45.5

    def test_upsert_usage_updates_existing(self, db_session, test_user):
        """Test upsert updates existing usage record."""
        # Create existing record
        existing = UsageRecord(
            user_id=test_user.id,
            domain="youtube.com",
            date=date(2024, 1, 15),
            minutes=30.0,
        )
        db_session.add(existing)
        db_session.commit()
        
        repo = SQLAlchemyUsageRepository(db_session)
        repo.upsert_usage(test_user.id, "youtube.com", date(2024, 1, 15), 45.5)
        
        # Verify record was updated
        updated = db_session.query(UsageRecord).filter(
            UsageRecord.user_id == test_user.id,
            UsageRecord.domain == "youtube.com",
            UsageRecord.date == date(2024, 1, 15),
        ).first()
        
        assert updated.minutes == 45.5
        assert updated.id == existing.id  # Same record

    def test_get_usage_for_date_range(self, db_session, test_user):
        """Test getting usage for date range."""
        # Create usage records
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
            UsageRecord(
                user_id=test_user.id,
                domain="youtube.com",
                date=date(2024, 1, 20),
                minutes=20.0,
            ),
        ]
        for record in records:
            db_session.add(record)
        db_session.commit()
        
        repo = SQLAlchemyUsageRepository(db_session)
        result = repo.get_usage_for_date_range(
            test_user.id,
            date(2024, 1, 15),
            date(2024, 1, 20),
        )
        
        assert len(result) == 3
        assert any(r["domain"] == "youtube.com" and r["date"] == date(2024, 1, 15) for r in result)
        assert any(r["domain"] == "reddit.com" and r["date"] == date(2024, 1, 15) for r in result)
        assert any(r["domain"] == "youtube.com" and r["date"] == date(2024, 1, 20) for r in result)

    def test_get_usage_for_date(self, db_session, test_user):
        """Test getting usage for specific date."""
        # Create usage records
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
        
        repo = SQLAlchemyUsageRepository(db_session)
        result = repo.get_usage_for_date(test_user.id, date(2024, 1, 15))
        
        assert len(result) == 2
        assert any(r["domain"] == "youtube.com" for r in result)
        assert any(r["domain"] == "reddit.com" for r in result)
