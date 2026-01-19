import { useState, useEffect } from 'react';
import { getCalendarMonth, type CalendarMonthResponse } from '../utils/api';
import { useUserId } from './useUserId';

/**
 * Hook to fetch calendar data for a specific month.
 */
export function useCalendar(year: number, month: number) {
  const { userId } = useUserId();
  const [calendarData, setCalendarData] = useState<CalendarMonthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

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
            setCalendarData(parsed);
            setIsLoading(false);
            // Still fetch in background to update cache
            // Catch errors silently since we already have cached data
            fetchCalendar().catch((err) => {
              console.error('Error fetching calendar in background:', err);
              // Don't set error state - we have cached data to display
            });
            return;
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
        
        await fetchCalendar();
      } catch (err) {
        console.error('Error loading calendar:', err);
        setError(err instanceof Error ? err : new Error('Failed to load calendar'));
        setIsLoading(false);
      }
    }

    async function fetchCalendar() {
      try {
        const data = await getCalendarMonth(year, month);
        setCalendarData(data);
        
        // Cache the data
        const cacheKey = `calendar_${year}_${month}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        throw err;
      } finally {
        setIsLoading(false);
      }
    }

    loadCalendar();
  }, [year, month, userId]);

  return { calendarData, isLoading, error };
}
