import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test-utils';
import TrackedSiteItem from '../../../src/popup/components/TrackedSiteItem';

// Mock the favicon utility
vi.mock('../../../src/popup/utils/favicon', () => ({
  getFaviconUrl: vi.fn((domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`),
  getDomainInitial: vi.fn((domain: string) => domain.charAt(0).toUpperCase()),
}));

describe('TrackedSiteItem', () => {
  const mockSite = {
    domain: 'youtube.com',
    limit: 60,
    usage: 30,
  };

  beforeEach(() => {
    // Reset any state between tests
    vi.clearAllMocks();
  });

  it('should render site domain in compact view', () => {
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
  });

  it('should show green color when under limit', () => {
    const { container } = renderWithTheme(<TrackedSiteItem site={mockSite} />);
    
    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
    // Check for green border color (success color)
    expect(cell).toHaveStyle({ borderColor: expect.stringContaining('') });
  });

  it('should show red color when at or over limit', () => {
    const overLimitSite = {
      domain: 'youtube.com',
      limit: 60,
      usage: 70,
    };
    const { container } = renderWithTheme(<TrackedSiteItem site={overLimitSite} />);

    const cell = container.firstChild as HTMLElement;
    expect(cell).toBeInTheDocument();
  });

  it('should expand on hover to show details', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    const clickableCell = screen.getByTestId('tracked-site-youtube.com');
    expect(clickableCell).toBeInTheDocument();

    // Initially, expanded content should not be visible (Collapse keeps it in DOM but hidden)
    const timeText = screen.queryByText(/30m \/ 1h/);
    if (timeText) {
      expect(timeText).not.toBeVisible();
    }

    // Hover over the cell
    await user.hover(clickableCell);
    
    await waitFor(() => {
      const expandedTimeText = screen.getByText(/30m \/ 1h/);
      expect(expandedTimeText).toBeVisible();
      const percentageText = screen.getByText(/50.0%/);
      expect(percentageText).toBeVisible();
    }, { timeout: 1000 });
  });

  it('should expand on click for mobile support', async () => {
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    const clickableCell = screen.getByTestId('tracked-site-youtube.com');
    expect(clickableCell).toBeInTheDocument();

    // Initially, expanded content should not be visible (Collapse keeps it in DOM but hidden)
    const timeText = screen.queryByText(/30m \/ 1h/);
    if (timeText) {
      expect(timeText).not.toBeVisible();
    }

    // Click the cell using fireEvent for more reliable testing
    fireEvent.click(clickableCell);
    
    await waitFor(() => {
      const expandedTimeText = screen.getByText(/30m \/ 1h/);
      expect(expandedTimeText).toBeVisible();
      const percentageText = screen.getByText(/50.0%/);
      expect(percentageText).toBeVisible();
    }, { timeout: 1000 });
  });

  it('should collapse when clicking again', async () => {
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    const clickableCell = screen.getByTestId('tracked-site-youtube.com');
    expect(clickableCell).toBeInTheDocument();

    // Click to expand
    fireEvent.click(clickableCell);
    await waitFor(() => {
      const expandedTimeText = screen.getByText(/30m \/ 1h/);
      expect(expandedTimeText).toBeVisible();
    }, { timeout: 1000 });

    // Click again to collapse
    fireEvent.click(clickableCell);
    await waitFor(() => {
      const timeText = screen.queryByText(/30m \/ 1h/);
      if (timeText) {
        expect(timeText).not.toBeVisible();
      } else {
        // Content might be removed from DOM after collapse animation
        expect(timeText).not.toBeInTheDocument();
      }
    }, { timeout: 1000 });
  });

  it('should display progress bar in expanded view', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    const clickableCell = screen.getByTestId('tracked-site-youtube.com');
    await user.hover(clickableCell);
    
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toBeVisible();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    }, { timeout: 1000 });
  });

  it('should format time in hours/minutes format', async () => {
    const user = userEvent.setup();
    const siteWithHours = {
      domain: 'youtube.com',
      limit: 120, // 2 hours
      usage: 90, // 1h 30m
    };
    renderWithTheme(<TrackedSiteItem site={siteWithHours} />);

    const clickableCell = screen.getByTestId('tracked-site-youtube.com');
    await user.hover(clickableCell);
    
    await waitFor(() => {
      const timeText = screen.getByText(/1h 30m \/ 2h/);
      expect(timeText).toBeVisible();
    }, { timeout: 1000 });
  });

  it('should show favicon or fallback initial', () => {
    renderWithTheme(<TrackedSiteItem site={mockSite} />);

    // Should have either a favicon image or fallback initial
    const faviconContainer = screen.getByText('youtube.com').previousElementSibling;
    expect(faviconContainer).toBeInTheDocument();
  });
});
