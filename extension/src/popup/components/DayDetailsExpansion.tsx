import { Box, Typography, LinearProgress } from '@mui/material';
import styled from '@emotion/styled';
import type { CalendarDay } from '../utils/api';
import { formatMinutes } from '../utils/timeFormat';

interface DayDetailsExpansionProps {
  day: CalendarDay;
}

const StyledExpansion = styled(Box)`
  margin-top: 16px;
  padding: 16px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 8px;
`;

const StyledDate = styled(Typography)`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledMetrics = styled(Box)`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const StyledMetric = styled(Box)`
  flex: 1;
`;

const StyledMetricLabel = styled(Typography)`
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-bottom: 4px;
`;

const StyledMetricValue = styled(Typography)`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledDomainList = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledDomainItem = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StyledDomainHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledDomainName = styled(Typography)`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledDomainUsage = styled(Typography)<{ limitReached: boolean }>`
  font-size: 12px;
  color: ${({ theme, limitReached }) =>
    limitReached ? theme.palette.error.main : theme.palette.text.secondary};
`;

const StyledProgressContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledProgress = styled(LinearProgress)`
  flex: 1;
  height: 6px;
  border-radius: 3px;
`;

const StyledPercentage = styled(Typography)`
  font-size: 11px;
  color: ${({ theme }) => theme.palette.text.secondary};
  min-width: 40px;
  text-align: right;
`;

/**
 * Day details expansion component.
 * Shows when a day is clicked/hovered.
 */
export default function DayDetailsExpansion({ day }: DayDetailsExpansionProps) {
  const totalLimit = day.domains.reduce((sum, d) => sum + d.limit, 0);
  const totalPercentage = totalLimit > 0 ? (day.totalUsage / totalLimit) * 100 : 0;

  return (
    <StyledExpansion>
      <StyledDate>{day.date}</StyledDate>
      
      <StyledMetrics>
        <StyledMetric>
          <StyledMetricLabel>Total Time</StyledMetricLabel>
          <StyledMetricValue>{formatMinutes(day.totalUsage)}</StyledMetricValue>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricLabel>Total Limit</StyledMetricLabel>
          <StyledMetricValue>{formatMinutes(totalLimit)}</StyledMetricValue>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricLabel>Percentage</StyledMetricLabel>
          <StyledMetricValue>{Math.round(totalPercentage)}%</StyledMetricValue>
        </StyledMetric>
      </StyledMetrics>

      <StyledDomainList>
        {day.domains.map((domain) => (
          <StyledDomainItem key={domain.domain}>
            <StyledDomainHeader>
              <StyledDomainName>{domain.domain}</StyledDomainName>
              <StyledDomainUsage limitReached={domain.limitReached}>
                {formatMinutes(domain.minutes)} / {formatMinutes(domain.limit)}
                {domain.limitReached && ' ⚠️'}
              </StyledDomainUsage>
            </StyledDomainHeader>
            <StyledProgressContainer>
              <StyledProgress
                variant="determinate"
                value={Math.min(domain.percentage, 100)}
                color={domain.limitReached ? 'error' : 'success'}
              />
              <StyledPercentage>{Math.round(domain.percentage)}%</StyledPercentage>
            </StyledProgressContainer>
          </StyledDomainItem>
        ))}
      </StyledDomainList>
    </StyledExpansion>
  );
}
