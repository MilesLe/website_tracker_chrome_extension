"""
Interface for usage data repository (port).
"""
from abc import ABC, abstractmethod
from datetime import date
from typing import Dict, List, Optional


class UsageRepository(ABC):
    """Interface for accessing usage records."""
    
    @abstractmethod
    def upsert_usage(self, user_id: str, domain: str, usage_date: date, minutes: float) -> None:
        """
        Create or update a usage record.
        
        Args:
            user_id: User identifier
            domain: Domain name
            usage_date: Date of usage
            minutes: Minutes used
        """
        pass
    
    @abstractmethod
    def get_usage_for_date_range(
        self, user_id: str, start_date: date, end_date: date
    ) -> List[Dict]:
        """
        Get usage records for a date range.
        
        Args:
            user_id: User identifier
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            
        Returns:
            List of usage records with domain, date, and minutes
        """
        pass
    
    @abstractmethod
    def get_usage_for_date(self, user_id: str, usage_date: date) -> List[Dict]:
        """
        Get usage records for a specific date.
        
        Args:
            user_id: User identifier
            usage_date: Date to query
            
        Returns:
            List of usage records with domain, date, and minutes
        """
        pass
