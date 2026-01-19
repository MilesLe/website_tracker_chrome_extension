import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils';
import CalendarPanel from '../../../src/popup/components/CalendarPanel';
import * as useCalendarModule from '../../../src/popup/hooks/useCalendar';

vi.mock('../../../src/popup/hooks/useCalendar');

describe('CalendarPanel', () => {
  const mockUseCalendar = vi.mocked(useCalendarModule.useCalendar);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render calendar panel', () => {
    mockUseCalendar.mockReturnValue({
      calendarData: null,
      isLoading: true,
      error: null,
    });

    renderWithTheme(<CalendarPanel />);

    // Should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render calendar with data', () => {
    const mockCalendarData = {
      year: 2024,
      month: 1,
      days: [
        {
          date: '2024-01-15',
          totalUsage: 60,
          domainUsage: { 'youtube.com': 60 },
          limitReached: false,
          domains: [],
        },
      ],
    };

    mockUseCalendar.mockReturnValue({
      calendarData: mockCalendarData,
      isLoading: false,
      error: null,
    });

    renderWithTheme(<CalendarPanel />);

    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('should display error message', () => {
    const error = new Error('Failed to load calendar');

    mockUseCalendar.mockReturnValue({
      calendarData: null,
      isLoading: false,
      error,
    });

    renderWithTheme(<CalendarPanel />);

    expect(screen.getByText(/Failed to load calendar data/i)).toBeInTheDocument();
  });
});
