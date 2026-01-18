/**
 * Type declarations for test environment globals
 * This file extends the global scope with our test mocks
 * 
 * Best Practice: Centralize all global type declarations here
 * to maintain type safety across all test files
 */

import type { MockedFunction } from 'vitest';
import type { StorageData, TrackedSites, UsageData } from '../src/types';

// Type definitions for Chrome API mocks
// Using proper types instead of 'any' where possible

type StorageGetCallback = (items: { [key: string]: unknown }) => void;
type StorageGetResult = Promise<{ [key: string]: unknown } | StorageData> | void;
type StorageSetCallback = () => void;
type StorageSetResult = Promise<void> | void;
type StorageRemoveCallback = () => void;
type StorageRemoveResult = Promise<void> | void;
type StorageClearResult = Promise<void> | void;

type TabQueryCallback = (result: chrome.tabs.Tab[]) => void;
type TabQueryResult = Promise<chrome.tabs.Tab[] | Partial<chrome.tabs.Tab>[]> | void;
type TabGetCallback = (tab: chrome.tabs.Tab) => void;
type TabGetResult = Promise<chrome.tabs.Tab | Partial<chrome.tabs.Tab>> | void;

type WindowGetCallback = (window: chrome.windows.Window) => void;
type WindowGetResult = Promise<chrome.windows.Window | Partial<chrome.windows.Window>> | void;

type IdleQueryStateCallback = (newState: chrome.idle.IdleState) => void;
type IdleQueryStateResult = Promise<chrome.idle.IdleState> | void;
type IdleSetDetectionIntervalResult = void;

type AlarmCreateResult = void;
type AlarmListener = (alarm: chrome.alarms.Alarm) => void;

type NotificationCreateCallback = (notificationId: string) => void;
type NotificationCreateResult = string | void;

// Define the shape of our mocked Chrome API
// Export for use in setup.ts
export interface MockChrome {
  storage: {
    local: {
      get: MockedFunction<
        (keys?: string | string[] | { [key: string]: unknown } | null, callback?: StorageGetCallback) => StorageGetResult
      > & {
        mockResolvedValue: (value: { [key: string]: unknown } | StorageData) => void;
      };
      set: MockedFunction<
        (items: { [key: string]: unknown }, callback?: StorageSetCallback) => StorageSetResult
      >;
      remove: MockedFunction<
        (keys: string | string[], callback?: StorageRemoveCallback) => StorageRemoveResult
      >;
      clear: MockedFunction<() => StorageClearResult>;
    };
    session: {
      get: MockedFunction<
        (keys?: string | string[] | { [key: string]: unknown } | null, callback?: StorageGetCallback) => StorageGetResult
      >;
      set: MockedFunction<
        (items: { [key: string]: unknown }, callback?: StorageSetCallback) => StorageSetResult
      >;
      remove: MockedFunction<
        (keys: string | string[], callback?: StorageRemoveCallback) => StorageRemoveResult
      >;
      clear: MockedFunction<() => StorageClearResult>;
    };
    onChanged: {
      addListener: MockedFunction<
        (callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) => void
      >;
      removeListener: MockedFunction<
        (callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) => void
      >;
    };
  };
  tabs: {
    query: MockedFunction<
      (queryInfo: chrome.tabs.QueryInfo, callback?: TabQueryCallback) => TabQueryResult
    > & {
      mockResolvedValue: (value: chrome.tabs.Tab[] | Partial<chrome.tabs.Tab>[]) => void;
    };
    get: MockedFunction<
      (tabId: number, callback?: TabGetCallback) => TabGetResult
    > & {
      mockResolvedValue: (value: chrome.tabs.Tab | Partial<chrome.tabs.Tab>) => void;
    };
    onActivated: {
      addListener: MockedFunction<
        (callback: (activeInfo: chrome.tabs.TabActiveInfo) => void) => void
      >;
    };
    onUpdated: {
      addListener: MockedFunction<
        (callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void) => void
      >;
    };
  };
  windows: {
    get: MockedFunction<
      (windowId: number, callback?: WindowGetCallback) => WindowGetResult
    > & {
      mockResolvedValue: (value: chrome.windows.Window | Partial<chrome.windows.Window>) => void;
    };
    getCurrent: MockedFunction<
      (callback?: WindowGetCallback) => WindowGetResult
    > & {
      mockResolvedValue: (value: chrome.windows.Window | Partial<chrome.windows.Window>) => void;
    };
    onFocusChanged: {
      addListener: MockedFunction<
        (callback: (windowId: number) => void) => void
      >;
    };
  };
  idle: {
    queryState: MockedFunction<
      (detectionIntervalInSeconds: number, callback?: IdleQueryStateCallback) => IdleQueryStateResult
    >;
    setDetectionInterval: MockedFunction<
      (intervalInSeconds: number) => IdleSetDetectionIntervalResult
    >;
    onStateChanged: {
      addListener: MockedFunction<
        (callback: (newState: chrome.idle.IdleState) => void) => void
      >;
    };
  };
  alarms: {
    create: MockedFunction<
      (name: string, alarmInfo: chrome.alarms.AlarmCreateInfo) => AlarmCreateResult
    >;
    onAlarm: {
      addListener: MockedFunction<(callback: AlarmListener) => void>;
    };
  };
  notifications: {
    create: MockedFunction<
      (options: chrome.notifications.NotificationOptions<true>, callback?: NotificationCreateCallback) => NotificationCreateResult
    >;
  };
  runtime: {
    getURL: MockedFunction<(path: string) => string>;
  };
}

// Extend globalThis with our test mocks
// Note: We use 'any' here because we're replacing the real chrome types
// with our mock types. In tests, we'll access via getMockChrome() helper
// or use type assertions where needed.
declare global {
  // eslint-disable-next-line no-var
  var chrome: any; // MockChrome in test environment, but TypeScript sees real types
  // eslint-disable-next-line no-var
  var fetch: typeof globalThis.fetch;
}

export {};
