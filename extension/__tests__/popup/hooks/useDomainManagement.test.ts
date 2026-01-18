import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { chrome, resetMocks, createMockStorageData } from '../../setup';
import { useDomainManagement } from '../../../src/popup/hooks/useDomainManagement';
import * as utils from '../../../src/utils';
import * as validation from '../../../src/popup/utils/validation';

// Mock the utils and validation modules
vi.mock('../../../src/utils', () => ({
  getStorageData: vi.fn(),
  extractDomain: vi.fn((domain: string) => {
    if (domain.includes('youtube.com')) return 'youtube.com';
    if (domain.includes('reddit.com')) return 'reddit.com';
    return domain.replace(/^www\./i, '').replace(/^https?:\/\//, '').split('/')[0];
  }),
}));

vi.mock('../../../src/popup/utils/validation', () => ({
  validateDomain: vi.fn((domain: string) => {
    return domain.includes('.com') || domain.includes('.org');
  }),
  validateLimit: vi.fn((limit: string) => {
    // Mock validation to accept hours/minutes format
    if (/^\d+$/.test(limit)) {
      const num = parseInt(limit, 10);
      return !isNaN(num) && num > 0;
    }
    // Accept hours/minutes format
    return /^\d+h\s*\d*m?$|^\d+h$|^\d+m$/.test(limit.toLowerCase());
  }),
}));

vi.mock('../../../src/popup/utils/timeFormat', () => ({
  parseTimeString: vi.fn((timeString: string) => {
    // Mock parser to convert hours/minutes to minutes
    const trimmed = timeString.trim().toLowerCase();
    if (/^\d+$/.test(trimmed)) {
      const minutes = parseInt(trimmed, 10);
      return minutes > 0 ? minutes : null;
    }
    const hourMatch = trimmed.match(/(\d+)\s*h/);
    const minuteMatch = trimmed.match(/(\d+)\s*m/);
    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
    if (hours === 0 && minutes === 0) return null;
    if (minutes < 0 || minutes >= 60) return null;
    return hours * 60 + minutes;
  }),
}));

describe('useDomainManagement', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    chrome().storage.local.set.mockResolvedValue(undefined);
  });

  describe('addDomain', () => {
    it('should add a valid domain successfully', async () => {
      const mockData = createMockStorageData({
        trackedSites: {},
      });
      (utils.getStorageData as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDomainManagement());

      let success = false;
      await act(async () => {
        success = await result.current.addDomain('youtube.com', '2h 30m');
      });

      expect(success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        trackedSites: { 'youtube.com': 150 }, // 2h 30m = 150 minutes
      });
    });

    it('should return error for empty domain', async () => {
      const { result } = renderHook(() => useDomainManagement());

      let success = false;
      await act(async () => {
        success = await result.current.addDomain('', '60');
      });

      expect(success).toBe(false);
      expect(result.current.error?.message).toBe('Please enter a domain name');
    });

    it('should return error for invalid domain format', async () => {
      (validation.validateDomain as any).mockReturnValue(false);
      (utils.extractDomain as any).mockReturnValue('invalid');

      const { result } = renderHook(() => useDomainManagement());

      let success = false;
      await act(async () => {
        success = await result.current.addDomain('invalid', '60');
      });

      expect(success).toBe(false);
      expect(result.current.error?.message).toBe('Invalid domain format');
    });

    it('should return error for invalid limit', async () => {
      (validation.validateDomain as any).mockReturnValue(true);
      (validation.validateLimit as any).mockReturnValue(false);

      const { result } = renderHook(() => useDomainManagement());

      let success = false;
      await act(async () => {
        success = await result.current.addDomain('youtube.com', '0');
      });

      expect(success).toBe(false);
      expect(result.current.error?.message).toContain('valid time limit');
    });

    it('should return error for duplicate domain', async () => {
      (validation.validateDomain as any).mockReturnValue(true);
      (validation.validateLimit as any).mockReturnValue(true);
      (utils.extractDomain as any).mockReturnValue('youtube.com');
      const mockData = createMockStorageData({
        trackedSites: { 'youtube.com': 60 },
      });
      (utils.getStorageData as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDomainManagement());

      let success = false;
      await act(async () => {
        success = await result.current.addDomain('youtube.com', '60');
      });

      expect(success).toBe(false);
      expect(result.current.error?.message).toBe('This domain is already being tracked');
    });

    it('should handle storage errors', async () => {
      (validation.validateDomain as any).mockReturnValue(true);
      (validation.validateLimit as any).mockReturnValue(true);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockData = createMockStorageData({ trackedSites: {} });
      (utils.getStorageData as any).mockResolvedValue(mockData);
      chrome().storage.local.set.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useDomainManagement());

      let success = false;
      await act(async () => {
        success = await result.current.addDomain('youtube.com', '2h 30m');
      });

      expect(success).toBe(false);
      expect(result.current.error?.message).toBe('Failed to add domain. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeDomain', () => {
    it('should remove a domain successfully', async () => {
      const mockData = createMockStorageData({
        trackedSites: { 'youtube.com': 60, 'reddit.com': 30 },
      });
      (utils.getStorageData as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDomainManagement());

      await act(async () => {
        await result.current.removeDomain('youtube.com');
      });

      expect(chrome().storage.local.set).toHaveBeenCalledWith({
        trackedSites: { 'reddit.com': 30 },
      });
    });

    it('should handle errors when removing domain', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockData = createMockStorageData({
        trackedSites: { 'youtube.com': 60 },
      });
      (utils.getStorageData as any).mockResolvedValue(mockData);
      chrome().storage.local.set.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useDomainManagement());

      await act(async () => {
        await expect(result.current.removeDomain('youtube.com')).rejects.toThrow();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useDomainManagement());

      await act(async () => {
        await result.current.addDomain('', '60');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
