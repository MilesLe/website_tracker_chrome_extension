import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import type { CalendarDay } from '../utils/api';

interface DayCellProps {
  day: CalendarDay | null;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasData: boolean;
  isFuture: boolean;
  onClick: () => void;
  isSelected: boolean;
}

const StyledDayCell = styled(Box)<{ 
  isCurrentMonth: boolean;
  isToday: boolean;
  limitReached: boolean;
  isSelected: boolean;
  hasData: boolean;
  isFuture: boolean;
}>`
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: ${({ isCurrentMonth, hasData }) => (isCurrentMonth && hasData ? 'pointer' : 'default')};
  background-color: ${({ theme, limitReached, isCurrentMonth, isToday, isSelected, hasData, isFuture }) => {
    if (!isCurrentMonth) {
      return 'transparent';
    }
    // Selected state takes precedence (even for days without data)
    if (isSelected) {
      // If selected but no data, show a lighter selected color
      if (!hasData || isFuture) {
        return theme.palette.action.selected;
      }
      return theme.palette.action.selected;
    }
    // Grey for days without data (past days before tracking started, or future days)
    if (!hasData || isFuture) {
      return theme.palette.action.disabledBackground || theme.palette.grey[300];
    }
    if (limitReached) {
      return theme.palette.error.main;
    }
    if (isToday) {
      return theme.palette.primary.dark;
    }
    return theme.palette.success.main;
  }};
  color: ${({ theme, isCurrentMonth, hasData, isFuture }) => {
    if (!isCurrentMonth) {
      return theme.palette.text.disabled;
    }
    // Grey text for days without data
    if (!hasData || isFuture) {
      return theme.palette.text.disabled;
    }
    return theme.palette.text.primary;
  }};
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    transform: ${({ isCurrentMonth, hasData }) => (isCurrentMonth && hasData ? 'scale(1.1)' : 'none')};
    background-color: ${({ theme, limitReached, isCurrentMonth, isToday, hasData, isFuture }) => {
      if (!isCurrentMonth) {
        return 'transparent';
      }
      // No hover effect for days without data
      if (!hasData || isFuture) {
        return theme.palette.action.disabledBackground || theme.palette.grey[300];
      }
      if (limitReached) {
        return theme.palette.error.dark;
      }
      if (isToday) {
        return theme.palette.primary.light;
      }
      return theme.palette.success.light;
    }};
  }
`;

const StyledDayNumber = styled(Typography)`
  font-size: 12px;
  font-weight: 500;
`;

/**
 * Calendar day cell component.
 * Shows green if no limits reached, red if any limit reached.
 */
export default function DayCell({
  day,
  dayNumber,
  isCurrentMonth,
  isToday,
  hasData,
  isFuture,
  onClick,
  isSelected,
}: DayCellProps) {
  const limitReached = day?.limitReached ?? false;
  
  return (
    <StyledDayCell
      isCurrentMonth={isCurrentMonth}
      isToday={isToday}
      limitReached={limitReached}
      isSelected={isSelected}
      hasData={hasData}
      isFuture={isFuture}
      onClick={isCurrentMonth && hasData ? onClick : undefined}
    >
      <StyledDayNumber>{dayNumber}</StyledDayNumber>
    </StyledDayCell>
  );
}
