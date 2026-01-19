"""
Tests for tracked sites domain service.
"""
import pytest
from unittest.mock import Mock

from website_tracker_backend.domain.services.tracked_sites_service import TrackedSitesService
from website_tracker_backend.domain.interfaces.tracked_sites_repository import TrackedSitesRepository


class TestTrackedSitesService:
    """Test tracked sites service business logic."""

    def test_sync_tracked_sites(self):
        """Test syncing tracked sites."""
        # Setup mock
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        
        service = TrackedSitesService(tracked_sites_repo)
        
        # Execute
        tracked_sites = {"youtube.com": 60, "reddit.com": 30}
        synced_count = service.sync_tracked_sites("user-1", tracked_sites)
        
        # Verify
        assert synced_count == 2
        assert tracked_sites_repo.upsert_tracked_site.call_count == 2
        tracked_sites_repo.upsert_tracked_site.assert_any_call("user-1", "youtube.com", 60)
        tracked_sites_repo.upsert_tracked_site.assert_any_call("user-1", "reddit.com", 30)
        tracked_sites_repo.remove_tracked_sites_not_in_list.assert_called_once_with(
            "user-1", ["youtube.com", "reddit.com"]
        )

    def test_get_tracked_sites(self):
        """Test getting tracked sites."""
        # Setup mock
        tracked_sites_repo = Mock(spec=TrackedSitesRepository)
        tracked_sites_repo.get_tracked_sites.return_value = {
            "youtube.com": 60,
            "reddit.com": 30,
        }
        
        service = TrackedSitesService(tracked_sites_repo)
        
        # Execute
        result = service.get_tracked_sites("user-1")
        
        # Verify
        assert result == {"youtube.com": 60, "reddit.com": 30}
        tracked_sites_repo.get_tracked_sites.assert_called_once_with("user-1")
