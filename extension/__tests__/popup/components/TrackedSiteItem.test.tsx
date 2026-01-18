import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrackedSiteItem from '../../../src/popup/components/TrackedSiteItem';

describe('TrackedSiteItem', () => {
  const mockSite = {
    domain: 'youtube.com',
    limit: 60,
    usage: 30,
  };

  it('should render site information', () => {
    const onRemove = vi.fn();
    render(<TrackedSiteItem site={mockSite} onRemove={onRemove} />);

    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    expect(screen.getByText('30.0 / 60 minutes')).toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<TrackedSiteItem site={mockSite} onRemove={onRemove} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('youtube.com');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('should display progress bar', () => {
    const onRemove = vi.fn();
    render(<TrackedSiteItem site={mockSite} onRemove={onRemove} />);

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
    const onRemove = vi.fn();
    const { container } = render(<TrackedSiteItem site={overLimitSite} onRemove={onRemove} />);

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('should format usage to one decimal place', () => {
    const siteWithDecimal = {
      domain: 'youtube.com',
      limit: 60,
      usage: 30.555,
    };
    const onRemove = vi.fn();
    render(<TrackedSiteItem site={siteWithDecimal} onRemove={onRemove} />);

    expect(screen.getByText('30.6 / 60 minutes')).toBeInTheDocument();
  });
});
