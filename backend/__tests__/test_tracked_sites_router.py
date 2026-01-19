"""
Tests for tracked sites API router.
"""
import pytest
from fastapi import status

from website_tracker_backend.infrastructure.database.models import TrackedSite


class TestTrackedSitesSync:
    """Test tracked sites sync endpoint."""

    def test_sync_tracked_sites_creates_new(self, client, test_user_id):
        """Test syncing tracked sites creates new records."""
        response = client.post(
            "/api/tracked-sites/sync",
            json={
                "trackedSites": {
                    "youtube.com": 60,
                    "reddit.com": 30,
                },
            },
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "success"
        assert data["synced"] == 2

    def test_sync_tracked_sites_updates_existing(self, client, test_user, db_session):
        """Test syncing tracked sites updates existing records."""
        # Create existing site
        site = TrackedSite(
            user_id=test_user.id,
            domain="youtube.com",
            daily_limit=30,
        )
        db_session.add(site)
        db_session.commit()
        
        # Sync with new limit
        response = client.post(
            "/api/tracked-sites/sync",
            json={
                "trackedSites": {
                    "youtube.com": 60,
                },
            },
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify update
        updated = db_session.query(TrackedSite).filter(
            TrackedSite.user_id == test_user.id,
            TrackedSite.domain == "youtube.com",
        ).first()
        assert updated.daily_limit == 60

    def test_sync_tracked_sites_removes_deleted(self, client, test_user, test_tracked_sites, db_session):
        """Test syncing tracked sites removes sites not in request."""
        # Sync with only one site
        response = client.post(
            "/api/tracked-sites/sync",
            json={
                "trackedSites": {
                    "youtube.com": 60,
                },
            },
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify reddit.com was removed
        # Use the db_session from the test fixture
        reddit_site = db_session.query(TrackedSite).filter(
            TrackedSite.user_id == test_user.id,
            TrackedSite.domain == "reddit.com",
        ).first()
        assert reddit_site is None

    def test_sync_tracked_sites_missing_user_id(self, client):
        """Test syncing tracked sites without user ID returns 400."""
        response = client.post(
            "/api/tracked-sites/sync",
            json={
                "trackedSites": {"youtube.com": 60},
            },
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetTrackedSites:
    """Test get tracked sites endpoint."""

    def test_get_tracked_sites(self, client, test_user, test_tracked_sites):
        """Test getting tracked sites."""
        response = client.get(
            "/api/tracked-sites",
            headers={"X-User-ID": test_user.id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "trackedSites" in data
        assert data["trackedSites"]["youtube.com"] == 60
        assert data["trackedSites"]["reddit.com"] == 30

    def test_get_tracked_sites_empty(self, client, test_user_id):
        """Test getting tracked sites when none exist."""
        response = client.get(
            "/api/tracked-sites",
            headers={"X-User-ID": test_user_id},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["trackedSites"] == {}

    def test_get_tracked_sites_missing_user_id(self, client):
        """Test getting tracked sites without user ID returns 400."""
        response = client.get("/api/tracked-sites")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
