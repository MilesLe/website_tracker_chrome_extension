import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserId } from '../../../src/popup/hooks/useUserId';
import * as apiModule from '../../../src/popup/utils/api';

vi.mock('../../../src/popup/utils/api');

describe('useUserId', () => {
  const mockGetUserId = vi.mocked(apiModule.getUserId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load user ID on mount', async () => {
    const testUserId = 'test-user-id-123';
    mockGetUserId.mockResolvedValue(testUserId);

    const { result } = renderHook(() => useUserId());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userId).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userId).toBe(testUserId);
    expect(mockGetUserId).toHaveBeenCalledOnce();
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUserId.mockRejectedValue(new Error('Failed to get user ID'));

    const { result } = renderHook(() => useUserId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userId).toBe(null);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
});
