"""
Tests for usage API router.
"""
import pytest
from datetime import date, datetime
from fastapi import status

from website_tracker_backend.infrastructure.database.models import UsageRecord, TrackedSite


class TestUsageSync:
    """Test usage sync endpoint."""

    def test_sync_usage_creates_new_records(self, client, test_user_id):
        """Test syncing usage creates new records."""
        response = client.post(
            "/api/usage/sync",
            json={
                "date": "2024-01-15",
                "usage": {
                    "youtube.com": 45.5,
                    "reddit.com": 30.0,
                },
            },
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "success"
        assert data["synced"] == 2
        assert data["date"] == "2024-01-15"

    def test_sync_usage_updates_existing_records(self, client, test_user_id, db_session):
        """Test syncing usage updates existing records."""
        # Create existing record
        from website_tracker_backend.infrastructure.database.models import User
        user = User(id=test_user_id)
        db_session.add(user)
        record = UsageRecord(
            user_id=test_user_id,
            domain="youtube.com",
            date=date(2024, 1, 15),
            minutes=30.0,
        )
        db_session.add(record)
        db_session.commit()
        
        # Sync new data
        response = client.post(
            "/api/usage/sync",
            json={
                "date": "2024-01-15",
                "usage": {
                    "youtube.com": 45.5,
                },
            },
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["synced"] == 1
        
        # Verify update
        updated = db_session.query(UsageRecord).filter(
            UsageRecord.user_id == test_user_id,
            UsageRecord.domain == "youtube.com",
            UsageRecord.date == date(2024, 1, 15),
        ).first()
        assert updated.minutes == 45.5

    def test_sync_usage_missing_user_id(self, client):
        """Test syncing usage without user ID returns 400."""
        response = client.post(
            "/api/usage/sync",
            json={
                "date": "2024-01-15",
                "usage": {"youtube.com": 45.5},
            },
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_sync_usage_invalid_date_format(self, client, test_user_id):
        """Test syncing usage with invalid date format returns 400."""
        response = client.post(
            "/api/usage/sync",
            json={
                "date": "invalid-date",
                "usage": {"youtube.com": 45.5},
            },
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestCalendarMonth:
    """Test calendar month endpoint."""

    def test_get_calendar_month(self, client, test_user, test_tracked_sites, test_usage_records):
        """Test getting calendar month data."""
        response = client.get(
            "/api/usage/calendar",
            params={"year": 2024, "month": 1},
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["year"] == 2024
        assert data["month"] == 1
        assert len(data["days"]) == 31  # January has 31 days
        
        # Find day 15
        day_15 = next((d for d in data["days"] if d["date"] == "2024-01-15"), None)
        assert day_15 is not None
        assert day_15["totalUsage"] == 75.5
        assert len(day_15["domains"]) == 2

    def test_get_calendar_month_with_limit_reached(self, client, test_user, test_tracked_sites, db_session):
        """Test calendar month shows limit reached correctly."""
        # Create usage record that exceeds limit
        record = UsageRecord(
            user_id=test_user.id,
            domain="youtube.com",
            date=date(2024, 1, 15),
            minutes=60.0,  # Exactly at limit
        )
        db_session.add(record)
        db_session.commit()
        
        response = client.get(
            "/api/usage/calendar",
            params={"year": 2024, "month": 1},
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        day_15 = next((d for d in data["days"] if d["date"] == "2024-01-15"), None)
        assert day_15 is not None
        assert day_15["limitReached"] is True
        assert any(d["limitReached"] for d in day_15["domains"] if d["domain"] == "youtube.com")

    def test_get_calendar_month_invalid_month(self, client, test_user_id):
        """Test getting calendar with invalid month returns 400."""
        response = client.get(
            "/api/usage/calendar",
            params={"year": 2024, "month": 13},
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_calendar_month_missing_user_id(self, client):
        """Test getting calendar without user ID returns 400."""
        response = client.get(
            "/api/usage/calendar",
            params={"year": 2024, "month": 1},
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestDayDetails:
    """Test day details endpoint."""

    def test_get_day_details(self, client, test_user, test_tracked_sites, test_usage_records):
        """Test getting day details."""
        response = client.get(
            "/api/usage/day",
            params={"date_str": "2024-01-15"},
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["date"] == "2024-01-15"
        assert data["totalUsage"] == 75.5
        assert data["totalLimit"] == 90  # 60 + 30
        assert len(data["domains"]) == 2
        assert "metrics" in data
        assert data["metrics"]["totalMinutes"] == 75.5
        assert data["metrics"]["domainsTracked"] == 2

    def test_get_day_details_no_usage(self, client, test_user, test_tracked_sites):
        """Test getting day details with tracked sites but no usage - all domains should be shown."""
        response = client.get(
            "/api/usage/day",
            params={"date_str": "2024-01-20"},
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["totalUsage"] == 0.0
        assert data["totalLimit"] == 90  # 60 + 30 from test_tracked_sites fixture
        # All tracked domains should be shown even with zero usage
        assert len(data["domains"]) == 2
        assert data["metrics"]["domainsTracked"] == 2
        
        # Verify all domains are present with zero usage
        domains = {d["domain"]: d for d in data["domains"]}
        assert "youtube.com" in domains
        assert "reddit.com" in domains
        
        # Verify all have zero usage
        for domain_detail in data["domains"]:
            assert domain_detail["minutes"] == 0.0
            assert domain_detail["limitReached"] is False
            assert domain_detail["percentage"] == 0.0

    def test_get_day_details_invalid_date(self, client, test_user_id):
        """Test getting day details with invalid date returns 400."""
        response = client.get(
            "/api/usage/day",
            params={"date_str": "invalid-date"},
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_day_details_missing_user_id(self, client):
        """Test getting day details without user ID returns 400."""
        response = client.get(
            "/api/usage/day",
            params={"date_str": "2024-01-15"},
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
