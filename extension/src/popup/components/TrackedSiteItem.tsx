import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import ProgressBar from './ProgressBar';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface TrackedSiteItemProps {
  site: TrackedSiteDisplay;
  onRemove: (domain: string) => void;
}

interface StyledCardProps {
  isOverLimit: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit',
})<StyledCardProps>`
  border-radius: 8px;
  background-color: ${({ isOverLimit }) => (isOverLimit ? '#ffebee' : '#fff')};
  border: 1px solid #ddd;
`;

const StyledRemoveButton = styled(Button)`
  padding: 6px 12px;
  font-size: 12px;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  text-transform: none;
  
  &:hover {
    background-color: #c62828;
  }
`;

/**
 * Component for displaying a single tracked site with usage information
 */
export default function TrackedSiteItem({ site, onRemove }: TrackedSiteItemProps) {
  const percentage = Math.min((site.usage / site.limit) * 100, 100);
  const isOverLimit = site.usage >= site.limit;

  const handleRemove = () => {
    onRemove(site.domain);
  };

  return (
    <StyledCard isOverLimit={isOverLimit}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="10px">
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '16px', marginBottom: '5px' }}>
              {site.domain}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
              {site.usage.toFixed(1)} / {site.limit} minutes
            </Typography>
          </Box>
          <StyledRemoveButton
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={handleRemove}
            size="small"
          >
            Remove
          </StyledRemoveButton>
        </Box>
        
        <Box marginTop="10px">
          <ProgressBar percentage={percentage} isOverLimit={isOverLimit} />
        </Box>
      </CardContent>
    </StyledCard>
  );
}
