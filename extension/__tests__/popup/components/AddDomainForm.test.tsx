import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddDomainForm from '../../../src/popup/components/AddDomainForm';

describe('AddDomainForm', () => {
  const mockOnAddDomain = vi.fn();
  const mockOnClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByLabelText(/domain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add domain/i })).toBeInTheDocument();
  });

  it('should call onAddDomain when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnAddDomain.mockResolvedValue(true);

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    const domainInput = screen.getByLabelText(/domain/i);
    const limitInput = screen.getByLabelText(/daily limit/i);
    const submitButton = screen.getByRole('button', { name: /add domain/i });

    await user.type(domainInput, 'youtube.com');
    await user.type(limitInput, '60');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddDomain).toHaveBeenCalledWith('youtube.com', '60');
    });
  });

  it('should clear inputs after successful submission', async () => {
    const user = userEvent.setup();
    mockOnAddDomain.mockResolvedValue(true);

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    const domainInput = screen.getByLabelText(/domain/i) as HTMLInputElement;
    const limitInput = screen.getByLabelText(/daily limit/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /add domain/i });

    await user.type(domainInput, 'youtube.com');
    await user.type(limitInput, '60');
    await user.click(submitButton);

    await waitFor(() => {
      expect(domainInput.value).toBe('');
      expect(limitInput.value).toBe('');
    });
  });

  it('should display error message when error is provided', () => {
    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error="Invalid domain format"
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('Invalid domain format')).toBeInTheDocument();
  });

  it('should call onClearError when error alert is closed', async () => {
    const user = userEvent.setup();

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error="Some error"
        onClearError={mockOnClearError}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClearError).toHaveBeenCalled();
  });

  it('should clear error when domain input changes', async () => {
    const user = userEvent.setup();

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error="Some error"
        onClearError={mockOnClearError}
      />
    );

    const domainInput = screen.getByLabelText(/domain/i);
    await user.type(domainInput, 'a');

    expect(mockOnClearError).toHaveBeenCalled();
  });

  it('should clear error when limit input changes', async () => {
    const user = userEvent.setup();

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error="Some error"
        onClearError={mockOnClearError}
      />
    );

    const limitInput = screen.getByLabelText(/daily limit/i);
    await user.type(limitInput, '1');

    expect(mockOnClearError).toHaveBeenCalled();
  });

  it('should submit form on Enter key press', async () => {
    const user = userEvent.setup();
    mockOnAddDomain.mockResolvedValue(true);

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    const domainInput = screen.getByLabelText(/domain/i);
    const limitInput = screen.getByLabelText(/daily limit/i);

    await user.type(domainInput, 'youtube.com');
    await user.type(limitInput, '60{Enter}');

    await waitFor(() => {
      expect(mockOnAddDomain).toHaveBeenCalled();
    });
  });

  it('should disable form while submitting', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<boolean>((resolve) => {
      resolvePromise = () => resolve(true);
    });
    mockOnAddDomain.mockReturnValue(promise);

    render(
      <AddDomainForm
        onAddDomain={mockOnAddDomain}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    const domainInput = screen.getByLabelText(/domain/i);
    const limitInput = screen.getByLabelText(/daily limit/i);
    const submitButton = screen.getByRole('button', { name: /add domain/i });

    await user.type(domainInput, 'youtube.com');
    await user.type(limitInput, '60');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(domainInput).toBeDisabled();
    expect(limitInput).toBeDisabled();

    resolvePromise!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
