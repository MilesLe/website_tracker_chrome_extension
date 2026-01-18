import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils';
import TrackedSiteItem from '../../../src/popup/components/TrackedSiteItem';

describe('TrackedSiteItem', () => {
  const mockSite = {
    domain: 'youtube.com',
    limit: 60,
    usage: 30,
  };

  it('should render site information', () => {
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('30.0 / 60 minutes')).toBeInTheDocument();
  });

  it('should display progress bar', () => {
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('should show over limit styling when usage exceeds limit', () => {
    const overLimitSite = {
      domain: 'youtube.com',
      limit: 60,
      usage: 70,
    };
    const { container } = renderWithTheme(<TrackedSiteItem site={overLimitSite} />);

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('should format usage to one decimal place', () => {
    const siteWithDecimal = {
      domain: 'youtube.com',
      limit: 60,
      usage: 30.555,
    };
    renderWithTheme(<TrackedSiteItem site={siteWithDecimal} />);

    expect(screen.getByText('30.6 / 60 minutes')).toBeInTheDocument();
  });
});
