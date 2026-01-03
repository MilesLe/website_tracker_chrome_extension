import { vi } from 'vitest';

// Mock chrome APIs
const mockChrome = {
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

// @ts-ignore
global.chrome = mockChrome;

// Helper to create mock storage data
export function createMockStorageData(overrides = {}) {
  return {
    trackedSites: {},
    usage: {},
    lastResetDate: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

// Helper to reset all mocks
export function resetMocks() {
  Object.values(mockChrome.storage.local).forEach((fn: any) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  Object.values(mockChrome.storage.session).forEach((fn: any) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  mockChrome.tabs.query.mockClear();
  mockChrome.tabs.get.mockClear();
  mockChrome.windows.getCurrent.mockClear();
  mockChrome.idle.queryState.mockClear();
  mockChrome.notifications.create.mockClear();
}

