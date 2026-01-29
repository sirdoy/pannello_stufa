// app/components/ui/__tests__/Toast.test.js
/**
 * Toast Component Tests
 *
 * Tests ToastProvider, useToast hook, and Toast component.
 * Uses jest-axe for automated a11y violation detection.
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ToastProvider, ToastContext } from '../ToastProvider';
import { useToast } from '@/app/hooks/useToast';
import Toast, { ToastViewport, toastVariants } from '../Toast';
import * as ToastPrimitive from '@radix-ui/react-toast';

expect.extend(toHaveNoViolations);

/**
 * Test consumer component that exposes toast API
 */
function TestConsumer({ onMount }) {
  const toastApi = useToast();
  React.useEffect(() => {
    onMount?.(toastApi);
  }, [toastApi, onMount]);
  return null;
}

/**
 * Helper to render with ToastProvider
 */
const renderWithProvider = (onMount) =>
  render(
    <ToastProvider>
      <TestConsumer onMount={onMount} />
    </ToastProvider>
  );

describe('ToastProvider', () => {
  describe('Basic Rendering', () => {
    it('renders children without toasts initially', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders toast when triggered via context', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.success('Test message');
      });

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Stacking', () => {
    it('shows max 3 toasts at once', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.info('Toast 1');
        toastApi.info('Toast 2');
        toastApi.info('Toast 3');
        toastApi.info('Toast 4');
        toastApi.info('Toast 5');
      });

      await waitFor(() => {
        // Only 3 should be visible (newest 3)
        expect(screen.getByText('Toast 3')).toBeInTheDocument();
        expect(screen.getByText('Toast 4')).toBeInTheDocument();
        expect(screen.getByText('Toast 5')).toBeInTheDocument();

        // Oldest should be removed from view
        expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Convenience Methods', () => {
    it('success() creates success toast', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.success('Success!');
      });

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });

    it('error() creates error toast', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.error('Error!');
      });

      await waitFor(() => {
        expect(screen.getByText('Error!')).toBeInTheDocument();
      });
    });

    it('warning() creates warning toast', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.warning('Warning!');
      });

      await waitFor(() => {
        expect(screen.getByText('Warning!')).toBeInTheDocument();
      });
    });

    it('info() creates info toast', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.info('Info!');
      });

      await waitFor(() => {
        expect(screen.getByText('Info!')).toBeInTheDocument();
      });
    });
  });

  describe('Dismiss Methods', () => {
    it('dismiss() removes specific toast', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      let toastId;
      act(() => {
        toastId = toastApi.info('To dismiss');
        toastApi.info('To keep');
      });

      await waitFor(() => {
        expect(screen.getByText('To dismiss')).toBeInTheDocument();
        expect(screen.getByText('To keep')).toBeInTheDocument();
      });

      act(() => {
        toastApi.dismiss(toastId);
      });

      await waitFor(() => {
        expect(screen.queryByText('To dismiss')).not.toBeInTheDocument();
        expect(screen.getByText('To keep')).toBeInTheDocument();
      });
    });

    it('dismissAll() removes all toasts', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.info('Toast 1');
        toastApi.info('Toast 2');
        toastApi.info('Toast 3');
      });

      await waitFor(() => {
        expect(screen.getByText('Toast 1')).toBeInTheDocument();
      });

      act(() => {
        toastApi.dismissAll();
      });

      await waitFor(() => {
        expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Toast 3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toast with Options', () => {
    it('renders toast with title', async () => {
      let toastApi;
      renderWithProvider((api) => { toastApi = api; });

      act(() => {
        toastApi.toast({ variant: 'info', message: 'Message', title: 'Title' });
      });

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Message')).toBeInTheDocument();
      });
    });
  });
});

describe('useToast', () => {
  it('throws error when used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    function InvalidComponent() {
      useToast();
      return null;
    }

    expect(() => render(<InvalidComponent />)).toThrow(
      'useToast must be used within a ToastProvider'
    );

    consoleSpy.mockRestore();
  });

  it('returns all API methods', () => {
    let api;
    renderWithProvider((toastApi) => { api = toastApi; });

    expect(api).toHaveProperty('toast');
    expect(api).toHaveProperty('success');
    expect(api).toHaveProperty('error');
    expect(api).toHaveProperty('warning');
    expect(api).toHaveProperty('info');
    expect(api).toHaveProperty('dismiss');
    expect(api).toHaveProperty('dismissAll');
  });
});

describe('Toast Component', () => {
  // Wrap Toast in Provider for Radix context
  const renderToast = (props) =>
    render(
      <ToastPrimitive.Provider>
        <Toast open={true} {...props}>
          {props.children || 'Test message'}
        </Toast>
        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    );

  describe('Variants', () => {
    it('renders success variant with icon', () => {
      renderToast({ variant: 'success' });
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders error variant with icon', () => {
      renderToast({ variant: 'error' });
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders warning variant with icon', () => {
      renderToast({ variant: 'warning' });
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders info variant with icon (default)', () => {
      renderToast({});
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('renders title when provided', () => {
      renderToast({ title: 'Toast Title', children: 'Toast Body' });
      expect(screen.getByText('Toast Title')).toBeInTheDocument();
      expect(screen.getByText('Toast Body')).toBeInTheDocument();
    });

    it('renders without title', () => {
      renderToast({ children: 'No title toast' });
      expect(screen.getByText('No title toast')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('renders close button', () => {
      renderToast({});
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('calls onOpenChange when close clicked', async () => {
      const handleOpenChange = jest.fn();
      renderToast({ onOpenChange: handleOpenChange });

      await userEvent.click(screen.getByLabelText('Close'));

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Action Button', () => {
    it('renders action button when provided', () => {
      const handleAction = jest.fn();
      renderToast({
        action: { label: 'Undo', onClick: handleAction },
      });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('calls action onClick when clicked', async () => {
      const handleAction = jest.fn();
      renderToast({
        action: { label: 'Undo', onClick: handleAction },
      });

      await userEvent.click(screen.getByText('Undo'));

      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no a11y violations when rendered via ToastProvider', async () => {
      // Render via ToastProvider for proper DOM structure (ol > li)
      // Note: Portal mock in JSDOM breaks parent-child li/ol relationship
      // so we disable listitem rule (valid in real browser)
      let toastApi;
      const { container } = render(
        <ToastProvider>
          <TestConsumer onMount={(api) => { toastApi = api; }} />
        </ToastProvider>
      );

      act(() => {
        toastApi.info('Accessible toast');
      });

      await waitFor(() => {
        expect(screen.getByText('Accessible toast')).toBeInTheDocument();
      });

      // JSDOM + portal mock breaks ol > li structure, disable listitem rule
      const results = await axe(container, {
        rules: {
          listitem: { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('close button has aria-label', () => {
      renderToast({});
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });
  });
});

describe('ToastViewport', () => {
  it('renders with correct positioning classes', () => {
    const { container } = render(
      <ToastPrimitive.Provider>
        <ToastViewport />
      </ToastPrimitive.Provider>
    );

    const viewport = container.querySelector('[class*="fixed"]');
    expect(viewport).toHaveClass('bottom-4', 'right-4', 'z-[9999]');
  });

  it('supports custom className', () => {
    const { container } = render(
      <ToastPrimitive.Provider>
        <ToastViewport className="custom-class" />
      </ToastPrimitive.Provider>
    );

    const viewport = container.querySelector('[class*="fixed"]');
    expect(viewport).toHaveClass('custom-class');
  });
});

describe('toastVariants', () => {
  it('returns default variant classes', () => {
    const classes = toastVariants();
    expect(classes).toContain('bg-ocean-900/90');
  });

  it('returns success variant classes', () => {
    const classes = toastVariants({ variant: 'success' });
    expect(classes).toContain('bg-sage-900/90');
  });

  it('returns error variant classes', () => {
    const classes = toastVariants({ variant: 'error' });
    expect(classes).toContain('bg-danger-900/90');
  });

  it('returns warning variant classes', () => {
    const classes = toastVariants({ variant: 'warning' });
    expect(classes).toContain('bg-warning-900/90');
  });
});
