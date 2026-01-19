"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import date


class UsageSyncRequest(BaseModel):
    """Request schema for syncing daily usage."""
    date: str  # YYYY-MM-DD
    usage: Dict[str, float]  # domain -> minutes


class UsageSyncResponse(BaseModel):
    """Response schema for usage sync."""
    status: str
    synced: int
    date: str


class DomainUsageDetail(BaseModel):
    """Detailed usage information for a single domain."""
    domain: str
    minutes: float
    limit: int
    limitReached: bool
    percentage: float


class DayUsageDetail(BaseModel):
    """Detailed usage information for a single day."""
    date: str
    totalUsage: float
    totalLimit: int
    domains: List[DomainUsageDetail]
    metrics: Dict[str, float]


class CalendarDay(BaseModel):
    """Calendar day data with usage information."""
    date: str
    totalUsage: float
    domainUsage: Dict[str, float]
    limitReached: bool
    domains: List[DomainUsageDetail]


class CalendarMonthResponse(BaseModel):
    """Response schema for calendar month data."""
    year: int
    month: int
    days: List[CalendarDay]


class TrackedSitesSyncRequest(BaseModel):
    """Request schema for syncing tracked sites."""
    trackedSites: Dict[str, int]  # domain -> limit


class TrackedSitesSyncResponse(BaseModel):
    """Response schema for tracked sites sync."""
    status: str
    synced: int


class TrackedSitesResponse(BaseModel):
    """Response schema for getting tracked sites."""
    trackedSites: Dict[str, int]
