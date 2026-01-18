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
  isDomainNotified,
  markDomainAsNotified,
  clearNotifiedDomains,
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
      expect(data.notifiedDomains).toEqual({});
    });

    it('should return existing storage data', async () => {
      const mockData = {
        trackedSites: { 'youtube.com': 60 },
        usage: { '2023-10-27': { 'youtube.com': 30 } },
        lastResetDate: '2023-10-27',
        notifiedDomains: { '2023-10-27': ['youtube.com'] },
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
        notifiedDomains: {},
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
        notifiedDomains: {},
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
        notifiedDomains: {},
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
        notifiedDomains: {},
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
        notifiedDomains: {},
      });
      
      const limit = await getLimit('youtube.com');
      expect(limit).toBe(60);
    });

    it('should return null for untracked domain', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: { 'youtube.com': 60 },
        usage: {},
        lastResetDate: getTodayDate(),
        notifiedDomains: {},
      });
      
      const limit = await getLimit('reddit.com');
      expect(limit).toBeNull();
    });
  });

  describe('isDomainNotified', () => {
    it('should return true if domain was notified today', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {
          [today]: ['youtube.com'],
        },
      });
      
      const notified = await isDomainNotified('youtube.com');
      expect(notified).toBe(true);
    });

    it('should return false if domain was not notified today', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {
          [today]: ['reddit.com'],
        },
      });
      
      const notified = await isDomainNotified('youtube.com');
      expect(notified).toBe(false);
    });

    it('should return false if no domains were notified today', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {},
      });
      
      const notified = await isDomainNotified('youtube.com');
      expect(notified).toBe(false);
    });

    it('should check specific date when provided', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: '2023-10-27',
        notifiedDomains: {
          '2023-10-27': ['youtube.com'],
          '2023-10-28': [],
        },
      });
      
      const notified = await isDomainNotified('youtube.com', '2023-10-27');
      expect(notified).toBe(true);
      
      const notNotified = await isDomainNotified('youtube.com', '2023-10-28');
      expect(notNotified).toBe(false);
    });
  });

  describe('markDomainAsNotified', () => {
    it('should mark domain as notified for today', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {},
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await markDomainAsNotified('youtube.com');
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        notifiedDomains: {
          [today]: ['youtube.com'],
        },
      });
    });

    it('should add domain to existing notified list', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {
          [today]: ['reddit.com'],
        },
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await markDomainAsNotified('youtube.com');
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        notifiedDomains: {
          [today]: ['reddit.com', 'youtube.com'],
        },
      });
    });

    it('should not add duplicate domain', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {
          [today]: ['youtube.com'],
        },
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await markDomainAsNotified('youtube.com');
      
      // Should not call set if domain is already in the list
      expect(chrome().storage.local.set).not.toHaveBeenCalled();
    });

    it('should mark domain for specific date when provided', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: '2023-10-27',
        notifiedDomains: {},
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await markDomainAsNotified('youtube.com', '2023-10-28');
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        notifiedDomains: {
          '2023-10-28': ['youtube.com'],
        },
      });
    });
  });

  describe('clearNotifiedDomains', () => {
    it('should clear notified domains for today', async () => {
      const today = getTodayDate();
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: today,
        notifiedDomains: {
          [today]: ['youtube.com', 'reddit.com'],
        },
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await clearNotifiedDomains();
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        notifiedDomains: {},
      });
    });

    it('should clear notified domains for specific date', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: '2023-10-27',
        notifiedDomains: {
          '2023-10-27': ['youtube.com'],
          '2023-10-28': ['reddit.com'],
        },
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await clearNotifiedDomains('2023-10-27');
      
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        notifiedDomains: {
          '2023-10-28': ['reddit.com'],
        },
      });
    });

    it('should not modify storage if date does not exist', async () => {
      chrome().storage.local.get.mockResolvedValue({
        trackedSites: {},
        usage: {},
        lastResetDate: '2023-10-27',
        notifiedDomains: {
          '2023-10-27': ['youtube.com'],
        },
      });
      chrome().storage.local.set.mockResolvedValue(undefined);
      
      await clearNotifiedDomains('2023-10-28');
      
      // Should not call set if date doesn't exist
      expect(chrome().storage.local.set).not.toHaveBeenCalled();
    });
  });
});

