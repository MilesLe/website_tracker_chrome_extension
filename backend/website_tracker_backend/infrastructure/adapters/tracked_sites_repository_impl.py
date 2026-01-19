"""
SQLAlchemy implementation of TrackedSitesRepository.
"""
from typing import Dict, List
from sqlalchemy.orm import Session

from ...domain.interfaces.tracked_sites_repository import TrackedSitesRepository
from ..database.models import TrackedSite


class SQLAlchemyTrackedSitesRepository(TrackedSitesRepository):
    """SQLAlchemy implementation of tracked sites repository."""
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self._db = db
    
    def upsert_tracked_site(self, user_id: str, domain: str, daily_limit: int) -> None:
        """
        Create or update a tracked site.
        
        Args:
            user_id: User identifier
            domain: Domain name
            daily_limit: Daily limit in minutes
        """
        tracked_site = (
            self._db.query(TrackedSite)
            .filter(
                TrackedSite.user_id == user_id,
                TrackedSite.domain == domain,
            )
            .first()
        )
        
        if tracked_site:
            # Update existing site
            tracked_site.daily_limit = daily_limit
        else:
            # Create new site
            tracked_site = TrackedSite(
                user_id=user_id,
                domain=domain,
                daily_limit=daily_limit,
            )
            self._db.add(tracked_site)
        
        self._db.commit()
    
    def get_tracked_sites(self, user_id: str) -> Dict[str, int]:
        """
        Get all tracked sites for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary mapping domain to daily limit
        """
        tracked_sites = (
            self._db.query(TrackedSite)
            .filter(TrackedSite.user_id == user_id)
            .all()
        )
        
        return {site.domain: site.daily_limit for site in tracked_sites}
    
    def remove_tracked_sites_not_in_list(self, user_id: str, domains: List[str]) -> None:
        """
        Remove tracked sites that are not in the provided list.
        
        Args:
            user_id: User identifier
            domains: List of domains to keep
        """
        sites_to_remove = (
            self._db.query(TrackedSite)
            .filter(
                TrackedSite.user_id == user_id,
                ~TrackedSite.domain.in_(domains),
            )
            .all()
        )
        
        for site in sites_to_remove:
            self._db.delete(site)
        
        self._db.commit()
