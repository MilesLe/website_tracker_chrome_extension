/**
 * Utility functions for converting between minutes and hours/minutes format
 * Storage always uses minutes, but display and input use hours/minutes format
 */

export interface TimeDisplay {
  hours: number;
  minutes: number;
}

/**
 * Converts minutes to hours and minutes format
 * @param totalMinutes - Total minutes to convert
 * @returns Object with hours and minutes
 */
export function minutesToHoursMinutes(totalMinutes: number): TimeDisplay {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return { hours, minutes };
}

/**
 * Formats minutes as a human-readable string (e.g., "2h 30m" or "45m")
 * @param totalMinutes - Total minutes to format
 * @returns Formatted string
 */
export function formatMinutes(totalMinutes: number): string {
  const { hours, minutes } = minutesToHoursMinutes(totalMinutes);
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

/**
 * Parses a time string in hours/minutes format and converts to minutes
 * Accepts formats like:
 * - "2h 30m" or "2h30m"
 * - "2h" (hours only)
 * - "30m" (minutes only)
 * - "150" (just a number, treated as minutes for backward compatibility)
 * @param timeString - Time string to parse
 * @returns Minutes as a number, or null if invalid
 */
export function parseTimeString(timeString: string): number | null {
  const trimmed = timeString.trim().toLowerCase();
  
  // Reject negative numbers
  if (trimmed.startsWith('-')) {
    return null;
  }
  
  // Reject decimal numbers
  if (trimmed.includes('.')) {
    return null;
  }
  
  // If it's just a number, treat as minutes (for backward compatibility)
  const justNumber = /^\d+$/.test(trimmed);
  if (justNumber) {
    const minutes = parseInt(trimmed, 10);
    return minutes > 0 ? minutes : null;
  }
  
  // Parse hours and minutes format (e.g., "2h 30m", "2h30m", "2h", "30m")
  // First check for hours with optional minutes
  const hourWithMinutesMatch = trimmed.match(/^(\d+)\s*h\s*(\d+)\s*m$/);
  const hourOnlyMatch = trimmed.match(/^(\d+)\s*h$/);
  const minuteOnlyMatch = trimmed.match(/^(\d+)\s*m$/);
  
  if (hourWithMinutesMatch) {
    // Format: "2h 30m" or "2h30m"
    const hours = parseInt(hourWithMinutesMatch[1], 10);
    const minutes = parseInt(hourWithMinutesMatch[2], 10);
    
    // Validate ranges
    if (hours < 0 || minutes < 0 || minutes >= 60) {
      return null;
    }
    
    return hours * 60 + minutes;
  }
  
  if (hourOnlyMatch) {
    // Format: "2h"
    const hours = parseInt(hourOnlyMatch[1], 10);
    
    // Validate range - reject zero hours
    if (hours <= 0) {
      return null;
    }
    
    return hours * 60;
  }
  
  if (minuteOnlyMatch) {
    // Format: "30m"
    const minutes = parseInt(minuteOnlyMatch[1], 10);
    
    // Validate range
    if (minutes < 0 || minutes >= 60) {
      return null;
    }
    
    return minutes > 0 ? minutes : null;
  }
  
  // If no valid format matched, return null
  return null;
}

/**
 * Formats a time range display (e.g., "1h 30m / 2h")
 * @param usageMinutes - Usage in minutes
 * @param limitMinutes - Limit in minutes
 * @returns Formatted string
 */
export function formatTimeRange(usageMinutes: number, limitMinutes: number): string {
  const usageFormatted = formatMinutes(usageMinutes);
  const limitFormatted = formatMinutes(limitMinutes);
  return `${usageFormatted} / ${limitFormatted}`;
}
