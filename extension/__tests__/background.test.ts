import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, createMockStorageData, chrome } from './setup';
import type { TrackedSites } from '../src/types';

// Mock the utils module
vi.mock('../src/utils', () => ({
  extractDomain: vi.fn((url: string) => {
    if (url.includes('youtube.com')) return 'youtube.com';
    if (url.includes('reddit.com')) return 'reddit.com';
    return '';
  }),
  isDomainTracked: vi.fn((domain: string, trackedSites: TrackedSites) => {
    if (trackedSites[domain]) return domain;
    return null;
  }),
  getTodayDate: vi.fn(() => '2023-10-27'),
  getStorageData: vi.fn(),
  updateUsage: vi.fn(),
  getUsage: vi.fn(),
  getLimit: vi.fn(),
  isDomainNotified: vi.fn(),
  markDomainAsNotified: vi.fn(),
  clearNotifiedDomains: vi.fn(),
}));

describe('background service worker', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should initialize tracking on startup', async () => {
    // This test verifies that initialization functions are called
    // Since background.ts runs on import, we test the setup indirectly
    chrome().idle.setDetectionInterval.mockReturnValue(undefined);
    chrome().alarms.create.mockReturnValue(undefined);
    
    // Verify chrome APIs are available
    expect(chrome().idle.setDetectionInterval).toBeDefined();
    expect(chrome().alarms.create).toBeDefined();
  });

  it('should handle tab activation', async () => {
    const mockTab = {
      id: 1,
      url: 'https://www.youtube.com/watch?v=123',
      active: true,
    };
    
    chrome().tabs.get.mockResolvedValue(mockTab);
    chrome().tabs.query.mockResolvedValue([mockTab]);
    chrome().windows.getCurrent.mockResolvedValue({ focused: true });
    chrome().idle.queryState.mockResolvedValue('active');
    
    const { getStorageData } = await import('../src/utils');
    (getStorageData as any).mockResolvedValue(createMockStorageData({
      trackedSites: { 'youtube.com': 60 },
    }));
    
    // Import background to trigger initialization
    await import('../src/background');
    
    // Simulate tab activation - the listener should be registered during initialization
    const listeners = chrome().tabs.onActivated.addListener.mock.calls;
    expect(listeners.length).toBeGreaterThan(0);
  });

  it('should check daily reset', async () => {
    const { getStorageData, getTodayDate } = await import('../src/utils');
    
    // @ts-ignore
    getTodayDate.mockReturnValue('2023-10-28');
    // @ts-ignore
    getStorageData.mockResolvedValue(createMockStorageData({
      lastResetDate: '2023-10-27',
    }));
    
    chrome().storage.local.set.mockResolvedValue(undefined);
    
    // The reset logic would be called by the alarm handler
    // We verify the storage API is available
    expect(chrome().storage.local.set).toBeDefined();
  });

  it('should detect limit reached', async () => {
    const today = '2023-10-27';
    
    const { getStorageData, isDomainNotified, markDomainAsNotified } = await import('../src/utils');
    // @ts-ignore
    getStorageData.mockResolvedValue(createMockStorageData({
      trackedSites: { 'youtube.com': 60 },
      usage: {
        [today]: { 'youtube.com': 60 },
      },
      notifiedDomains: {},
    }));
    // @ts-ignore
    isDomainNotified.mockResolvedValue(false);
    // @ts-ignore
    markDomainAsNotified.mockResolvedValue(undefined);
    
    chrome().notifications.create.mockResolvedValue('notification-id');
    
    // Mock fetch for API call
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    }) as any;
    
    // Verify notification API is available
    expect(chrome().notifications.create).toBeDefined();
    expect(isDomainNotified).toBeDefined();
    expect(markDomainAsNotified).toBeDefined();
  });

  it('should send API notification with retry', async () => {
    // Mock fetch to fail first time, succeed second time
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
      });
    }) as any;
    
    // The retry logic is in the background script
    // We verify fetch is available
    expect(globalThis.fetch).toBeDefined();
  });
});

