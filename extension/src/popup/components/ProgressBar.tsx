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
  color: ${({ theme, isOverLimit }) => 
    isOverLimit 
      ? theme.palette.error.main 
      : theme.palette.primary.light};
  font-weight: ${({ isOverLimit }) => (isOverLimit ? 600 : 'normal')};
`;

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit',
})<{ isOverLimit: boolean }>`
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.palette.background.default};
  
  .MuiLinearProgress-bar {
    background-color: ${({ theme, isOverLimit }) => 
      isOverLimit 
        ? theme.palette.error.main 
        : theme.palette.primary.main};
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
          <Typography 
            variant="caption" 
            sx={{ 
              color: (theme) => theme.palette.text.secondary,
              fontSize: '12px',
            }}
          >
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
