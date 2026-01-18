import { Box, CircularProgress } from '@mui/material';
import styled from '@emotion/styled';
import { useTrackedSites } from './hooks/useTrackedSites';
import { useDomainManagement } from './hooks/useDomainManagement';
import AddDomainForm from './components/AddDomainForm';
import TrackedSitesList from './components/TrackedSitesList';

const StyledContainer = styled(Box)`
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const StyledTitle = styled(Box)`
  margin-top: 0;
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: 500;
`;

const StyledSectionTitle = styled(Box)`
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 500;
`;

const StyledLoadingContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
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

  const handleRemoveDomain = async (domain: string) => {
    try {
      await removeDomain(domain);
    } catch (err) {
      console.error('Error removing domain:', err);
    }
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
      <StyledTitle>
        Website Time Tracker
      </StyledTitle>
      
      <AddDomainForm
        onAddDomain={addDomain}
        error={error?.message || null}
        onClearError={clearError}
      />
      
      <Box>
        <StyledSectionTitle>
          Tracked Sites
        </StyledSectionTitle>
        
        <TrackedSitesList
          sites={trackedSitesList}
          onRemoveDomain={handleRemoveDomain}
        />
      </Box>
    </StyledContainer>
  );
}
