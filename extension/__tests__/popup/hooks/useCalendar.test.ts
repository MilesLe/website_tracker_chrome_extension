import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCalendar } from '../../../src/popup/hooks/useCalendar';
import * as apiModule from '../../../src/popup/utils/api';
import * as useUserIdModule from '../../../src/popup/hooks/useUserId';

vi.mock('../../../src/popup/utils/api');
vi.mock('../../../src/popup/hooks/useUserId');

describe('useCalendar', () => {
  const mockGetCalendarMonth = vi.mocked(apiModule.getCalendarMonth);
  const mockUseUserId = vi.mocked(useUserIdModule.useUserId);

  beforeEach(() => {
    // Clear mock call history but keep implementations
    vi.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
  });

  it('should load calendar data on mount', async () => {
    const testUserId = 'test-user-id';
    const mockCalendarData = {
      year: 2024,
      month: 1,
      days: [
        {
          date: '2024-01-15',
          totalUsage: 60,
          domainUsage: { 'youtube.com': 60 },
          limitReached: false,
          domains: [],
        },
      ],
    };

    mockUseUserId.mockReturnValue({
      userId: testUserId,
      isLoading: false,
    });
    mockGetCalendarMonth.mockResolvedValue(mockCalendarData);

    const { result } = renderHook(() => useCalendar(2024, 1));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.calendarData).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.calendarData).toEqual(mockCalendarData);
    expect(mockGetCalendarMonth).toHaveBeenCalledWith(2024, 1);
  });

  it('should use cached data if available', async () => {
    const testUserId = 'test-user-id';
    const cachedData = {
      year: 2024,
      month: 1,
      days: [],
    };

    // Set cache first
    sessionStorage.setItem('calendar_2024_1', JSON.stringify(cachedData));

    // Set up mocks BEFORE rendering the hook
    mockUseUserId.mockReturnValue({
      userId: testUserId,
      isLoading: false,
    });

    // IMPORTANT: Reset and set up the mock to return cached data
    // This ensures background fetch returns the same data as cache
    mockGetCalendarMonth.mockReset();
    mockGetCalendarMonth.mockResolvedValue(cachedData);

    const { result } = renderHook(() => useCalendar(2024, 1));

    // Should load from cache immediately (isLoading becomes false)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initially should have cached data
    expect(result.current.calendarData).toEqual(cachedData);
    
    // Wait for background fetch to be called
    await waitFor(() => {
      expect(mockGetCalendarMonth).toHaveBeenCalledWith(2024, 1);
    });

    // Wait for the background fetch promise to resolve and state to update
    // The mock returns the same cached data, so state should remain unchanged
    await waitFor(() => {
      // Verify state is still the cached data after background fetch completes
      expect(result.current.calendarData).toEqual(cachedData);
    }, { timeout: 200 });
  });

  it('should handle background fetch errors gracefully when cached data exists', async () => {
    const testUserId = 'test-user-id';
    const cachedData = {
      year: 2024,
      month: 1,
      days: [],
    };
    const backgroundFetchError = new Error('Network error');

    // Set cache first
    sessionStorage.setItem('calendar_2024_1', JSON.stringify(cachedData));

    // Set up mocks BEFORE rendering the hook
    mockUseUserId.mockReturnValue({
      userId: testUserId,
      isLoading: false,
    });

    // Mock the API to fail on background fetch
    mockGetCalendarMonth.mockReset();
    mockGetCalendarMonth.mockRejectedValue(backgroundFetchError);

    // Spy on console.error to verify error is logged
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCalendar(2024, 1));

    // Should load from cache immediately (isLoading becomes false)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have cached data displayed
    expect(result.current.calendarData).toEqual(cachedData);
    expect(result.current.error).toBe(null);
    
    // Wait for background fetch to be called
    await waitFor(() => {
      expect(mockGetCalendarMonth).toHaveBeenCalledWith(2024, 1);
    });

    // Wait a bit for the error to be caught
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching calendar in background:',
        backgroundFetchError
      );
    }, { timeout: 200 });

    // Verify cached data is still displayed and error state is not set
    expect(result.current.calendarData).toEqual(cachedData);
    expect(result.current.error).toBe(null);

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors', async () => {
    const testUserId = 'test-user-id';
    const error = new Error('Failed to load calendar');

    mockUseUserId.mockReturnValue({
      userId: testUserId,
      isLoading: false,
    });
    mockGetCalendarMonth.mockRejectedValue(error);

    const { result } = renderHook(() => useCalendar(2024, 1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.calendarData).toBe(null);
  });

  it('should not fetch if user ID is still loading', () => {
    mockUseUserId.mockReturnValue({
      userId: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useCalendar(2024, 1));

    expect(mockGetCalendarMonth).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should set error and stop loading if user ID fails to load', () => {
    mockUseUserId.mockReturnValue({
      userId: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useCalendar(2024, 1));

    expect(mockGetCalendarMonth).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).not.toBe(null);
    expect(result.current.error?.message).toBe('Failed to load user ID');
  });

  it('should refetch when month changes', async () => {
    const testUserId = 'test-user-id';
    const mockData1 = { year: 2024, month: 1, days: [] };
    const mockData2 = { year: 2024, month: 2, days: [] };

    mockUseUserId.mockReturnValue({
      userId: testUserId,
      isLoading: false,
    });
    mockGetCalendarMonth.mockResolvedValueOnce(mockData1);
    mockGetCalendarMonth.mockResolvedValueOnce(mockData2);

    const { result, rerender } = renderHook(
      ({ year, month }) => useCalendar(year, month),
      { initialProps: { year: 2024, month: 1 } }
    );

    await waitFor(() => {
      expect(result.current.calendarData).toEqual(mockData1);
    });

    rerender({ year: 2024, month: 2 });

    await waitFor(() => {
      expect(result.current.calendarData).toEqual(mockData2);
    });

    expect(mockGetCalendarMonth).toHaveBeenCalledTimes(2);
  });

  it('should ignore stale requests when navigating quickly between months', async () => {
    const testUserId = 'test-user-id';
    const mockData1 = { year: 2024, month: 1, days: [{ date: '2024-01-15', totalUsage: 10, domainUsage: {}, limitReached: false, domains: [] }] };
    const mockData2 = { year: 2024, month: 2, days: [{ date: '2024-02-15', totalUsage: 20, domainUsage: {}, limitReached: false, domains: [] }] };

    mockUseUserId.mockReturnValue({
      userId: testUserId,
      isLoading: false,
    });

    // Create promises that we can control
    let resolveRequest1: (value: typeof mockData1) => void;
    let resolveRequest2: (value: typeof mockData2) => void;
    
    const promise1 = new Promise<typeof mockData1>((resolve) => {
      resolveRequest1 = resolve;
    });
    const promise2 = new Promise<typeof mockData2>((resolve) => {
      resolveRequest2 = resolve;
    });

    mockGetCalendarMonth.mockReturnValueOnce(promise1);
    mockGetCalendarMonth.mockReturnValueOnce(promise2);

    const { result, rerender } = renderHook(
      ({ year, month }) => useCalendar(year, month),
      { initialProps: { year: 2024, month: 1 } }
    );

    // Start request for month 1
    await waitFor(() => {
      expect(mockGetCalendarMonth).toHaveBeenCalledWith(2024, 1);
    });

    // Quickly change to month 2 before month 1 completes
    rerender({ year: 2024, month: 2 });

    await waitFor(() => {
      expect(mockGetCalendarMonth).toHaveBeenCalledWith(2024, 2);
    });

    // Resolve month 2 request first (newer request completes quickly)
    resolveRequest2!(mockData2);
    await promise2;

    // Wait for month 2 data to be set
    await waitFor(() => {
      expect(result.current.calendarData).toEqual(mockData2);
    });

    // Now resolve month 1 request AFTER month 2 (stale request completes late)
    // This simulates the race condition where an older request completes after a newer one
    resolveRequest1!(mockData1);
    await promise1;

    // Wait a bit to ensure state updates have processed
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify that month 2 data is still displayed (not overwritten by stale month 1 data)
    expect(result.current.calendarData).toEqual(mockData2);
    expect(result.current.calendarData?.month).toBe(2);
  });
});
