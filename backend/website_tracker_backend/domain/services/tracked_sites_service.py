"""
Domain service for tracked sites business logic.
"""
from typing import Dict

from ..interfaces.tracked_sites_repository import TrackedSitesRepository


class TrackedSitesService:
    """Service for tracked sites business logic."""
    
    def __init__(self, tracked_sites_repository: TrackedSitesRepository):
        """
        Initialize tracked sites service.
        
        Args:
            tracked_sites_repository: Repository for tracked sites
        """
        self._tracked_sites_repository = tracked_sites_repository
    
    def sync_tracked_sites(self, user_id: str, tracked_sites: Dict[str, int]) -> int:
        """
        Sync tracked sites for a user.
        
        Args:
            user_id: User identifier
            tracked_sites: Dictionary mapping domain to daily limit
            
        Returns:
            Number of sites synced
        """
        synced_count = 0
        for domain, limit in tracked_sites.items():
            self._tracked_sites_repository.upsert_tracked_site(user_id, domain, limit)
            synced_count += 1
        
        # Remove sites not in the request
        existing_domains = list(tracked_sites.keys())
        self._tracked_sites_repository.remove_tracked_sites_not_in_list(
            user_id, existing_domains
        )
        
        return synced_count
    
    def get_tracked_sites(self, user_id: str) -> Dict[str, int]:
        """
        Get all tracked sites for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary mapping domain to daily limit
        """
        return self._tracked_sites_repository.get_tracked_sites(user_id)
