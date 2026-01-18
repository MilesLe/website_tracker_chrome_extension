import { useState } from 'react';
import { getStorageData, extractDomain } from '../../utils';
import { validateDomain, validateLimit } from '../utils/validation';

export interface DomainManagementError {
  message: string;
}

/**
 * Hook to manage domain operations (add/remove)
 */
export function useDomainManagement() {
  const [error, setError] = useState<DomainManagementError | null>(null);

  async function addDomain(domainInput: string, limitInput: string): Promise<boolean> {
    setError(null);
    
    if (!domainInput.trim()) {
      setError({ message: 'Please enter a domain name' });
      return false;
    }
    
    const domain = domainInput.trim().toLowerCase();
    
    // Normalize domain (remove protocol, www, paths)
    const normalizedDomain = extractDomain(domain);
    
    if (!normalizedDomain) {
      setError({ message: 'Invalid domain format' });
      return false;
    }
    
    if (!validateDomain(normalizedDomain)) {
      setError({ message: 'Invalid domain format' });
      return false;
    }
    
    if (!validateLimit(limitInput)) {
      setError({ message: 'Please enter a valid positive number for the limit' });
      return false;
    }
    
    const limit = parseInt(limitInput, 10);
    
    try {
      // Check if domain already exists
      const data = await getStorageData();
      if (data.trackedSites[normalizedDomain]) {
        setError({ message: 'This domain is already being tracked' });
        return false;
      }
      
      // Add domain
      const newTrackedSites = {
        ...data.trackedSites,
        [normalizedDomain]: limit,
      };
      
      await chrome.storage.local.set({
        trackedSites: newTrackedSites,
      });
      
      setError(null);
      return true;
    } catch (err) {
      setError({ message: 'Failed to add domain. Please try again.' });
      console.error('Error adding domain:', err);
      return false;
    }
  }

  async function removeDomain(domain: string): Promise<void> {
    try {
      const data = await getStorageData();
      const newTrackedSites = { ...data.trackedSites };
      delete newTrackedSites[domain];
      
      await chrome.storage.local.set({
        trackedSites: newTrackedSites,
      });
    } catch (err) {
      console.error('Error removing domain:', err);
      throw err;
    }
  }

  return {
    addDomain,
    removeDomain,
    error,
    clearError: () => setError(null),
  };
}
