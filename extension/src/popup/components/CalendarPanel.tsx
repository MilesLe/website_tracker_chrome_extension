import { useState } from 'react';
import { Box } from '@mui/material';
import styled from '@emotion/styled';
import CalendarView from './CalendarView';
import { useCalendar } from '../hooks/useCalendar';

const StyledPanel = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

/**
 * Calendar panel component (collapsible).
 * Manages calendar state and month navigation.
 */
export default function CalendarPanel() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  
  const { calendarData, isLoading, error } = useCalendar(year, month);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <StyledPanel>
      <CalendarView
        calendarData={calendarData}
        isLoading={isLoading}
        error={error}
        onMonthChange={handleMonthChange}
      />
    </StyledPanel>
  );
}
