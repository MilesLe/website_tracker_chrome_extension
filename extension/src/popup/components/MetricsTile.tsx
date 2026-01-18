import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import type { TrackedSites } from '../../types';
import { formatMinutes } from '../utils/timeFormat';

interface MetricsTileProps {
  trackedSites: TrackedSites;
  usage: Record<string, number>;
}

const StyledTile = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const StyledMetricsContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const StyledMetric = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledMetricLabel = styled(Typography)`
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.secondary};
  font-weight: 500;
`;

const StyledMetricValue = styled(Typography)`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledDivider = styled(Box)`
  width: 1px;
  height: 40px;
  background-color: ${({ theme }) => theme.palette.divider};
`;

/**
 * Component that displays general metrics for all tracked websites:
 * - Total time tracked for the day
 * - Total time allowed for the day
 * - Percentage of time used for the day
 */
export default function MetricsTile({ trackedSites, usage }: MetricsTileProps) {
  const { totalPercentage, totalMinutesFormatted, totalLimitFormatted } = useMemo(() => {
    // Calculate total minutes tracked (sum of all usage values)
    const totalMinutes = Object.values(usage).reduce((sum, minutes) => sum + minutes, 0);
    
    // Calculate total limit (sum of all limits)
    const totalLimit = Object.values(trackedSites).reduce((sum, limit) => sum + limit, 0);
    
    // Calculate percentage (avoid division by zero)
    const totalPercentage = totalLimit > 0 ? (totalMinutes / totalLimit) * 100 : 0;
    
    return {
      totalPercentage: Math.round(totalPercentage * 10) / 10, // Round to 1 decimal place
      totalMinutesFormatted: formatMinutes(totalMinutes),
      totalLimitFormatted: formatMinutes(totalLimit),
    };
  }, [trackedSites, usage]);

  return (
    <StyledTile data-testid="metrics-tile">
      <StyledMetricsContainer>
        <StyledMetric>
          <StyledMetricLabel>Total Time Today</StyledMetricLabel>
          <StyledMetricValue>{totalMinutesFormatted}</StyledMetricValue>
        </StyledMetric>
        <StyledDivider />
        <StyledMetric>
          <StyledMetricLabel>Total Time Allowed</StyledMetricLabel>
          <StyledMetricValue>{totalLimitFormatted}</StyledMetricValue>
        </StyledMetric>
        <StyledDivider />
        <StyledMetric>
          <StyledMetricLabel>Time Used</StyledMetricLabel>
          <StyledMetricValue>{totalPercentage}%</StyledMetricValue>
        </StyledMetric>
      </StyledMetricsContainer>
    </StyledTile>
  );
}
