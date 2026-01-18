import { vi } from 'vitest';
import type { MockChrome } from './global.d';
import type { StorageData } from '../src/types';

// Mock chrome APIs
const mockChrome: MockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    session: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    onActivated: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
  windows: {
    get: vi.fn(),
    getCurrent: vi.fn(),
    onFocusChanged: {
      addListener: vi.fn(),
    },
  },
  idle: {
    queryState: vi.fn(),
    setDetectionInterval: vi.fn(),
    onStateChanged: {
      addListener: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  },
};

// Set up global chrome mock with proper typing
// Using globalThis ensures cross-environment compatibility
// Type assertion needed because we're replacing the real chrome type with our mock
(globalThis as any).chrome = mockChrome;

// Export typed getter for convenience in tests
// This helper provides type-safe access to the mocked chrome API
export function getMockChrome(): MockChrome {
  return (globalThis as any).chrome;
}

// Shorthand helper for accessing chrome mock with proper typing
export const chrome = () => (globalThis as any).chrome as MockChrome;

// Helper to create mock storage data with proper typing
export function createMockStorageData(
  overrides: Partial<StorageData> = {}
): StorageData {
  const today = new Date().toISOString().split('T')[0];
  return {
    trackedSites: {},
    usage: {},
    lastResetDate: today,
    ...overrides,
  };
}

// Helper to reset all mocks
// Using type guards to safely check for mock methods
function isMockFunction(fn: unknown): fn is { mockClear: () => void } {
  return typeof fn === 'function' && 'mockClear' in fn;
}

export function resetMocks(): void {
  // Reset storage.local mocks
  Object.values(mockChrome.storage.local).forEach((fn) => {
    if (isMockFunction(fn)) {
      fn.mockClear();
    }
  });
  
  // Reset storage.session mocks
  Object.values(mockChrome.storage.session).forEach((fn) => {
    if (isMockFunction(fn)) {
      fn.mockClear();
    }
  });
  
  // Reset other mocks
  mockChrome.tabs.query.mockClear();
  mockChrome.tabs.get.mockClear();
  mockChrome.windows.getCurrent.mockClear();
  mockChrome.idle.queryState.mockClear();
  mockChrome.notifications.create.mockClear();
}

