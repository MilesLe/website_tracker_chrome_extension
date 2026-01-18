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

/**
 * Validates a limit value
 * @param limit - Limit value to validate
 * @returns true if limit is a valid positive integer, false otherwise
 */
export function validateLimit(limit: string): boolean {
  // Check if string contains decimal point
  if (limit.includes('.')) {
    return false;
  }
  const num = parseInt(limit, 10);
  return !isNaN(num) && num > 0 && num.toString() === limit.trim();
}
