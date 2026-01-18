import { Box, LinearProgress, Typography } from '@mui/material';
import styled from '@emotion/styled';

interface ProgressBarProps {
  percentage: number;
  isOverLimit: boolean;
  showLabel?: boolean;
}

const StyledProgressContainer = styled(Box)`
  width: 100%;
`;

const StyledProgressLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit',
})<{ isOverLimit: boolean }>`
  font-size: 12px;
  color: ${({ isOverLimit }) => (isOverLimit ? '#d32f2f' : '#666')};
  font-weight: ${({ isOverLimit }) => (isOverLimit ? 600 : 'normal')};
`;

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit',
})<{ isOverLimit: boolean }>`
  height: 8px;
  border-radius: 4px;
  background-color: #e0e0e0;
  
  .MuiLinearProgress-bar {
    background-color: ${({ isOverLimit }) => (isOverLimit ? '#d32f2f' : '#4caf50')};
    transition: width 0.3s ease;
  }
`;

/**
 * Progress bar component for displaying usage percentage
 */
export default function ProgressBar({ percentage, isOverLimit, showLabel = true }: ProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <StyledProgressContainer>
      {showLabel && (
        <Box display="flex" justifyContent="space-between" marginBottom="5px">
          <Typography variant="caption" color="text.secondary">
            Progress
          </Typography>
          <StyledProgressLabel isOverLimit={isOverLimit} variant="caption">
            {clampedPercentage.toFixed(1)}%
          </StyledProgressLabel>
        </Box>
      )}
      <StyledLinearProgress
        variant="determinate"
        value={clampedPercentage}
        isOverLimit={isOverLimit}
      />
    </StyledProgressContainer>
  );
}
