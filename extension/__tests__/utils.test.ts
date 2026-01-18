import { describe, it, expect, beforeEach } from 'vitest';
import { chrome } from './setup';
import {
  extractDomain,
  isDomainTracked,
  getTodayDate,
  getStorageData,
  updateUsage,
  getUsage,
  getLimit,
} from '../src/utils';
import { createMockStorageData, resetMocks } from './setup';

describe('utils', () => {
  beforeEach(() => {
    resetMocks();
    chrome().storage.local.get.mockResolvedValue(createMockStorageData());
  });

  describe('extractDomain', () => {
    it('should extract domain from full URL', () => {
      expect(extractDomain('https://www.youtube.com/watch?v=123')).toBe('youtube.com');
    });

    it('should extract domain from URL without protocol', () => {
      expect(extractDomain('www.youtube.com/video')).toBe('youtube.com');
    });

    it('should extract domain from URL with subdomain', () => {
      expect(extractDomain('https://subdomain.example.com/path')).toBe('example.com');
    });

    it('should handle URLs without www', () => {
      expect(extractDomain('https://youtube.com')).toBe('youtube.com');
    });

    it('should handle invalid URLs gracefully', () => {
      expect(extractDomain('not-a-url')).toBe('');
    });
  });

  describe('isDomainTracked', () => {
    it('should find exact match', () => {
      const trackedSites = { 'youtube.com': 60 };
      expect(isDomainTracked('youtube.com', trackedSites)).toBe('youtube.com');
    });

    it('should find match with www prefix', () => {
      const trackedSites = { 'youtube.com': 60 };
      expect(isDomainTracked('www.youtube.com', trackedSites)).toBe('youtube.com');
    });

    it('should find match with subdomain', () => {
      const trackedSites = { 'youtube.com': 60 };
      expect(isDomainTracked('m.youtube.com', trackedSites)).toBe('youtube.com');
    });

    it('should return null for untracked domain', () => {
      const trackedSites = { 'youtube.com': 60 };
      expect(isDomainTracked('reddit.com', trackedSites)).toBeNull();
    });
  });

  describe('getTodayDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = getTodayDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today\'s date in local timezone', () => {
      const date = getTodayDate();
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(date).toBe(expected);
    });
  });

  describe('getStorageData', () => {
    it('should return storage data with defaults', async () => {
      chrome().storage.local.get.mockResolvedValue({});
      
      const data = await getStorageData();
      expect(data.trackedSites).toEqual({});
      expect(data.usage).toEqual({});
      expect(data.lastResetDate).toBe(getTodayDate());
    });

    it('should return existing storage data', async () => {
      const mockData = {
        trackedSites: { 'youtube.com': 60 },
        usage: { '2023-10-27': { 'youtube.com': 30 } },
        lastResetDate: '2023-10-27',
      };
      // @ts-ignore
      global.chrome.storage.local.get.mockResolvedValue(mockData);
      
      const data = await getStorageData();
      expect(data).toEqual(mockData);
    });
  });

  describe('updateUsage', () => {
    it('should add usage for a domain', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await updateUsage('youtube.com', 30);
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        usage: {
          [today]: {
            'youtube.com': 30,
          },
        },
      });
    });

    it('should accumulate usage for existing domain', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {
          [today]: {
            'youtube.com': 30,
          },
        },
        lastResetDate: today,
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await updateUsage('youtube.com', 15);
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        usage: {
          [today]: {
            'youtube.com': 45,
          },
        },
      });
    });
  });

  describe('getUsage', () => {
    it('should return usage for a domain', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {
          [today]: {
            'youtube.com': 45,
          },
        },
        lastResetDate: today,
      });
      
      const usage = await getUsage('youtube.com');
      expect(usage).toBe(45);
    });

    it('should return 0 for domain with no usage', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
      });
      
      const usage = await getUsage('youtube.com');
      expect(usage).toBe(0);
    });
  });

  describe('getLimit', () => {
    it('should return limit for tracked domain', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: { 'youtube.com': 60 },
        usage: {},
        lastResetDate: getTodayDate(),
      });
      
      const limit = await getLimit('youtube.com');
      expect(limit).toBe(60);
    });

    it('should return null for untracked domain', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: { 'youtube.com': 60 },
        usage: {},
        lastResetDate: getTodayDate(),
      });
      
      const limit = await getLimit('reddit.com');
      expect(limit).toBeNull();
    });
  });
});

