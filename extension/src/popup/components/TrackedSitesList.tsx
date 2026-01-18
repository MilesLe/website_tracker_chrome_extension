import { useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import TrackedSiteItem from './TrackedSiteItem';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface TrackedSitesListProps {
  sites: TrackedSiteDisplay[];
  onOpenManagementPanel: () => void;
}

const StyledContainer = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  align-items: start;
`;

const StyledEmptyState = styled(Box)`
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const StyledEmptyStateText = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 14px;
  margin-bottom: 8px;
`;

const StyledEmptyStateButton = styled(Button)`
  margin-top: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
`;

/**
 * Component for displaying the list of tracked sites in a 2-column grid
 * Sites are sorted by descending percentage usage
 */
export default function TrackedSitesList({ sites, onOpenManagementPanel }: TrackedSitesListProps) {
  // Sort sites by descending percentage usage
  const sortedSites = useMemo(() => {
    return [...sites].sort((a, b) => {
      const percentageA = (a.usage / a.limit) * 100;
      const percentageB = (b.usage / b.limit) * 100;
      return percentageB - percentageA;
    });
  }, [sites]);

  if (sites.length === 0) {
    return (
      <StyledEmptyState>
        <StyledEmptyStateText variant="body1">
          No domains tracked yet.
        </StyledEmptyStateText>
        <StyledEmptyStateText variant="body2">
          Start tracking your website usage by adding your first domain.
        </StyledEmptyStateText>
        <StyledEmptyStateButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onOpenManagementPanel}
        >
          Add Your First Site
        </StyledEmptyStateButton>
      </StyledEmptyState>
    );
  }

  return (
    <StyledContainer>
      {sortedSites.map((site) => (
        <TrackedSiteItem
          key={site.domain}
          site={site}
        />
      ))}
    </StyledContainer>
  );
}
