import { useState } from 'react';
import { Box, CircularProgress, Collapse, IconButton } from '@mui/material';
import styled from '@emotion/styled';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTrackedSites } from './hooks/useTrackedSites';
import { useDomainManagement } from './hooks/useDomainManagement';
import TrackedSitesList from './components/TrackedSitesList';
import DomainManagementPanel from './components/DomainManagementPanel';
import MetricsTile from './components/MetricsTile';

const StyledContainer = styled(Box)`
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: ${({ theme }) => theme.palette.background.default};
  min-height: 500px;
`;

const StyledHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StyledTitle = styled(Box)`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const StyledManagementButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.primary.main};
  padding: 8px;
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

const StyledLoadingContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const StyledCollapseContainer = styled(Box)`
  margin-bottom: 20px;
`;

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

/**
 * Main App component that orchestrates the website tracker popup
 */
export default function App() {
  const { trackedSites, usage, isLoading } = useTrackedSites();
  const { addDomain, removeDomain, error, clearError } = useDomainManagement();
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState(false);

  const handleRemoveDomain = async (domain: string) => {
    try {
      await removeDomain(domain);
    } catch (err) {
      console.error('Error removing domain:', err);
    }
  };

  const toggleManagementPanel = () => {
    setIsManagementPanelOpen(!isManagementPanelOpen);
  };

  const trackedSitesList: TrackedSiteDisplay[] = Object.keys(trackedSites).map(domain => ({
    domain,
    limit: trackedSites[domain],
    usage: usage[domain] || 0,
  }));

  if (isLoading) {
    return (
      <StyledContainer>
        <StyledLoadingContainer>
          <CircularProgress />
        </StyledLoadingContainer>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>
          Website Time Tracker
        </StyledTitle>
        <StyledManagementButton
          onClick={toggleManagementPanel}
          aria-label={isManagementPanelOpen ? 'Close management panel' : 'Open management panel'}
        >
          {isManagementPanelOpen ? <ExpandLessIcon /> : <SettingsIcon />}
        </StyledManagementButton>
      </StyledHeader>
      
      <StyledCollapseContainer>
        <Collapse in={isManagementPanelOpen}>
          <DomainManagementPanel
            trackedSites={trackedSitesList}
            onAddDomain={addDomain}
            onRemoveDomain={handleRemoveDomain}
            error={error?.message || null}
            onClearError={clearError}
          />
        </Collapse>
      </StyledCollapseContainer>
      
      <MetricsTile
        trackedSites={trackedSites}
        usage={usage}
      />
      
      <TrackedSitesList
        sites={trackedSitesList}
        onOpenManagementPanel={() => setIsManagementPanelOpen(true)}
      />
    </StyledContainer>
  );
}
