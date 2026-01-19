import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import type { CalendarDay } from '../utils/api';

interface DayCellProps {
  day: CalendarDay | null;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
  isSelected: boolean;
}

const StyledDayCell = styled(Box)<{ 
  isCurrentMonth: boolean;
  isToday: boolean;
  limitReached: boolean;
  isSelected: boolean;
}>`
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: ${({ isCurrentMonth }) => (isCurrentMonth ? 'pointer' : 'default')};
  background-color: ${({ theme, limitReached, isCurrentMonth, isToday, isSelected }) => {
    if (!isCurrentMonth) {
      return 'transparent';
    }
    if (isSelected) {
      return theme.palette.action.selected;
    }
    if (limitReached) {
      return theme.palette.error.main;
    }
    if (isToday) {
      return theme.palette.primary.dark;
    }
    return theme.palette.success.main;
  }};
  color: ${({ theme, isCurrentMonth }) => 
    isCurrentMonth ? theme.palette.text.primary : theme.palette.text.disabled};
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    transform: ${({ isCurrentMonth }) => (isCurrentMonth ? 'scale(1.1)' : 'none')};
    background-color: ${({ theme, limitReached, isCurrentMonth, isToday }) => {
      if (!isCurrentMonth) {
        return 'transparent';
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
      onClick={isCurrentMonth ? onClick : undefined}
    >
      <StyledDayNumber>{dayNumber}</StyledDayNumber>
    </StyledDayCell>
  );
}
