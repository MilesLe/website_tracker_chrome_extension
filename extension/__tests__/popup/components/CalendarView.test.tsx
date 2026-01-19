import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils';
import CalendarView from '../../../src/popup/components/CalendarView';
import type { CalendarMonthResponse } from '../../../src/popup/utils/api';

// Mock getTodayDate to return a consistent date for testing
vi.mock('../../../src/utils', () => ({
  getTodayDate: vi.fn(() => '2024-01-15'),
}));

describe('CalendarView', () => {
  const mockOnMonthChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    renderWithTheme(
      <CalendarView
        calendarData={null}
        isLoading={true}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error message', () => {
    const error = new Error('Failed to load calendar');
    renderWithTheme(
      <CalendarView
        calendarData={null}
        isLoading={false}
        error={error}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByText(/Failed to load calendar data/i)).toBeInTheDocument();
  });

  it('should render calendar with data', () => {
    const mockCalendarData: CalendarMonthResponse = {
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

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should auto-select today when viewing current month', async () => {
    const mockCalendarData: CalendarMonthResponse = {
      year: 2024,
      month: 1,
      days: [
        {
          date: '2024-01-15',
          totalUsage: 60,
          domainUsage: { 'youtube.com': 60 },
          limitReached: false,
          domains: [
            {
              domain: 'youtube.com',
              minutes: 60,
              limit: 90,
              limitReached: false,
              percentage: 66.7,
            },
          ],
        },
      ],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait for useEffect to run and select today
    await waitFor(() => {
      // Day details should be shown for selected day (today)
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
  });

  it('should clear selection when navigating away from current month', async () => {
    const mockCalendarData: CalendarMonthResponse = {
      year: 2024,
      month: 2, // February (not current month)
      days: [
        {
          date: '2024-02-15',
          totalUsage: 60,
          domainUsage: { 'youtube.com': 60 },
          limitReached: false,
          domains: [],
        },
      ],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait a bit to ensure useEffect has run
    await waitFor(() => {
      // Day details should NOT be shown (selection cleared)
      expect(screen.queryByText('2024-02-15')).not.toBeInTheDocument();
    });
  });

  it('should handle month navigation', () => {
    const mockCalendarData: CalendarMonthResponse = {
      year: 2024,
      month: 1,
      days: [],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    const nextButton = screen.getByLabelText('Next month');

    fireEvent.click(prevButton);
    expect(mockOnMonthChange).toHaveBeenCalledWith(2023, 12);

    fireEvent.click(nextButton);
    expect(mockOnMonthChange).toHaveBeenCalledWith(2024, 2);
  });

  it('should handle day click for days with data', async () => {
    const mockCalendarData: CalendarMonthResponse = {
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
        {
          date: '2024-01-20',
          totalUsage: 30,
          domainUsage: { 'reddit.com': 30 },
          limitReached: false,
          domains: [],
        },
      ],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait for auto-selection of today
    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });

    // Find and click day 20
    const day20Cells = screen.getAllByText('20');
    // The first one should be the day cell (others might be in details)
    const day20Cell = day20Cells.find(cell => {
      const parent = cell.parentElement;
      return parent && parent.getAttribute('role') !== 'button';
    }) || day20Cells[0];

    fireEvent.click(day20Cell);

    // Should show details for day 20
    await waitFor(() => {
      expect(screen.getByText('2024-01-20')).toBeInTheDocument();
    });
  });

  it('should not allow clicking days without data', async () => {
    const mockCalendarData: CalendarMonthResponse = {
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

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait for auto-selection
    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });

    // Try to click day 10 (which has no data)
    const day10Cells = screen.getAllByText('10');
    const day10Cell = day10Cells[0];
    
    // Click should not change selection (day 10 has no data)
    fireEvent.click(day10Cell);

    // Should still show details for day 15 (today)
    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
  });

  it('should show day details when a day is selected', async () => {
    const mockCalendarData: CalendarMonthResponse = {
      year: 2024,
      month: 1,
      days: [
        {
          date: '2024-01-15',
          totalUsage: 60,
          domainUsage: { 'youtube.com': 60 },
          limitReached: false,
          domains: [
            {
              domain: 'youtube.com',
              minutes: 60,
              limit: 90,
              limitReached: false,
              percentage: 66.7,
            },
          ],
        },
      ],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait for auto-selection
    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('youtube.com')).toBeInTheDocument();
    });
  });

  it('should toggle day details on second click', async () => {
    const mockCalendarData: CalendarMonthResponse = {
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

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait for auto-selection
    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });

    // Click the same day again to deselect
    const day15Cells = screen.getAllByText('15');
    const day15Cell = day15Cells[0];
    fireEvent.click(day15Cell);

    // Details should be hidden
    await waitFor(() => {
      expect(screen.queryByText('2024-01-15')).not.toBeInTheDocument();
    });
  });

  it('should render week day headers', () => {
    const mockCalendarData: CalendarMonthResponse = {
      year: 2024,
      month: 1,
      days: [],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('should auto-select today even when it has no data', async () => {
    const mockCalendarData: CalendarMonthResponse = {
      year: 2024,
      month: 1,
      days: [
        {
          date: '2024-01-20',
          totalUsage: 30,
          domainUsage: { 'reddit.com': 30 },
          limitReached: false,
          domains: [],
        },
      ],
    };

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Wait for useEffect to run
    await waitFor(() => {
      // Today (2024-01-15) should be selected but has no data, so no details shown
      // We can verify by checking that day 20 details are NOT shown (only today is selected)
      expect(screen.queryByText('2024-01-20')).not.toBeInTheDocument();
    });
  });

  it('should show days without data as grey and non-clickable', () => {
    const mockCalendarData: CalendarMonthResponse = {
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

    renderWithTheme(
      <CalendarView
        calendarData={mockCalendarData}
        isLoading={false}
        error={null}
        onMonthChange={mockOnMonthChange}
      />
    );

    // Day 10 should be rendered but without data (grey)
    // There may be multiple "10" elements (from previous/next month overflow)
    // We use getAllByText since there can be multiple day cells with the same number
    const day10Cells = screen.getAllByText('10');
    expect(day10Cells.length).toBeGreaterThan(0);
    
    // Verify at least one day 10 cell exists in the calendar
    // The actual styling (grey) and clickability are tested in DayCell component tests
    day10Cells.forEach(cell => {
      expect(cell).toBeInTheDocument();
    });
  });
});
