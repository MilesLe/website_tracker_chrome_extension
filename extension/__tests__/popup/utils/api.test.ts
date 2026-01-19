import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  syncUsage,
  getCalendarMonth,
  getDayDetails,
  syncTrackedSites,
  getTrackedSites,
  getUserId,
} from '../../../src/popup/utils/api';
import { resetMocks, chrome } from '../../setup';

describe('API utilities', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Create spy fresh in each test to avoid issues with resetMocks
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('getUserId', () => {
    it('should use hardcoded user ID "123" in development mode (localhost)', async () => {
      // Clear any existing userId from storage
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const userId = await getUserId();

      expect(userId).toBe('123');
      expect(chrome().storage.local.set).toHaveBeenCalledWith({ userId: '123' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV MODE]')
      );
    });

    it('should return hardcoded user ID "123" in dev mode regardless of storage', async () => {
      // In dev mode, the function always returns '123' and doesn't check storage
      chrome().storage.local.get.mockResolvedValue({ userId: 'some-other-id' });
      chrome().storage.local.set.mockResolvedValue(undefined);

      const userId = await getUserId();

      expect(userId).toBe('123');
      // Should log dev mode
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV MODE]')
      );
      // Should store '123' even if storage had a different value
      expect(chrome().storage.local.set).toHaveBeenCalledWith({ userId: '123' });
    });

    it('should store and return the dev user ID consistently', async () => {
      // Test that dev mode consistently uses '123' even when called multiple times
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const userId1 = await getUserId();
      const userId2 = await getUserId();

      // Both calls should return '123' in dev mode
      expect(userId1).toBe('123');
      expect(userId2).toBe('123');
      // Should have logged dev mode for both calls
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  // Note: getUserId is also tested indirectly through other functions
  // as it's called internally by the API functions

  describe('syncUsage', () => {
    it('should sync usage data', async () => {
      const mockResponse = {
        status: 'success',
        synced: 2,
        date: '2024-01-15',
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // In dev mode (localhost), getUserId returns '123'
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const result = await syncUsage('2024-01-15', { 'youtube.com': 60 });

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/usage/sync',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-User-ID': '123', // Dev mode uses '123'
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      // In dev mode (localhost), getUserId returns '123'
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      await expect(
        syncUsage('2024-01-15', { 'youtube.com': 60 })
      ).rejects.toThrow();
    });
  });

  describe('getCalendarMonth', () => {
    it('should fetch calendar month data', async () => {
      const mockResponse = {
        year: 2024,
        month: 1,
        days: [],
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // In dev mode (localhost), getUserId returns '123'
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const result = await getCalendarMonth(2024, 1);

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/usage/calendar'),
        expect.any(Object)
      );
    });
  });

  describe('getDayDetails', () => {
    it('should fetch day details', async () => {
      const mockResponse = {
        date: '2024-01-15',
        totalUsage: 60,
        totalLimit: 90,
        domains: [],
        metrics: {},
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // In dev mode (localhost), getUserId returns '123'
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const result = await getDayDetails('2024-01-15');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('syncTrackedSites', () => {
    it('should sync tracked sites', async () => {
      const mockResponse = {
        status: 'success',
        synced: 2,
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // In dev mode (localhost), getUserId returns '123'
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const result = await syncTrackedSites({ 'youtube.com': 60 });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTrackedSites', () => {
    it('should fetch tracked sites', async () => {
      const mockResponse = {
        trackedSites: { 'youtube.com': 60 },
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // In dev mode (localhost), getUserId returns '123'
      chrome().storage.local.get.mockResolvedValue({});
      chrome().storage.local.set.mockResolvedValue(undefined);

      const result = await getTrackedSites();

      expect(result).toEqual(mockResponse);
    });
  });
});
