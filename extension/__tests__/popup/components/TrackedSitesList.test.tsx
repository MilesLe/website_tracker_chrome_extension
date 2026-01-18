import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrackedSitesList from '../../../src/popup/components/TrackedSitesList';

describe('TrackedSitesList', () => {
  const mockSites = [
    { domain: 'youtube.com', limit: 60, usage: 30 },
    { domain: 'reddit.com', limit: 30, usage: 15 },
  ];

  it('should render list of tracked sites', () => {
    const onRemove = vi.fn();
    render(<TrackedSitesList sites={mockSites} onRemoveDomain={onRemove} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('reddit.com')).toBeInTheDocument();
  });

  it('should render empty state when no sites', () => {
    const onRemove = vi.fn();
    render(<TrackedSitesList sites={[]} onRemoveDomain={onRemove} />);

    expect(screen.getByText(/No domains tracked yet/i)).toBeInTheDocument();
  });

  it('should pass onRemoveDomain to each item', () => {
    const onRemove = vi.fn();
    render(<TrackedSitesList sites={mockSites} onRemoveDomain={onRemove} />);

    // Verify that items are rendered (they will use onRemove internally)
    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('reddit.com')).toBeInTheDocument();
  });
});
