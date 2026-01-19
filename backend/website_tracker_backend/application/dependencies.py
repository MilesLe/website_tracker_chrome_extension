"""
Dependency injection for application layer.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from ..infrastructure.database.connection import get_db
from ..infrastructure.adapters.user_repository_impl import SQLAlchemyUserRepository
from ..infrastructure.adapters.usage_repository_impl import SQLAlchemyUsageRepository
from ..infrastructure.adapters.tracked_sites_repository_impl import SQLAlchemyTrackedSitesRepository
from ..domain.services.usage_service import UsageService
from ..domain.services.tracked_sites_service import TrackedSitesService


def get_usage_service(db: Session = Depends(get_db)) -> UsageService:
    """
    Get usage service with dependencies injected.
    
    Args:
        db: Database session
        
    Returns:
        UsageService instance
    """
    usage_repository = SQLAlchemyUsageRepository(db)
    tracked_sites_repository = SQLAlchemyTrackedSitesRepository(db)
    return UsageService(usage_repository, tracked_sites_repository)


def get_tracked_sites_service(db: Session = Depends(get_db)) -> TrackedSitesService:
    """
    Get tracked sites service with dependencies injected.
    
    Args:
        db: Database session
        
    Returns:
        TrackedSitesService instance
    """
    tracked_sites_repository = SQLAlchemyTrackedSitesRepository(db)
    return TrackedSitesService(tracked_sites_repository)


def get_user_repository(db: Session = Depends(get_db)) -> SQLAlchemyUserRepository:
    """
    Get user repository with dependencies injected.
    
    Args:
        db: Database session
        
    Returns:
        SQLAlchemyUserRepository instance
    """
    return SQLAlchemyUserRepository(db)
