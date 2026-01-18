import { Box, Typography, IconButton, List, ListItem } from '@mui/material';
import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatTimeRange } from '../utils/timeFormat';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface DomainRemoveListProps {
  sites: TrackedSiteDisplay[];
  onRemoveDomain: (domain: string) => Promise<void>;
}

const StyledContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledSectionTitle = styled(Typography)`
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledList = styled(List)`
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StyledListItem = styled(ListItem)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: ${({ theme }) => theme.palette.background.default};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  margin-bottom: 8px;
`;

const StyledDomainInfo = styled(Box)`
  flex: 1;
`;

const StyledDomainName = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.primary};
  margin-bottom: 4px;
`;

const StyledDomainDetails = styled(Typography)`
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const StyledRemoveButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.error.main};
  padding: 8px;
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.error.main}20;
    color: ${({ theme }) => theme.palette.error.dark};
  }
`;

/**
 * Component for displaying and removing tracked domains in the management panel
 */
export default function DomainRemoveList({ sites, onRemoveDomain }: DomainRemoveListProps) {
  const handleRemove = async (domain: string) => {
    if (window.confirm(`Are you sure you want to stop tracking ${domain}?`)) {
      try {
        await onRemoveDomain(domain);
      } catch (err) {
        console.error('Error removing domain:', err);
        // Optionally show user-friendly error message
        alert(`Failed to remove ${domain}. Please try again.`);
      }
    }
  };

  return (
    <StyledContainer>
      <StyledSectionTitle variant="h3">
        Remove Tracked Sites
      </StyledSectionTitle>
      
      <StyledList>
        {sites.map((site) => (
          <StyledListItem key={site.domain}>
            <StyledDomainInfo>
              <StyledDomainName>{site.domain}</StyledDomainName>
              <StyledDomainDetails>
                {formatTimeRange(site.usage, site.limit)}
              </StyledDomainDetails>
            </StyledDomainInfo>
            <StyledRemoveButton
              onClick={() => handleRemove(site.domain)}
              size="small"
              aria-label={`Remove ${site.domain}`}
            >
              <DeleteIcon />
            </StyledRemoveButton>
          </StyledListItem>
        ))}
      </StyledList>
    </StyledContainer>
  );
}
