import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test-utils';
import TrackedSitesList from '../../../src/popup/components/TrackedSitesList';

describe('TrackedSitesList', () => {
  const mockSites = [
    { domain: 'youtube.com', limit: 60, usage: 30 },
    { domain: 'reddit.com', limit: 30, usage: 15 },
  ];

  it('should render list of tracked sites', () => {
    const onOpenManagementPanel = vi.fn();
    renderWithTheme(<TrackedSitesList sites={mockSites} onOpenManagementPanel={onOpenManagementPanel} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('reddit.com')).toBeInTheDocument();
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

  it('should render items when sites are provided', () => {
    const onOpenManagementPanel = vi.fn();
    renderWithTheme(<TrackedSitesList sites={mockSites} onOpenManagementPanel={onOpenManagementPanel} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('reddit.com')).toBeInTheDocument();
  });
});
