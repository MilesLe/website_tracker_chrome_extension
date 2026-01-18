import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils';
import MetricsTile from '../../../src/popup/components/MetricsTile';

describe('MetricsTile', () => {
  it('should render metrics tile with labels', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{}}
        usage={{}}
      />
    );

    expect(screen.getByTestId('metrics-tile')).toBeInTheDocument();
    expect(screen.getByText('Total Time Today')).toBeInTheDocument();
    expect(screen.getByText('Total Time Allowed')).toBeInTheDocument();
    expect(screen.getByText('Time Used')).toBeInTheDocument();
  });

  it('should display zero metrics when no sites are tracked', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{}}
        usage={{}}
      />
    );

    // Should show 0m for both time values (there are two: Total Time Today and Total Time Allowed)
    const zeroMValues = screen.getAllByText('0m');
    expect(zeroMValues.length).toBe(2);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should calculate total minutes correctly for single site', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{ 'youtube.com': 60 }}
        usage={{ 'youtube.com': 30 }}
      />
    );

    expect(screen.getByText('30m')).toBeInTheDocument(); // Total time
    expect(screen.getByText('1h')).toBeInTheDocument(); // Total allowed
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should calculate total minutes correctly for multiple sites', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{
          'youtube.com': 60,
          'facebook.com': 30,
          'twitter.com': 45,
        }}
        usage={{
          'youtube.com': 30,
          'facebook.com': 15,
          'twitter.com': 20,
        }}
      />
    );

    // Total: 30 + 15 + 20 = 65 minutes = 1h 5m
    expect(screen.getByText('1h 5m')).toBeInTheDocument();
    // Total allowed: 60 + 30 + 45 = 135 minutes = 2h 15m
    expect(screen.getByText('2h 15m')).toBeInTheDocument();
    // Percentage: 65 / 135 * 100 = 48.1%
    expect(screen.getByText('48.1%')).toBeInTheDocument();
  });

  it('should handle decimal values correctly', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{
          'youtube.com': 60,
          'facebook.com': 30,
        }}
        usage={{
          'youtube.com': 25.7,
          'facebook.com': 12.3,
        }}
      />
    );

    // Total: 25.7 + 12.3 = 38 minutes
    expect(screen.getByText('38m')).toBeInTheDocument();
    // Total allowed: 60 + 30 = 90 minutes = 1h 30m
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    // Percentage: 38 / 90 * 100 = 42.2%
    expect(screen.getByText('42.2%')).toBeInTheDocument();
  });

  it('should handle zero limit gracefully', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{ 'youtube.com': 0 }}
        usage={{ 'youtube.com': 0 }}
      />
    );

    // Should show 0m for both time values (there are two: Total Time Today and Total Time Allowed)
    const zeroMValues = screen.getAllByText('0m');
    expect(zeroMValues.length).toBe(2);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle sites with usage but no limit', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{}}
        usage={{ 'youtube.com': 30 }}
      />
    );

    // Usage exists but no tracked sites, so percentage should be 0%
    expect(screen.getByText('30m')).toBeInTheDocument(); // Total time
    expect(screen.getByText('0m')).toBeInTheDocument(); // Total allowed (no sites tracked)
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle sites with limit but no usage', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{ 'youtube.com': 60 }}
        usage={{}}
      />
    );

    expect(screen.getByText('0m')).toBeInTheDocument(); // Total time (no usage)
    expect(screen.getByText('1h')).toBeInTheDocument(); // Total allowed
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle over-limit usage correctly', () => {
    renderWithTheme(
      <MetricsTile
        trackedSites={{
          'youtube.com': 60,
          'facebook.com': 30,
        }}
        usage={{
          'youtube.com': 70, // Over limit
          'facebook.com': 30,
        }}
      />
    );

    // Total: 70 + 30 = 100 minutes = 1h 40m
    expect(screen.getByText('1h 40m')).toBeInTheDocument();
    // Total allowed: 60 + 30 = 90 minutes = 1h 30m
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    // Percentage: 100 / 90 * 100 = 111.1%
    expect(screen.getByText('111.1%')).toBeInTheDocument();
  });
});
