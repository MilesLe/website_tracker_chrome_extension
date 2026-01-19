import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncUsage,
  getCalendarMonth,
  getDayDetails,
  syncTrackedSites,
  getTrackedSites,
} from '../../../src/popup/utils/api';
import { resetMocks, chrome } from '../../setup';

describe('API utilities', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  // Note: getUserId is tested indirectly through other functions
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

      chrome().storage.local.get.mockResolvedValue({ userId: 'test-user' });

      const result = await syncUsage('2024-01-15', { 'youtube.com': 60 });

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/usage/sync',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-User-ID': 'test-user',
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

      chrome().storage.local.get.mockResolvedValue({ userId: 'test-user' });

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

      chrome().storage.local.get.mockResolvedValue({ userId: 'test-user' });

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

      chrome().storage.local.get.mockResolvedValue({ userId: 'test-user' });

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

      chrome().storage.local.get.mockResolvedValue({ userId: 'test-user' });

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

      chrome().storage.local.get.mockResolvedValue({ userId: 'test-user' });

      const result = await getTrackedSites();

      expect(result).toEqual(mockResponse);
    });
  });
});
