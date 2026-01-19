import { useState, useEffect, useRef } from 'react';
import { getCalendarMonth, type CalendarMonthResponse } from '../utils/api';
import { useUserId } from './useUserId';
import { syncTodayUsage } from '../../utils/sync';

/**
 * Hook to fetch calendar data for a specific month.
 */
export function useCalendar(year: number, month: number) {
  const { userId, isLoading: userIdLoading } = useUserId();
  const [calendarData, setCalendarData] = useState<CalendarMonthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track the current request to prevent stale updates
  const requestIdRef = useRef(0);

  useEffect(() => {
    // If user ID is still loading, wait
    if (userIdLoading) {
      return;
    }
    
    // If user ID failed to load, set loading to false and show error
    if (!userId) {
      setIsLoading(false);
      setError(new Error('Failed to load user ID'));
      return;
    }

    // Generate a unique request ID for this effect run
    const currentRequestId = ++requestIdRef.current;

    async function loadCalendar() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get from cache first
        const cacheKey = `calendar_${year}_${month}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Only update if this is still the current request
            if (currentRequestId === requestIdRef.current) {
              setCalendarData(parsed);
              setIsLoading(false);
            }
            // Still fetch in background to update cache (with sync)
            // Catch errors silently since we already have cached data
            fetchCalendar(currentRequestId).catch((err) => {
              console.error('Error fetching calendar in background:', err);
              // Don't set error state - we have cached data to display
            });
            return;
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
        
        await fetchCalendar(currentRequestId);
      } catch (err) {
        // Only update error state if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          console.error('Error loading calendar:', err);
          setError(err instanceof Error ? err : new Error('Failed to load calendar'));
          setIsLoading(false);
        }
      }
    }

    async function fetchCalendar(requestId: number) {
      try {
        // Sync today's usage data before fetching calendar to ensure backend has latest data
        // This is especially important for the current day which may not have been synced yet
        try {
          await syncTodayUsage();
        } catch (syncError) {
          // Log but don't fail - sync errors shouldn't prevent calendar from loading
          console.warn('Failed to sync today\'s usage before fetching calendar:', syncError);
        }
        
        const data = await getCalendarMonth(year, month);
        
        // Only update state if this is still the current request
        // This prevents stale data from overwriting newer requests
        if (requestId === requestIdRef.current) {
          setCalendarData(data);
          
          // Cache the data
          const cacheKey = `calendar_${year}_${month}`;
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (err) {
        // Only throw if this is still the current request
        if (requestId === requestIdRef.current) {
          throw err;
        }
      } finally {
        // Only update loading state if this is still the current request
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadCalendar();
  }, [year, month, userId, userIdLoading]);

  return { calendarData, isLoading, error };
}
