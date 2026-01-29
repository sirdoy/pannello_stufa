// app/components/ui/__tests__/Banner.test.js
/**
 * Banner Component Tests
 *
 * Tests CVA variants, dismiss functionality, localStorage persistence,
 * lucide icons, and accessibility.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Banner from '../Banner';

expect.extend(toHaveNoViolations);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Banner', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with title and description', () => {
      render(
        <Banner title="Test Title" description="Test description" />
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders with children instead of description', () => {
      render(
        <Banner title="Test Title">
          <p>Custom child content</p>
        </Banner>
      );
      expect(screen.getByText('Custom child content')).toBeInTheDocument();
    });

    it('renders with custom emoji icon', () => {
      render(<Banner icon="🔥" title="Custom Icon" />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('renders default lucide icon when no custom icon provided', () => {
      const { container } = render(<Banner title="Info" variant="info" />);
      // Lucide Info icon should be rendered as SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
      render(<Banner title="Alert" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('CVA Variants', () => {
    it('applies info variant by default', () => {
      const { container } = render(<Banner title="Info" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-ocean-500/[0.15]');
      expect(banner).toHaveClass('border-ocean-500/25');
    });

    it('applies warning variant', () => {
      const { container } = render(<Banner title="Warning" variant="warning" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-warning-500/[0.15]');
      expect(banner).toHaveClass('border-warning-500/25');
    });

    it('applies error variant', () => {
      const { container } = render(<Banner title="Error" variant="error" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-danger-500/[0.15]');
      expect(banner).toHaveClass('border-danger-500/25');
    });

    it('applies success variant', () => {
      const { container } = render(<Banner title="Success" variant="success" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-sage-500/[0.15]');
      expect(banner).toHaveClass('border-sage-500/25');
    });

    it('applies ember variant with glow', () => {
      const { container } = render(<Banner title="Ember" variant="ember" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-ember-500/[0.15]');
      expect(banner).toHaveClass('border-ember-500/25');
      expect(banner).toHaveClass('shadow-ember-glow-sm');
    });

    it('falls back to info variant for invalid variant', () => {
      const { container } = render(
        <Banner title="Invalid" variant="invalid" />
      );
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-ocean-500/[0.15]');
    });
  });

  describe('Compact Mode', () => {
    it('applies compact padding when compact is true', () => {
      const { container } = render(<Banner title="Compact" compact />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('p-3');
    });

    it('applies default padding when compact is false', () => {
      const { container } = render(<Banner title="Default" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('p-4');
    });
  });

  describe('Actions', () => {
    it('renders action buttons', () => {
      render(
        <Banner
          title="With Actions"
          actions={
            <>
              <button>Action 1</button>
              <button>Action 2</button>
            </>
          }
        />
      );
      expect(screen.getByRole('button', { name: /action 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action 2/i })).toBeInTheDocument();
    });

    it('does not render actions container when no actions provided', () => {
      const { container } = render(<Banner title="No Actions" />);
      const actionsDiv = container.querySelector('.flex.flex-wrap.gap-2.mt-2');
      expect(actionsDiv).not.toBeInTheDocument();
    });
  });

  describe('Dismissible', () => {
    it('shows dismiss button when dismissible is true', () => {
      render(
        <Banner
          title="Dismissible"
          dismissible
        />
      );
      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
    });

    it('does not show dismiss button by default', () => {
      render(<Banner title="Not Dismissible" />);
      const dismissButton = screen.queryByLabelText('Dismiss');
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button clicked', async () => {
      const handleDismiss = jest.fn();
      const user = userEvent.setup();

      render(
        <Banner
          title="Dismissible"
          dismissible
          onDismiss={handleDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('hides banner after dismiss', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Banner
          title="Dismissible"
          dismissible
        />
      );

      expect(screen.getByText('Dismissible')).toBeInTheDocument();

      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Persistent Dismissal (localStorage)', () => {
    it('saves dismissal to localStorage with dismissKey', async () => {
      const user = userEvent.setup();

      render(
        <Banner
          title="Persistent"
          dismissible
          dismissKey="test-banner"
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'banner-dismissed-test-banner',
        'true'
      );
    });

    it('checks localStorage on mount with dismissKey', () => {
      localStorageMock.getItem.mockReturnValueOnce('true');

      const { container } = render(
        <Banner
          title="Should be hidden"
          dismissKey="already-dismissed"
        />
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'banner-dismissed-already-dismissed'
      );
      expect(container.firstChild).toBeNull();
    });

    it('shows banner if not dismissed in localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      render(
        <Banner
          title="Should be visible"
          dismissKey="not-dismissed"
        />
      );

      expect(screen.getByText('Should be visible')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Banner title="Custom Class" className="custom-banner" />
      );
      const banner = container.firstChild;
      expect(banner).toHaveClass('custom-banner');
    });

    it('merges className with CVA classes', () => {
      const { container } = render(
        <Banner title="Merged" variant="warning" className="mt-4" />
      );
      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-warning-500/[0.15]'); // CVA
      expect(banner).toHaveClass('mt-4'); // Custom
    });
  });

  describe('Complex Content', () => {
    it('renders JSX in description prop', () => {
      render(
        <Banner
          title="JSX Description"
          description={
            <>
              Text with <strong>bold</strong> and <em>italic</em>
            </>
          }
        />
      );
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });

    it('renders both description and children', () => {
      render(
        <Banner
          title="Both"
          description="Description text"
        >
          <div>Children content</div>
        </Banner>
      );
      expect(screen.getByText('Description text')).toBeInTheDocument();
      expect(screen.getByText('Children content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('dismiss button has proper aria-label', () => {
      render(
        <Banner
          title="Accessible"
          dismissible
        />
      );
      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
    });

    it('maintains proper heading hierarchy', () => {
      render(<Banner title="Heading Test" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Heading Test');
    });

    it('marks icon as decorative with aria-hidden', () => {
      const { container } = render(<Banner title="Test" />);
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('has no accessibility violations with info variant', async () => {
      const { container } = render(
        <Banner
          title="Info Banner"
          description="Information message"
          variant="info"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with dismissible banner', async () => {
      const { container } = render(
        <Banner
          title="Dismissible Banner"
          description="Can be dismissed"
          dismissible
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all variants', async () => {
      const variants = ['info', 'warning', 'error', 'success', 'ember'];

      for (const variant of variants) {
        const { container } = render(
          <Banner
            title={`${variant} Banner`}
            description="Test description"
            variant={variant}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Base Classes', () => {
    it('always has rounded-xl and backdrop-blur-lg classes', () => {
      const { container } = render(<Banner title="Test" />);
      const banner = container.firstChild;
      expect(banner).toHaveClass('rounded-xl');
      expect(banner).toHaveClass('backdrop-blur-lg');
      expect(banner).toHaveClass('border');
    });
  });
});
