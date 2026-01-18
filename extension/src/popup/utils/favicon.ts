/**
 * Utility functions for fetching and displaying website favicons
 */

/**
 * Get the favicon URL for a domain using Google's Favicon API
 * @param domain - The domain name (e.g., "example.com")
 * @param size - The size of the favicon (default: 32)
 * @returns The favicon URL
 */
export function getFaviconUrl(domain: string, size: number = 32): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/**
 * Get the first letter of a domain for fallback display
 * @param domain - The domain name (e.g., "example.com")
 * @returns The first letter in uppercase
 */
export function getDomainInitial(domain: string): string {
  if (!domain || domain.length === 0) {
    return '?';
  }
  // Remove protocol and www if present, then get first character
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '');
  return cleanDomain.charAt(0).toUpperCase();
}
