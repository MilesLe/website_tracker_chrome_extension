"""
Tests for tracked sites repository implementation.
"""
import pytest

from website_tracker_backend.infrastructure.adapters.tracked_sites_repository_impl import SQLAlchemyTrackedSitesRepository
from website_tracker_backend.infrastructure.database.models import TrackedSite


class TestSQLAlchemyTrackedSitesRepository:
    """Test SQLAlchemy tracked sites repository implementation."""

    def test_upsert_tracked_site_creates_new(self, db_session, test_user):
        """Test upsert creates new tracked site."""
        repo = SQLAlchemyTrackedSitesRepository(db_session)
        
        repo.upsert_tracked_site(test_user.id, "youtube.com", 60)
        
        # Verify site was created
        site = db_session.query(TrackedSite).filter(
            TrackedSite.user_id == test_user.id,
            TrackedSite.domain == "youtube.com",
        ).first()
        
        assert site is not None
        assert site.daily_limit == 60

    def test_upsert_tracked_site_updates_existing(self, db_session, test_user):
        """Test upsert updates existing tracked site."""
        # Create existing site
        existing = TrackedSite(
            user_id=test_user.id,
            domain="youtube.com",
            daily_limit=30,
        )
        db_session.add(existing)
        db_session.commit()
        
        repo = SQLAlchemyTrackedSitesRepository(db_session)
        repo.upsert_tracked_site(test_user.id, "youtube.com", 60)
        
        # Verify site was updated
        updated = db_session.query(TrackedSite).filter(
            TrackedSite.user_id == test_user.id,
            TrackedSite.domain == "youtube.com",
        ).first()
        
        assert updated.daily_limit == 60
        assert updated.id == existing.id  # Same record

    def test_get_tracked_sites(self, db_session, test_user):
        """Test getting tracked sites."""
        # Create tracked sites
        sites = [
            TrackedSite(user_id=test_user.id, domain="youtube.com", daily_limit=60),
            TrackedSite(user_id=test_user.id, domain="reddit.com", daily_limit=30),
        ]
        for site in sites:
            db_session.add(site)
        db_session.commit()
        
        repo = SQLAlchemyTrackedSitesRepository(db_session)
        result = repo.get_tracked_sites(test_user.id)
        
        assert result == {"youtube.com": 60, "reddit.com": 30}

    def test_remove_tracked_sites_not_in_list(self, db_session, test_user):
        """Test removing tracked sites not in list."""
        # Create tracked sites
        sites = [
            TrackedSite(user_id=test_user.id, domain="youtube.com", daily_limit=60),
            TrackedSite(user_id=test_user.id, domain="reddit.com", daily_limit=30),
        ]
        for site in sites:
            db_session.add(site)
        db_session.commit()
        
        repo = SQLAlchemyTrackedSitesRepository(db_session)
        repo.remove_tracked_sites_not_in_list(test_user.id, ["youtube.com"])
        
        # Verify reddit.com was removed
        reddit_site = db_session.query(TrackedSite).filter(
            TrackedSite.user_id == test_user.id,
            TrackedSite.domain == "reddit.com",
        ).first()
        assert reddit_site is None
        
        # Verify youtube.com still exists
        youtube_site = db_session.query(TrackedSite).filter(
            TrackedSite.user_id == test_user.id,
            TrackedSite.domain == "youtube.com",
        ).first()
        assert youtube_site is not None
