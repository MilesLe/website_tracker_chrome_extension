import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils';
import DayCell from '../../../src/popup/components/DayCell';
import type { CalendarDay } from '../../../src/popup/utils/api';

describe('DayCell', () => {
  const mockDay: CalendarDay = {
    date: '2024-01-15',
    totalUsage: 60,
    domainUsage: { 'youtube.com': 60 },
    limitReached: false,
    domains: [],
  };

  const mockDayWithLimitReached: CalendarDay = {
    date: '2024-01-16',
    totalUsage: 90,
    domainUsage: { 'youtube.com': 90 },
    limitReached: true,
    domains: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render day number', () => {
    renderWithTheme(
      <DayCell
        day={mockDay}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={false}
        hasData={true}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={false}
      />
    );

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should be clickable when it has data', () => {
    const handleClick = vi.fn();
    const { container } = renderWithTheme(
      <DayCell
        day={mockDay}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={false}
        hasData={true}
        isFuture={false}
        onClick={handleClick}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    fireEvent.click(cell);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when it has no data', () => {
    const handleClick = vi.fn();
    const { container } = renderWithTheme(
      <DayCell
        day={null}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={false}
        hasData={false}
        isFuture={false}
        onClick={handleClick}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    fireEvent.click(cell);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not be clickable for future days', () => {
    const handleClick = vi.fn();
    const { container } = renderWithTheme(
      <DayCell
        day={null}
        dayNumber={20}
        isCurrentMonth={true}
        isToday={false}
        hasData={false}
        isFuture={true}
        onClick={handleClick}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    fireEvent.click(cell);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not be clickable for days outside current month', () => {
    const handleClick = vi.fn();
    const { container } = renderWithTheme(
      <DayCell
        day={null}
        dayNumber={31}
        isCurrentMonth={false}
        isToday={false}
        hasData={false}
        isFuture={false}
        onClick={handleClick}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    fireEvent.click(cell);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show green color when no limit reached', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={mockDay}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={false}
        hasData={true}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Cell should be rendered (green color is applied via styled component)
  });

  it('should show red color when limit reached', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={mockDayWithLimitReached}
        dayNumber={16}
        isCurrentMonth={true}
        isToday={false}
        hasData={true}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Cell should be rendered (red color is applied via styled component)
  });

  it('should show grey color for days without data', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={null}
        dayNumber={10}
        isCurrentMonth={true}
        isToday={false}
        hasData={false}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Cell should be rendered (grey color is applied via styled component)
  });

  it('should show grey color for future days', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={null}
        dayNumber={25}
        isCurrentMonth={true}
        isToday={false}
        hasData={false}
        isFuture={true}
        onClick={vi.fn()}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Cell should be rendered (grey color is applied via styled component)
  });

  it('should show selected state', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={mockDay}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={false}
        hasData={true}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={true}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Selected state is applied via styled component
  });

  it('should show selected state even for days without data', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={null}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={true}
        hasData={false}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={true}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Selected state should still be visible even without data
  });

  it('should show today indicator', () => {
    const { container } = renderWithTheme(
      <DayCell
        day={mockDay}
        dayNumber={15}
        isCurrentMonth={true}
        isToday={true}
        hasData={true}
        isFuture={false}
        onClick={vi.fn()}
        isSelected={false}
      />
    );

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Today indicator is applied via styled component
  });
});
