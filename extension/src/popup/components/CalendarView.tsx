import { useState, useMemo, useEffect } from 'react';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import styled from '@emotion/styled';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { CalendarMonthResponse } from '../utils/api';
import DayCell from './DayCell';
import DayDetailsExpansion from './DayDetailsExpansion';
import { getTodayDate } from '../../utils';

interface CalendarViewProps {
  calendarData: CalendarMonthResponse | null;
  isLoading: boolean;
  error: Error | null;
  onMonthChange: (year: number, month: number) => void;
}

const StyledContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const StyledMonthYear = styled(Typography)`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledNavigation = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StyledNavButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.text.primary};
  padding: 4px;
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

const StyledWeekDays = styled(Box)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
`;

const StyledWeekDay = styled(Typography)`
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.secondary};
  padding: 4px;
`;

const StyledCalendarGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const StyledError = styled(Box)`
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.palette.error.main};
`;

const StyledLoading = styled(Box)`
  display: flex;
  justify-content: center;
  padding: 40px;
`;

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Calendar view component with month navigation.
 */
export default function CalendarView({
  calendarData,
  isLoading,
  error,
  onMonthChange,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = getTodayDate();

  const { year, month } = useMemo(() => {
    if (calendarData) {
      return { year: calendarData.year, month: calendarData.month };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, [calendarData]);

  // Auto-select today when viewing the current month
  useEffect(() => {
    if (calendarData) {
      const todayDate = new Date(today);
      const isCurrentMonth = 
        todayDate.getFullYear() === year && 
        todayDate.getMonth() === month - 1;
      
      if (isCurrentMonth) {
        // Auto-select today when viewing the current month (even if it doesn't have data yet)
        setSelectedDate(today);
      } else {
        // Clear selection when navigating away from current month
        setSelectedDate(null);
      }
    }
  }, [calendarData, year, month, today]);

  const calendarDays = useMemo(() => {
    if (!calendarData) {
      return [];
    }

    // Create a map of date -> day data
    const dayMap = new Map(calendarData.days.map(day => [day.date, day]));

    // Get first day of month and what day of week it falls on
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

    // Get number of days in month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get last day of previous month for padding
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    const days: Array<{ day: CalendarMonthResponse['days'][0] | null; dayNumber: number; isCurrentMonth: boolean }> = [];

    // Add days from previous month to fill first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = daysInPrevMonth - i;
      days.push({
        day: null,
        dayNumber,
        isCurrentMonth: false,
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dayMap.get(dateStr) || null;
      days.push({
        day: dayData,
        dayNumber: day,
        isCurrentMonth: true,
      });
    }

    // Fill remaining days to complete last week (if needed)
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day: null,
        dayNumber: day,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarData, year, month]);

  const handlePrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    onMonthChange(newYear, newMonth);
    // Selection will be updated by useEffect based on whether it's current month
  };

  const handleNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    onMonthChange(newYear, newMonth);
    // Selection will be updated by useEffect based on whether it's current month
  };

  const handleDayClick = (_day: CalendarMonthResponse['days'][0] | null, _dayNumber: number, isCurrentMonth: boolean, hasData: boolean, dateStr: string, _isFuture: boolean) => {
    // Only allow clicking days with data (or today, which can be auto-selected even without data)
    if (!isCurrentMonth) {
      return;
    }
    // Allow selection if day has data, or if it's today (which can be selected even without data)
    const isToday = dateStr === today;
    // Prevent selection of days without data (both past and future)
    if (!hasData && !isToday) {
      return; // Prevent selection of days without data (past or future)
    }
    // Use dateStr directly (it matches day.date when day exists, or is the date string for today)
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const selectedDay = calendarData?.days.find(d => d.date === selectedDate) || null;

  if (error) {
    return (
      <StyledError>
        <Typography variant="body2">
          Failed to load calendar data. Please check your connection.
        </Typography>
      </StyledError>
    );
  }

  if (isLoading && !calendarData) {
    return (
      <StyledLoading>
        <CircularProgress size={40} />
      </StyledLoading>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledMonthYear>
          {monthNames[month - 1]} {year}
        </StyledMonthYear>
        <StyledNavigation>
          <StyledNavButton onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeftIcon />
          </StyledNavButton>
          <StyledNavButton onClick={handleNextMonth} aria-label="Next month">
            <ChevronRightIcon />
          </StyledNavButton>
        </StyledNavigation>
      </StyledHeader>

      <StyledWeekDays>
        {weekDays.map(day => (
          <StyledWeekDay key={day}>{day}</StyledWeekDay>
        ))}
      </StyledWeekDays>

      <StyledCalendarGrid>
        {calendarDays.map(({ day, dayNumber, isCurrentMonth }, index) => {
          const dateStr = isCurrentMonth
            ? `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
            : '';
          const isToday = dateStr === today;
          const hasData = day !== null && day.totalUsage > 0;
          const isFuture = dateStr ? new Date(dateStr) > new Date(today) : false;

          // Only show as selected if:
          // 1. The date matches selectedDate AND
          // 2. Either the day has data OR it's today (which can be selected even without data)
          const isSelected = selectedDate === dateStr && (hasData || isToday);

          return (
            <DayCell
              key={index}
              day={day}
              dayNumber={dayNumber}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              hasData={hasData}
              isFuture={isFuture}
              onClick={() => handleDayClick(day, dayNumber, isCurrentMonth, hasData, dateStr, isFuture)}
              isSelected={isSelected}
            />
          );
        })}
      </StyledCalendarGrid>

      {selectedDay && <DayDetailsExpansion day={selectedDay} />}
    </StyledContainer>
  );
}
