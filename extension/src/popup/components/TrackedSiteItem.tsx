import { Card, CardContent, Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import ProgressBar from './ProgressBar';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface TrackedSiteItemProps {
  site: TrackedSiteDisplay;
}

interface StyledCardProps {
  isOverLimit: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit',
})<StyledCardProps>`
  border-radius: 8px;
  background-color: ${({ theme, isOverLimit }) => 
    isOverLimit 
      ? 'rgba(211, 47, 47, 0.15)' 
      : theme.palette.background.paper};
  border: 1px solid ${({ theme, isOverLimit }) => 
    isOverLimit 
      ? theme.palette.error.main 
      : theme.palette.divider};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme, isOverLimit }) => 
      isOverLimit 
        ? theme.palette.error.dark 
        : theme.palette.primary.main};
  }
`;

/**
 * Component for displaying a single tracked site with usage information
 */
export default function TrackedSiteItem({ site }: TrackedSiteItemProps) {
  const percentage = Math.min((site.usage / site.limit) * 100, 100);
  const isOverLimit = site.usage >= site.limit;

  return (
    <StyledCard isOverLimit={isOverLimit}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="10px">
          <Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '16px', 
                marginBottom: '5px',
                color: (theme) => theme.palette.text.primary,
              }}
            >
              {site.domain}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '14px',
                color: (theme) => theme.palette.text.secondary,
              }}
            >
              {site.usage.toFixed(1)} / {site.limit} minutes
            </Typography>
          </Box>
        </Box>
        
        <Box marginTop="10px">
          <ProgressBar percentage={percentage} isOverLimit={isOverLimit} />
        </Box>
      </CardContent>
    </StyledCard>
  );
}
