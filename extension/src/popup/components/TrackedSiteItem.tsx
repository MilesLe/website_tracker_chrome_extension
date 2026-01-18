import { useState, useRef } from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import styled from '@emotion/styled';
import ProgressBar from './ProgressBar';
import { getFaviconUrl, getDomainInitial } from '../utils/favicon';
import { formatTimeRange } from '../utils/timeFormat';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

interface TrackedSiteItemProps {
  site: TrackedSiteDisplay;
}

interface StyledCellProps {
  isOverLimit: boolean;
  isExpanded: boolean;
}

const StyledCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit' && prop !== 'isExpanded',
})<StyledCellProps>`
  border-radius: 6px;
  background-color: ${({ isOverLimit }) => 
    isOverLimit 
      ? 'rgba(211, 47, 47, 0.2)' 
      : 'rgba(74, 124, 89, 0.15)'};
  border: 1px solid ${({ theme, isOverLimit }) => 
    isOverLimit 
      ? theme.palette.error.main 
      : theme.palette.success.main};
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  padding: ${({ isExpanded }) => (isExpanded ? '12px' : '8px 12px')};
  overflow: hidden;
  position: relative;
  isolation: isolate;
  z-index: 1;
  
  &:hover {
    z-index: 2;
    border-color: ${({ theme, isOverLimit }) => 
      isOverLimit 
        ? theme.palette.error.dark 
        : theme.palette.success.dark};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const StyledCompactContent = styled(Box)`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const StyledFaviconContainer = styled(Box)`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

const StyledFavicon = styled('img')`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const StyledFallbackIcon = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

const StyledDomainName = styled(Typography)`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledExpandedContent = styled(Box)`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StyledTimeText = styled(Typography)`
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-bottom: 4px;
`;

const StyledPercentageText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isOverLimit',
})<{ isOverLimit: boolean }>`
  font-size: 11px;
  color: ${({ theme, isOverLimit }) => 
    isOverLimit 
      ? theme.palette.error.main 
      : theme.palette.primary.light};
  font-weight: 500;
  margin-bottom: 6px;
`;

const StyledProgressContainer = styled(Box)`
  margin-top: 4px;
`;

/**
 * Component for displaying a single tracked site with compact/expanded view
 * - Compact: Shows domain name, favicon, and color indicator
 * - Expanded (on hover/click): Shows time, percentage, and minimal progress bar
 */
export default function TrackedSiteItem({ site }: TrackedSiteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const wasClickedRef = useRef(false);
  
  const percentage = Math.min((site.usage / site.limit) * 100, 100);
  const isOverLimit = site.usage >= site.limit;
  const faviconUrl = getFaviconUrl(site.domain, 32);
  const domainInitial = getDomainInitial(site.domain);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    // Only expand if not clicked (clicked cells stay expanded until clicked again)
    if (!wasClickedRef.current) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    // Only collapse if not clicked (clicked cells stay expanded)
    if (!wasClickedRef.current) {
      setIsExpanded(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    // Toggle clicked state and expansion
    const newExpandedState = !isExpanded;
    wasClickedRef.current = newExpandedState;
    setIsExpanded(newExpandedState);
  };

  return (
    <StyledCell
      data-testid={`tracked-site-${site.domain}`}
      isOverLimit={isOverLimit}
      isExpanded={isExpanded}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <StyledCompactContent>
        <StyledFaviconContainer>
          {!faviconError ? (
            <StyledFavicon
              src={faviconUrl}
              alt={`${site.domain} favicon`}
              onError={() => setFaviconError(true)}
            />
          ) : (
            <StyledFallbackIcon>
              {domainInitial}
            </StyledFallbackIcon>
          )}
        </StyledFaviconContainer>
        <StyledDomainName title={site.domain}>
          {site.domain}
        </StyledDomainName>
      </StyledCompactContent>
      
      <Collapse 
        in={isExpanded} 
        timeout={300}
        easing={{ enter: 'cubic-bezier(0.4, 0, 0.2, 1)', exit: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <StyledExpandedContent>
          <StyledTimeText>
            {formatTimeRange(site.usage, site.limit)}
          </StyledTimeText>
          <StyledPercentageText isOverLimit={isOverLimit}>
            {percentage.toFixed(1)}%
          </StyledPercentageText>
          <StyledProgressContainer>
            <ProgressBar 
              percentage={percentage} 
              isOverLimit={isOverLimit}
              minimal={true}
              showLabel={false}
            />
          </StyledProgressContainer>
        </StyledExpandedContent>
      </Collapse>
    </StyledCell>
  );
}
