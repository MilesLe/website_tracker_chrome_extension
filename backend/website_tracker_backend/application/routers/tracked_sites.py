"""
API router for tracked sites endpoints (Application layer).
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
import logging

from ..schemas import (
    TrackedSitesSyncRequest,
    TrackedSitesSyncResponse,
    TrackedSitesResponse,
)
from ..dependencies import get_tracked_sites_service, get_user_repository
from ...domain.services.tracked_sites_service import TrackedSitesService
from ...infrastructure.adapters.user_repository_impl import SQLAlchemyUserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tracked-sites", tags=["tracked-sites"])


def get_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-ID")) -> str:
    """
    Extract user ID from header.
    
    Args:
        x_user_id: User ID from X-User-ID header
        
    Returns:
        User ID string
        
    Raises:
        HTTPException: If user ID is missing
    """
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-ID header is required")
    return x_user_id


@router.post("/sync", response_model=TrackedSitesSyncResponse)
async def sync_tracked_sites(
    request: TrackedSitesSyncRequest,
    user_id: str = Depends(get_user_id),
    tracked_sites_service: TrackedSitesService = Depends(get_tracked_sites_service),
    user_repository: SQLAlchemyUserRepository = Depends(get_user_repository),
):
    """
    Sync tracked sites from extension to backend.
    
    Args:
        request: Tracked sites sync request
        user_id: User ID from header
        tracked_sites_service: Tracked sites service (injected)
        user_repository: User repository (injected)
        
    Returns:
        Sync response with status and count
    """
    try:
        # Ensure user exists
        user_repository.get_or_create_user(user_id)
        
        # Delegate to service
        synced_count = tracked_sites_service.sync_tracked_sites(user_id, request.trackedSites)
        
        logger.info(f"Synced {synced_count} tracked sites for user {user_id}")
        
        return TrackedSitesSyncResponse(
            status="success",
            synced=synced_count,
        )
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors) as-is
        raise
    except Exception as e:
        logger.error(f"Error syncing tracked sites: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=TrackedSitesResponse)
async def get_tracked_sites(
    user_id: str = Depends(get_user_id),
    tracked_sites_service: TrackedSitesService = Depends(get_tracked_sites_service),
    user_repository: SQLAlchemyUserRepository = Depends(get_user_repository),
):
    """
    Get all tracked sites for a user.
    
    Args:
        user_id: User ID from header
        tracked_sites_service: Tracked sites service (injected)
        user_repository: User repository (injected)
        
    Returns:
        Tracked sites response
    """
    try:
        # Ensure user exists
        user_repository.get_or_create_user(user_id)
        
        # Delegate to service
        tracked_sites = tracked_sites_service.get_tracked_sites(user_id)
        
        return TrackedSitesResponse(trackedSites=tracked_sites)
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors) as-is
        raise
    except Exception as e:
        logger.error(f"Error getting tracked sites: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
