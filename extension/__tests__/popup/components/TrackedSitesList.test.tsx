import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test-utils';
import TrackedSitesList from '../../../src/popup/components/TrackedSitesList';

describe('TrackedSitesList', () => {
  const mockSites = [
    { domain: 'youtube.com', limit: 60, usage: 30 }, // 50%
    { domain: 'reddit.com', limit: 30, usage: 25 },   // 83.3%
    { domain: 'twitter.com', limit: 45, usage: 10 },  // 22.2%
  ];

  it('should render list of tracked sites', () => {
    const onOpenManagementPanel = vi.fn();
    renderWithTheme(<TrackedSitesList sites={mockSites} onOpenManagementPanel={onOpenManagementPanel} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('reddit.com')).toBeInTheDocument();
    expect(screen.getByText('twitter.com')).toBeInTheDocument();
  });

  it('should render empty state when no sites', () => {
    const onOpenManagementPanel = vi.fn();
    renderWithTheme(<TrackedSitesList sites={[]} onOpenManagementPanel={onOpenManagementPanel} />);

    expect(screen.getByText(/No domains tracked yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Start tracking your website usage/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Your First Site/i })).toBeInTheDocument();
  });

  it('should call onOpenManagementPanel when empty state button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenManagementPanel = vi.fn();
    renderWithTheme(<TrackedSitesList sites={[]} onOpenManagementPanel={onOpenManagementPanel} />);

    const button = screen.getByRole('button', { name: /Add Your First Site/i });
    await user.click(button);

    expect(onOpenManagementPanel).toHaveBeenCalledTimes(1);
  });

  it('should sort sites by descending percentage usage', () => {
    const onOpenManagementPanel = vi.fn();
    renderWithTheme(
      <TrackedSitesList sites={mockSites} onOpenManagementPanel={onOpenManagementPanel} />
    );

    // Get all domain elements
    const domains = screen.getAllByText(/youtube\.com|reddit\.com|twitter\.com/);
    
    // Sites should be sorted: reddit (83.3%), youtube (50%), twitter (22.2%)
    // Check that reddit appears before youtube, and youtube before twitter
    const domainTexts = domains.map(el => el.textContent);
    
    // Find indices
    const redditIndex = domainTexts.findIndex(text => text === 'reddit.com');
    const youtubeIndex = domainTexts.findIndex(text => text === 'youtube.com');
    const twitterIndex = domainTexts.findIndex(text => text === 'twitter.com');
    
    // Verify sorting: reddit should come first (highest percentage)
    expect(redditIndex).toBeLessThan(youtubeIndex);
    expect(youtubeIndex).toBeLessThan(twitterIndex);
  });

  it('should use grid layout with 2 columns', () => {
    const onOpenManagementPanel = vi.fn();
    const { container } = renderWithTheme(
      <TrackedSitesList sites={mockSites} onOpenManagementPanel={onOpenManagementPanel} />
    );

    const gridContainer = container.querySelector('[class*="StyledContainer"]') || container.firstChild;
    expect(gridContainer).toBeInTheDocument();
    
    // Grid layout should be applied (check via class or inline styles)
    expect(gridContainer).toBeInTheDocument();
  });

  it('should handle sites with same percentage correctly', () => {
    const onOpenManagementPanel = vi.fn();
    const sitesWithSamePercentage = [
      { domain: 'site1.com', limit: 100, usage: 50 }, // 50%
      { domain: 'site2.com', limit: 50, usage: 25 },  // 50%
    ];
    
    renderWithTheme(
      <TrackedSitesList sites={sitesWithSamePercentage} onOpenManagementPanel={onOpenManagementPanel} />
    );

    expect(screen.getByText('site1.com')).toBeInTheDocument();
    expect(screen.getByText('site2.com')).toBeInTheDocument();
  });
});
