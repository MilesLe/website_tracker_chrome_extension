"""
Domain service for usage-related business logic.
"""
from datetime import date, timedelta
from typing import Dict, List
import calendar

from ..interfaces.usage_repository import UsageRepository
from ..interfaces.tracked_sites_repository import TrackedSitesRepository


class UsageService:
    """Service for usage-related business logic."""
    
    def __init__(
        self,
        usage_repository: UsageRepository,
        tracked_sites_repository: TrackedSitesRepository,
    ):
        """
        Initialize usage service.
        
        Args:
            usage_repository: Repository for usage data
            tracked_sites_repository: Repository for tracked sites
        """
        self._usage_repository = usage_repository
        self._tracked_sites_repository = tracked_sites_repository
    
    def sync_usage(self, user_id: str, usage_date: date, usage_data: Dict[str, float]) -> int:
        """
        Sync usage data for a specific date.
        
        Args:
            user_id: User identifier
            usage_date: Date of usage
            usage_data: Dictionary mapping domain to minutes
            
        Returns:
            Number of records synced
        """
        synced_count = 0
        for domain, minutes in usage_data.items():
            self._usage_repository.upsert_usage(user_id, domain, usage_date, minutes)
            synced_count += 1
        return synced_count
    
    def get_calendar_month(
        self, user_id: str, year: int, month: int
    ) -> Dict:
        """
        Get calendar month data with usage information.
        
        Args:
            user_id: User identifier
            year: Year (e.g., 2024)
            month: Month (1-12)
            
        Returns:
            Dictionary with year, month, and days list
        """
        # Get date range for the month
        first_day = date(year, month, 1)
        last_day_num = calendar.monthrange(year, month)[1]
        last_day = date(year, month, last_day_num)
        
        # Get usage records for the month
        usage_records = self._usage_repository.get_usage_for_date_range(
            user_id, first_day, last_day
        )
        
        # Get tracked sites
        domain_limits = self._tracked_sites_repository.get_tracked_sites(user_id)
        
        # Group usage by date
        usage_by_date: Dict[date, Dict[str, float]] = {}
        for record in usage_records:
            record_date = record['date']
            if record_date not in usage_by_date:
                usage_by_date[record_date] = {}
            usage_by_date[record_date][record['domain']] = record['minutes']
        
        # Build calendar days
        days = []
        current_date = first_day
        
        while current_date <= last_day:
            day_usage = usage_by_date.get(current_date, {})
            total_usage = sum(day_usage.values())
            
            # Build domain details
            domain_details = []
            limit_reached = False
            
            for domain, minutes in day_usage.items():
                limit = domain_limits.get(domain, 0)
                reached = minutes >= limit if limit > 0 else False
                if reached:
                    limit_reached = True
                
                percentage = (minutes / limit * 100) if limit > 0 else 0
                
                domain_details.append({
                    'domain': domain,
                    'minutes': minutes,
                    'limit': limit,
                    'limitReached': reached,
                    'percentage': round(percentage, 1),
                })
            
            days.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'totalUsage': round(total_usage, 1),
                'domainUsage': day_usage,
                'limitReached': limit_reached,
                'domains': domain_details,
            })
            
            current_date += timedelta(days=1)
        
        return {
            'year': year,
            'month': month,
            'days': days,
        }
    
    def get_day_details(self, user_id: str, usage_date: date) -> Dict:
        """
        Get detailed usage information for a specific day.
        
        Args:
            user_id: User identifier
            usage_date: Date to query
            
        Returns:
            Dictionary with day usage details
        """
        # Get usage records for the day
        usage_records = self._usage_repository.get_usage_for_date(user_id, usage_date)
        
        # Get tracked sites
        domain_limits = self._tracked_sites_repository.get_tracked_sites(user_id)
        
        # Build a dictionary of usage by domain for quick lookup
        usage_by_domain: Dict[str, float] = {}
        for record in usage_records:
            usage_by_domain[record['domain']] = record['minutes']
        
        # Build domain details - include ALL tracked domains, even with zero usage
        domain_details = []
        total_usage = 0.0
        total_limit = sum(domain_limits.values())
        
        # Iterate over all tracked domains to ensure consistency
        for domain, limit in domain_limits.items():
            minutes = usage_by_domain.get(domain, 0.0)
            total_usage += minutes
            reached = minutes >= limit if limit > 0 else False
            percentage = (minutes / limit * 100) if limit > 0 else 0
            
            domain_details.append({
                'domain': domain,
                'minutes': minutes,
                'limit': limit,
                'limitReached': reached,
                'percentage': round(percentage, 1),
            })
        
        # Calculate metrics
        total_percentage = (total_usage / total_limit * 100) if total_limit > 0 else 0
        domains_over_limit = sum(1 for d in domain_details if d['limitReached'])
        
        return {
            'date': usage_date.strftime('%Y-%m-%d'),
            'totalUsage': round(total_usage, 1),
            'totalLimit': total_limit,
            'domains': domain_details,
            'metrics': {
                'totalMinutes': round(total_usage, 1),
                'totalLimit': total_limit,
                'totalPercentage': round(total_percentage, 1),
                'domainsOverLimit': domains_over_limit,
                'domainsTracked': len(domain_details),
            },
        }
