import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { chrome, resetMocks, createMockStorageData } from '../../setup';
import { useTrackedSites } from '../../../src/popup/hooks/useTrackedSites';
import * as utils from '../../../src/utils';

// Mock the utils module
vi.mock('../../../src/utils', () => ({
  getStorageData: vi.fn(),
  getTodayDate: vi.fn(),
}));

describe('useTrackedSites', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    (utils.getTodayDate as any).mockReturnValue('2023-10-27');
  });

  it('should load initial data', async () => {
    const mockData = createMockStorageData({
      trackedSites: { 'youtube.com': 60 },
      usage: {
        '2023-10-27': { 'youtube.com': 30 },
      },
    });

    (utils.getStorageData as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTrackedSites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trackedSites).toEqual({ 'youtube.com': 60 });
    expect(result.current.usage).toEqual({ 'youtube.com': 30 });
  });

  it('should handle empty data', async () => {
    const mockData = createMockStorageData({
      trackedSites: {},
      usage: {},
    });

    (utils.getStorageData as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTrackedSites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trackedSites).toEqual({});
    expect(result.current.usage).toEqual({});
  });

  it('should set loading state initially', () => {
    (utils.getStorageData as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useTrackedSites());

    expect(result.current.isLoading).toBe(true);
  });

  it('should listen to storage changes', async () => {
    const mockData = createMockStorageData({
      trackedSites: { 'youtube.com': 60 },
      usage: { '2023-10-27': { 'youtube.com': 30 } },
    });

    (utils.getStorageData as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTrackedSites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify listener was added
    expect(chrome().storage.onChanged.addListener).toHaveBeenCalled();

    // Simulate storage change
    const listener = chrome().storage.onChanged.addListener.mock.calls[0][0];
    listener({ trackedSites: {} });

    await waitFor(() => {
      expect(utils.getStorageData).toHaveBeenCalledTimes(2);
    });
  });

  it('should clean up listener on unmount', async () => {
    const mockData = createMockStorageData();
    (utils.getStorageData as any).mockResolvedValue(mockData);

    const { unmount } = renderHook(() => useTrackedSites());

    await waitFor(() => {
      expect(chrome().storage.onChanged.addListener).toHaveBeenCalled();
    });

    unmount();

    expect(chrome().storage.onChanged.removeListener).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (utils.getStorageData as any).mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useTrackedSites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading tracked sites data:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
