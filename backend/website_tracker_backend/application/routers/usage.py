"""
API router for usage-related endpoints (Application layer).
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from ..schemas import (
    UsageSyncRequest,
    UsageSyncResponse,
    CalendarMonthResponse,
    DayUsageDetail,
)
from ..dependencies import get_usage_service, get_user_repository
from ...domain.services.usage_service import UsageService
from ...infrastructure.adapters.user_repository_impl import SQLAlchemyUserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/usage", tags=["usage"])


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


@router.post("/sync", response_model=UsageSyncResponse)
async def sync_usage(
    request: UsageSyncRequest,
    user_id: str = Depends(get_user_id),
    usage_service: UsageService = Depends(get_usage_service),
    user_repository: SQLAlchemyUserRepository = Depends(get_user_repository),
):
    """
    Sync daily usage data from extension to backend.
    
    Args:
        request: Usage sync request with date and usage data
        user_id: User ID from header
        usage_service: Usage service (injected)
        user_repository: User repository (injected)
        
    Returns:
        Sync response with status and count
    """
    try:
        # Ensure user exists
        user_repository.get_or_create_user(user_id)
        
        # Parse date
        usage_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        
        # Delegate to service
        synced_count = usage_service.sync_usage(user_id, usage_date, request.usage)
        
        logger.info(f"Synced {synced_count} usage records for user {user_id} on {request.date}")
        
        return UsageSyncResponse(
            status="success",
            synced=synced_count,
            date=request.date,
        )
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors) as-is
        raise
    except ValueError as e:
        logger.error(f"Invalid date format: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid date format: {request.date}")
    except Exception as e:
        logger.error(f"Error syncing usage: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/calendar", response_model=CalendarMonthResponse)
async def get_calendar_month(
    year: int,
    month: int,
    user_id: str = Depends(get_user_id),
    usage_service: UsageService = Depends(get_usage_service),
    user_repository: SQLAlchemyUserRepository = Depends(get_user_repository),
):
    """
    Get calendar month data with usage information.
    
    Args:
        year: Year (e.g., 2024)
        month: Month (1-12)
        user_id: User ID from header
        usage_service: Usage service (injected)
        user_repository: User repository (injected)
        
    Returns:
        Calendar month response with all days and usage data
    """
    try:
        # Validate month
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        # Ensure user exists
        user_repository.get_or_create_user(user_id)
        
        # Delegate to service
        calendar_data = usage_service.get_calendar_month(user_id, year, month)
        
        return CalendarMonthResponse(**calendar_data)
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors) as-is
        raise
    except ValueError as e:
        logger.error(f"Invalid date parameters: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid date parameters: {e}")
    except Exception as e:
        logger.error(f"Error getting calendar data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/day", response_model=DayUsageDetail)
async def get_day_details(
    date_str: str,  # Query parameter
    user_id: str = Depends(get_user_id),
    usage_service: UsageService = Depends(get_usage_service),
    user_repository: SQLAlchemyUserRepository = Depends(get_user_repository),
):
    """
    Get detailed usage information for a specific day.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        user_id: User ID from header
        usage_service: Usage service (injected)
        user_repository: User repository (injected)
        
    Returns:
        Detailed day usage information
    """
    try:
        # Parse date
        usage_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # Ensure user exists
        user_repository.get_or_create_user(user_id)
        
        # Delegate to service
        day_details = usage_service.get_day_details(user_id, usage_date)
        
        return DayUsageDetail(**day_details)
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors) as-is
        raise
    except ValueError as e:
        logger.error(f"Invalid date format: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}")
    except Exception as e:
        logger.error(f"Error getting day details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
