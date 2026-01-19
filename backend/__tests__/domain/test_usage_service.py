"""
Tests for usage domain service.
"""
import pytest
from datetime import date
from unittest.mock import Mock

from website_tracker_backend.domain.services.usage_service import UsageService
from website_tracker_backend.domain.interfaces.usage_repository import UsageRepository
from website_tracker_backend.domain.interfaces.tracked_sites_repository import TrackedSitesRepository


class TestUsageService:
    """Test usage service business logic."""

    def test_sync_usage(self):
        """Test syncing usage data."""
        # Setup mocks
        usage_repo = Mock(spec=UsageRepository)
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        service = UsageService(usage_repo, tracked_sites_repo)
        
        # Execute
        usage_date = date(2024, 1, 15)
        usage_data = {"youtube.com": 45.5, "reddit.com": 30.0}
        synced_count = service.sync_usage("user-1", usage_date, usage_data)
        
        # Verify
        assert synced_count == 2
        assert usage_repo.upsert_usage.call_count == 2
        usage_repo.upsert_usage.assert_any_call("user-1", "youtube.com", usage_date, 45.5)
        usage_repo.upsert_usage.assert_any_call("user-1", "reddit.com", usage_date, 30.0)

    def test_get_calendar_month(self):
        """Test getting calendar month data."""
        # Setup mocks
        usage_repo = Mock(spec=UsageRepository)
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        # Mock repository responses
        usage_repo.get_usage_for_date_range.return_value = [
            {"domain": "youtube.com", "date": date(2024, 1, 15), "minutes": 60.0},
            {"domain": "reddit.com", "date": date(2024, 1, 15), "minutes": 30.0},
        ]
        tracked_sites_repo.get_tracked_sites.return_value = {
            "youtube.com": 60,
            "reddit.com": 30,
        }
        
        service = UsageService(usage_repo, tracked_sites_repo)
        
        # Execute
        result = service.get_calendar_month("user-1", 2024, 1)
        
        # Verify
        assert result["year"] == 2024
        assert result["month"] == 1
        assert len(result["days"]) == 31  # January has 31 days
        
        # Find day 15
        day_15 = next((d for d in result["days"] if d["date"] == "2024-01-15"), None)
        assert day_15 is not None
        assert day_15["totalUsage"] == 90.0
        assert len(day_15["domains"]) == 2
        assert day_15["limitReached"] is True  # youtube.com reached limit

    def test_get_calendar_month_with_limit_reached(self):
        """Test calendar month correctly identifies limit reached."""
        # Setup mocks
        usage_repo = Mock(spec=UsageRepository)
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        usage_repo.get_usage_for_date_range.return_value = [
            {"domain": "youtube.com", "date": date(2024, 1, 15), "minutes": 60.0},
        ]
        tracked_sites_repo.get_tracked_sites.return_value = {
            "youtube.com": 60,
        }
        
        service = UsageService(usage_repo, tracked_sites_repo)
        
        # Execute
        result = service.get_calendar_month("user-1", 2024, 1)
        
        # Verify
        day_15 = next((d for d in result["days"] if d["date"] == "2024-01-15"), None)
        assert day_15 is not None
        assert day_15["limitReached"] is True
        assert any(d["limitReached"] for d in day_15["domains"] if d["domain"] == "youtube.com")

    def test_get_day_details(self):
        """Test getting day details."""
        # Setup mocks
        usage_repo = Mock(spec=UsageRepository)
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        usage_repo.get_usage_for_date.return_value = [
            {"domain": "youtube.com", "date": date(2024, 1, 15), "minutes": 45.5},
            {"domain": "reddit.com", "date": date(2024, 1, 15), "minutes": 30.0},
        ]
        tracked_sites_repo.get_tracked_sites.return_value = {
            "youtube.com": 60,
            "reddit.com": 30,
        }
        
        service = UsageService(usage_repo, tracked_sites_repo)
        
        # Execute
        result = service.get_day_details("user-1", date(2024, 1, 15))
        
        # Verify
        assert result["date"] == "2024-01-15"
        assert result["totalUsage"] == 75.5
        assert result["totalLimit"] == 90
        assert len(result["domains"]) == 2
        assert "metrics" in result
        assert result["metrics"]["totalMinutes"] == 75.5
        assert result["metrics"]["domainsTracked"] == 2

    def test_get_day_details_no_usage(self):
        """Test getting day details with no usage and no tracked sites."""
        # Setup mocks
        usage_repo = Mock(spec=UsageRepository)
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        usage_repo.get_usage_for_date.return_value = []
        tracked_sites_repo.get_tracked_sites.return_value = {}
        
        service = UsageService(usage_repo, tracked_sites_repo)
        
        # Execute
        result = service.get_day_details("user-1", date(2024, 1, 20))
        
        # Verify
        assert result["totalUsage"] == 0.0
        assert result["totalLimit"] == 0
        assert len(result["domains"]) == 0

    def test_get_day_details_tracked_sites_with_zero_usage(self):
        """Test getting day details with tracked sites but zero usage - all domains should be shown."""
        # Setup mocks
        usage_repo = Mock(spec=UsageRepository)
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        usage_repo.get_usage_for_date.return_value = []
        tracked_sites_repo.get_tracked_sites.return_value = {
            "youtube.com": 60,
            "reddit.com": 30,
            "twitter.com": 45,
        }
        
        service = UsageService(usage_repo, tracked_sites_repo)
        
        # Execute
        result = service.get_day_details("user-1", date(2024, 1, 20))
        
        # Verify - all tracked domains should be shown even with zero usage
        assert result["totalUsage"] == 0.0
        assert result["totalLimit"] == 135  # 60 + 30 + 45
        assert len(result["domains"]) == 3
        assert result["metrics"]["domainsTracked"] == 3
        
        # Verify all domains are present with zero usage
        domains = {d["domain"]: d for d in result["domains"]}
        assert "youtube.com" in domains
        assert "reddit.com" in domains
        assert "twitter.com" in domains
        
        # Verify all have zero usage
        for domain_detail in result["domains"]:
            assert domain_detail["minutes"] == 0.0
            assert domain_detail["limitReached"] is False
            assert domain_detail["percentage"] == 0.0
