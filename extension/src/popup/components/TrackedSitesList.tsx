import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import TrackedSiteItem from './TrackedSiteItem';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface TrackedSitesListProps {
  sites: TrackedSiteDisplay[];
  onRemoveDomain: (domain: string) => void;
}

const StyledContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StyledEmptyState = styled(Box)`
  text-align: center;
  padding: 40px;
  color: #666;
`;

/**
 * Component for displaying the list of tracked sites
 */
export default function TrackedSitesList({ sites, onRemoveDomain }: TrackedSitesListProps) {
  if (sites.length === 0) {
    return (
      <StyledEmptyState>
        <Typography variant="body1" color="text.secondary">
          No domains tracked yet. Add one above to get started.
        </Typography>
      </StyledEmptyState>
    );
  }

  return (
    <StyledContainer>
      {sites.map((site) => (
        <TrackedSiteItem
          key={site.domain}
          site={site}
          onRemove={onRemoveDomain}
        />
      ))}
    </StyledContainer>
  );
}
