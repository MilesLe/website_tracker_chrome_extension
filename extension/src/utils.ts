import type { StorageData, TrackedSites, UsageData, NotifiedDomains } from './types';

/**
 * Extract domain from a URL, handling subdomains
 * @param url - Full URL (e.g., "https://www.youtube.com/watch?v=123")
 * @returns Domain without protocol or path (e.g., "youtube.com")
 */
export function extractDomain(url: string): string {
  try {
    // Try to parse as URL first (add protocol if missing)
    let urlToParse = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToParse = `https://${url}`;
    }
    const urlObj = new URL(urlToParse);
    let hostname = urlObj.hostname;
    
    // Validate hostname looks like a domain (must contain at least one dot)
    if (!hostname.includes('.')) {
      return '';
    }
    
    // Remove 'www.' prefix if present
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Extract root domain (handle cases like subdomain.example.com)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // Validate TLD is at least 2 characters
      if (parts[parts.length - 1].length >= 2) {
        // Return last two parts (e.g., "example.com")
        return parts.slice(-2).join('.');
      }
    }
    
    // If we get here, hostname doesn't look like a valid domain
    return '';
  } catch (e) {
    // If URL parsing fails, check if it looks like a domain
    // Only process if it contains a dot (domain-like) or has protocol
    if (!url.includes('.')) {
      // No dots means it's not a valid domain
      return '';
    }
    
    // Try to extract domain manually using regex
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    if (match && match[1]) {
      let domain = match[1];
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      // Validate it looks like a domain (has at least one dot and valid TLD pattern)
      if (domain.includes('.') && domain.split('.').length >= 2) {
        const parts = domain.split('.');
        // Must have at least 2 parts and last part should be at least 2 chars (TLD)
        if (parts.length >= 2 && parts[parts.length - 1].length >= 2) {
          return parts.slice(-2).join('.');
        }
      }
    }
    return '';
  }
}

/**
 * Check if a domain is in the tracked sites list (subdomain-agnostic)
 * @param domain - Domain to check (e.g., "www.youtube.com")
 * @param trackedSites - Object mapping domains to limits
 * @returns The tracked domain key if found, null otherwise
 */
export function isDomainTracked(domain: string, trackedSites: TrackedSites): string | null {
  const normalizedDomain = extractDomain(domain);
  
  // Direct match
  if (trackedSites[normalizedDomain]) {
    return normalizedDomain;
  }
  
  // Check if any tracked domain matches (subdomain-agnostic)
  for (const trackedDomain of Object.keys(trackedSites)) {
    const normalizedTracked = extractDomain(trackedDomain);
    if (normalizedDomain === normalizedTracked) {
      return trackedDomain;
    }
  }
  
  return null;
}

/**
 * Get today's date in local timezone as "YYYY-MM-DD"
 * @returns Date string in format "YYYY-MM-DD"
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Type guard to check if value is a TrackedSites object
 */
function isTrackedSites(value: unknown): value is TrackedSites {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'number')
  );
}

/**
 * Type guard to check if value is a UsageData object
 */
function isUsageData(value: unknown): value is UsageData {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => 
      typeof v === 'object' && 
      v !== null && 
      !Array.isArray(v) &&
      Object.values(v).every((usage) => typeof usage === 'number')
    )
  );
}

/**
 * Type guard to check if value is a valid date string
 */
function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Type guard to check if value is a NotifiedDomains object
 */
function isNotifiedDomains(value: unknown): value is NotifiedDomains {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => 
      Array.isArray(v) && v.every((item) => typeof item === 'string')
    )
  );
}

/**
 * Get all storage data with defaults
 * @returns Promise resolving to StorageData
 */
export async function getStorageData(): Promise<StorageData> {
  const result = await chrome.storage.local.get(['trackedSites', 'usage', 'lastResetDate', 'notifiedDomains']);
  
  return {
    trackedSites: isTrackedSites(result.trackedSites) ? result.trackedSites : {},
    usage: isUsageData(result.usage) ? result.usage : {},
    lastResetDate: isDateString(result.lastResetDate) ? result.lastResetDate : getTodayDate(),
    notifiedDomains: isNotifiedDomains(result.notifiedDomains) ? result.notifiedDomains : {},
  };
}

/**
 * Update usage for a domain for today
 * @param domain - Domain to update
 * @param minutes - Minutes to add to current usage
 */
export async function updateUsage(domain: string, minutes: number): Promise<void> {
  const today = getTodayDate();
  const data = await getStorageData();
  
  if (!data.usage[today]) {
    data.usage[today] = {};
  }
  
  if (!data.usage[today][domain]) {
    data.usage[today][domain] = 0;
  }
  
  data.usage[today][domain] += minutes;
  
  await chrome.storage.local.set({
    usage: data.usage,
  });
}

/**
 * Get usage for a domain for today
 * @param domain - Domain to get usage for
 * @returns Promise resolving to minutes used today
 */
export async function getUsage(domain: string): Promise<number> {
  const today = getTodayDate();
  const data = await getStorageData();
  
  return data.usage[today]?.[domain] || 0;
}

/**
 * Get daily limit for a domain
 * @param domain - Domain to get limit for
 * @returns Promise resolving to limit in minutes, or null if not tracked
 */
export async function getLimit(domain: string): Promise<number | null> {
  const data = await getStorageData();
  const trackedDomain = isDomainTracked(domain, data.trackedSites);
  
  if (trackedDomain) {
    return data.trackedSites[trackedDomain];
  }
  
  return null;
}

/**
 * Check if a domain has been notified today
 * @param domain - Domain to check
 * @param date - Date string (defaults to today)
 * @returns Promise resolving to true if domain was already notified
 */
export async function isDomainNotified(domain: string, date?: string): Promise<boolean> {
  const today = date || getTodayDate();
  const data = await getStorageData();
  const notifiedList = data.notifiedDomains[today] || [];
  return notifiedList.includes(domain);
}

/**
 * Mark a domain as notified for today
 * @param domain - Domain to mark as notified
 * @param date - Date string (defaults to today)
 */
export async function markDomainAsNotified(domain: string, date?: string): Promise<void> {
  const today = date || getTodayDate();
  const data = await getStorageData();
  
  if (!data.notifiedDomains[today]) {
    data.notifiedDomains[today] = [];
  }
  
  // Only add if not already in the list
  if (!data.notifiedDomains[today].includes(domain)) {
    data.notifiedDomains[today].push(domain);
    await chrome.storage.local.set({
      notifiedDomains: data.notifiedDomains,
    });
  }
}

/**
 * Clear notified domains for a specific date (used for daily reset)
 * @param date - Date string (defaults to today)
 */
export async function clearNotifiedDomains(date?: string): Promise<void> {
  const targetDate = date || getTodayDate();
  const data = await getStorageData();
  
  if (data.notifiedDomains[targetDate]) {
    delete data.notifiedDomains[targetDate];
    await chrome.storage.local.set({
      notifiedDomains: data.notifiedDomains,
    });
  }
}

