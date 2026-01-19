"""
Interface for tracked sites repository (port).
"""
from abc import ABC, abstractmethod
from typing import Dict, List


class TrackedSitesRepository(ABC):
    """Interface for accessing tracked sites."""
    
    @abstractmethod
    def upsert_tracked_site(self, user_id: str, domain: str, daily_limit: int) -> None:
        """
        Create or update a tracked site.
        
        Args:
            user_id: User identifier
            domain: Domain name
            daily_limit: Daily limit in minutes
        """
        pass
    
    @abstractmethod
    def get_tracked_sites(self, user_id: str) -> Dict[str, int]:
        """
        Get all tracked sites for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary mapping domain to daily limit
        """
        pass
    
    @abstractmethod
    def remove_tracked_sites_not_in_list(self, user_id: str, domains: List[str]) -> None:
        """
        Remove tracked sites that are not in the provided list.
        
        Args:
            user_id: User identifier
            domains: List of domains to keep
        """
        pass
