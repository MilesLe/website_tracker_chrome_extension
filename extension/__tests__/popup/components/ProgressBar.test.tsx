import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils';
import ProgressBar from '../../../src/popup/components/ProgressBar';

describe('ProgressBar', () => {
  it('should render progress bar with percentage', () => {
    renderWithTheme(<ProgressBar percentage={50} isOverLimit={false} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('should display percentage label when showLabel is true', () => {
    renderWithTheme(<ProgressBar percentage={75.5} isOverLimit={false} showLabel={true} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('75.5%')).toBeInTheDocument();
  });

  it('should not display label when showLabel is false', () => {
    renderWithTheme(<ProgressBar percentage={50} isOverLimit={false} showLabel={false} />);
    
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('should clamp percentage to 0-100 range', () => {
    const { rerender } = renderWithTheme(<ProgressBar percentage={150} isOverLimit={false} />);
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    rerender(<ProgressBar percentage={-10} isOverLimit={false} />);
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should format percentage to one decimal place', () => {
    renderWithTheme(<ProgressBar percentage={75.555} isOverLimit={false} />);
    expect(screen.getByText('75.6%')).toBeInTheDocument();
  });
});
