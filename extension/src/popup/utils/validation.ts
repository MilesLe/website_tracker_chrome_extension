/**
 * Validates a domain string
 * @param domain - Domain string to validate
 * @returns true if domain is valid, false otherwise
 */
export function validateDomain(domain: string): boolean {
  // Basic domain validation
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  const simpleDomainRegex = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$/i;
  
  // Remove www. if present for validation
  const cleanDomain = domain.replace(/^www\./i, '');
  
  return simpleDomainRegex.test(cleanDomain) || domainRegex.test(cleanDomain);
}

import { parseTimeString } from './timeFormat';

/**
 * Validates a time limit value (accepts hours/minutes format or plain minutes)
 * @param limit - Time limit value to validate (e.g., "2h 30m", "2h", "30m", or "150")
 * @returns true if limit is valid and converts to positive minutes, false otherwise
 */
export function validateLimit(limit: string): boolean {
  const minutes = parseTimeString(limit);
  return minutes !== null && minutes > 0;
}
