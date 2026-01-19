"""
SQLAlchemy implementation of UsageRepository.
"""
from datetime import date
from typing import Dict, List
from sqlalchemy.orm import Session

from ...domain.interfaces.usage_repository import UsageRepository
from ..database.models import UsageRecord


class SQLAlchemyUsageRepository(UsageRepository):
    """SQLAlchemy implementation of usage repository."""
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self._db = db
    
    def upsert_usage(self, user_id: str, domain: str, usage_date: date, minutes: float) -> None:
        """
        Create or update a usage record.
        
        Args:
            user_id: User identifier
            domain: Domain name
            usage_date: Date of usage
            minutes: Minutes used
        """
        from datetime import datetime
        
        usage_record = (
            self._db.query(UsageRecord)
            .filter(
                UsageRecord.user_id == user_id,
                UsageRecord.domain == domain,
                UsageRecord.date == usage_date,
            )
            .first()
        )
        
        if usage_record:
            # Update existing record
            usage_record.minutes = minutes
            usage_record.updated_at = datetime.utcnow()
        else:
            # Create new record
            usage_record = UsageRecord(
                user_id=user_id,
                domain=domain,
                date=usage_date,
                minutes=minutes,
            )
            self._db.add(usage_record)
        
        self._db.commit()
    
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
        usage_records = (
            self._db.query(UsageRecord)
            .filter(
                UsageRecord.user_id == user_id,
                UsageRecord.date >= start_date,
                UsageRecord.date <= end_date,
            )
            .all()
        )
        
        return [
            {
                'domain': record.domain,
                'date': record.date,
                'minutes': record.minutes,
            }
            for record in usage_records
        ]
    
    def get_usage_for_date(self, user_id: str, usage_date: date) -> List[Dict]:
        """
        Get usage records for a specific date.
        
        Args:
            user_id: User identifier
            usage_date: Date to query
            
        Returns:
            List of usage records with domain, date, and minutes
        """
        usage_records = (
            self._db.query(UsageRecord)
            .filter(
                UsageRecord.user_id == user_id,
                UsageRecord.date == usage_date,
            )
            .all()
        )
        
        return [
            {
                'domain': record.domain,
                'date': record.date,
                'minutes': record.minutes,
            }
            for record in usage_records
        ]
