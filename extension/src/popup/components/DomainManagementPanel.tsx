import { Box } from '@mui/material';
import styled from '@emotion/styled';
import AddDomainForm from './AddDomainForm';
import DomainRemoveList from './DomainRemoveList';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface DomainManagementPanelProps {
  trackedSites: TrackedSiteDisplay[];
  onAddDomain: (domain: string, limit: string) => Promise<boolean>;
  onRemoveDomain: (domain: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}

const StyledPanel = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const StyledSection = styled(Box)`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Panel component that contains both add and remove domain functionality
 */
export default function DomainManagementPanel({
  trackedSites,
  onAddDomain,
  onRemoveDomain,
  error,
  onClearError,
}: DomainManagementPanelProps) {
  return (
    <StyledPanel>
      <StyledSection>
        <AddDomainForm
          onAddDomain={onAddDomain}
          error={error}
          onClearError={onClearError}
        />
      </StyledSection>
      
      {trackedSites.length > 0 && (
        <StyledSection>
          <DomainRemoveList
            sites={trackedSites}
            onRemoveDomain={onRemoveDomain}
          />
        </StyledSection>
      )}
    </StyledPanel>
  );
}
