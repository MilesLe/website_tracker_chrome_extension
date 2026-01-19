/**
 * API client utilities for backend communication.
 */

const API_BASE_URL = 'http://localhost:8000';

export interface UsageSyncRequest {
  date: string; // YYYY-MM-DD
  usage: Record<string, number>; // domain -> minutes
}

export interface UsageSyncResponse {
  status: string;
  synced: number;
  date: string;
}

export interface DomainUsageDetail {
  domain: string;
  minutes: number;
  limit: number;
  limitReached: boolean;
  percentage: number;
}

export interface CalendarDay {
  date: string;
  totalUsage: number;
  domainUsage: Record<string, number>;
  limitReached: boolean;
  domains: DomainUsageDetail[];
}

export interface CalendarMonthResponse {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface DayUsageDetail {
  date: string;
  totalUsage: number;
  totalLimit: number;
  domains: DomainUsageDetail[];
  metrics: {
    totalMinutes: number;
    totalLimit: number;
    totalPercentage: number;
    domainsOverLimit: number;
    domainsTracked: number;
  };
}

export interface TrackedSitesSyncRequest {
  trackedSites: Record<string, number>; // domain -> limit
}

export interface TrackedSitesSyncResponse {
  status: string;
  synced: number;
}

export interface TrackedSitesResponse {
  trackedSites: Record<string, number>;
}

/**
 * Get user ID from storage or generate new one.
 */
export async function getUserId(): Promise<string> {
  const result = await chrome.storage.local.get('userId');
  if (result.userId) {
    return result.userId;
  }
  
  // Generate new UUID
  const userId = crypto.randomUUID();
  await chrome.storage.local.set({ userId });
  return userId;
}

/**
 * Make API request with user ID header.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = await getUserId();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Sync daily usage data to backend.
 */
export async function syncUsage(date: string, usage: Record<string, number>): Promise<UsageSyncResponse> {
  return apiRequest<UsageSyncResponse>('/api/usage/sync', {
    method: 'POST',
    body: JSON.stringify({ date, usage }),
  });
}

/**
 * Get calendar month data.
 */
export async function getCalendarMonth(year: number, month: number): Promise<CalendarMonthResponse> {
  return apiRequest<CalendarMonthResponse>(
    `/api/usage/calendar?year=${year}&month=${month}`
  );
}

/**
 * Get day details.
 */
export async function getDayDetails(dateStr: string): Promise<DayUsageDetail> {
  return apiRequest<DayUsageDetail>(
    `/api/usage/day?date_str=${dateStr}`
  );
}

/**
 * Sync tracked sites to backend.
 */
export async function syncTrackedSites(trackedSites: Record<string, number>): Promise<TrackedSitesSyncResponse> {
  return apiRequest<TrackedSitesSyncResponse>('/api/tracked-sites/sync', {
    method: 'POST',
    body: JSON.stringify({ trackedSites }),
  });
}

/**
 * Get tracked sites from backend.
 */
export async function getTrackedSites(): Promise<TrackedSitesResponse> {
  return apiRequest<TrackedSitesResponse>('/api/tracked-sites');
}
