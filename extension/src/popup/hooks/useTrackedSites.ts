import { useState, useEffect } from 'react';
import type { TrackedSites } from '../../types';
import { getStorageData, getTodayDate } from '../../utils';

/**
 * Hook to manage tracked sites data and usage
 * Handles loading data from storage and listening to storage changes
 */
export function useTrackedSites() {
  const [trackedSites, setTrackedSites] = useState<TrackedSites>({});
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    try {
      setIsLoading(true);
      const data = await getStorageData();
      setTrackedSites(data.trackedSites);
      
      const today = getTodayDate();
      setUsage(data.usage[today] || {});
    } catch (error) {
      console.error('Error loading tracked sites data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    
    // Listen for storage changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.trackedSites || changes.usage) {
        loadData();
      }
    };
    
    chrome.storage.onChanged.addListener(listener);
    
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return {
    trackedSites,
    usage,
    isLoading,
    reload: loadData,
  };
}
