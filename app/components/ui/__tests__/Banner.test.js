import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Banner from '../Banner';

describe('Banner Component', () => {
  describe('Rendering', () => {
    test('renders with title and description', () => {
      render(
        <Banner title="Test Title" description="Test description" />
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('renders with children instead of description', () => {
      render(
        <Banner title="Test Title">
          <p>Custom child content</p>
        </Banner>
      );
      expect(screen.getByText('Custom child content')).toBeInTheDocument();
    });

    test('renders with custom icon', () => {
      render(<Banner icon="🔥" title="Custom Icon" />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('renders info variant by default', () => {
      const { container } = render(<Banner title="Info" />);
      const banner = container.querySelector('.bg-info-50');
      expect(banner).toBeInTheDocument();
    });

    test('uses default info icon when no icon provided', () => {
      render(<Banner title="Info" variant="info" />);
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });

    test('renders warning variant', () => {
      const { container } = render(<Banner title="Warning" variant="warning" />);
      const banner = container.querySelector('.bg-orange-50');
      expect(banner).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    test('renders error variant', () => {
      const { container } = render(<Banner title="Error" variant="error" />);
      const banner = container.querySelector('.bg-danger-50');
      expect(banner).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    test('renders success variant', () => {
      const { container } = render(<Banner title="Success" variant="success" />);
      const banner = container.querySelector('.bg-success-50');
      expect(banner).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    test('falls back to info variant for invalid variant', () => {
      const { container } = render(
        <Banner title="Invalid" variant="invalid" />
      );
      const banner = container.querySelector('.bg-info-50');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    test('renders action buttons', () => {
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

    test('does not render actions container when no actions provided', () => {
      const { container } = render(<Banner title="No Actions" />);
      const actionsDiv = container.querySelector('.flex.flex-col.sm\\:flex-row.gap-2');
      expect(actionsDiv).not.toBeInTheDocument();
    });
  });

  describe('Dismissible', () => {
    test('shows dismiss button when dismissible is true', () => {
      const handleDismiss = jest.fn();
      render(
        <Banner
          title="Dismissible"
          dismissible
          onDismiss={handleDismiss}
        />
      );
      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
    });

    test('does not show dismiss button by default', () => {
      render(<Banner title="Not Dismissible" />);
      const dismissButton = screen.queryByLabelText('Dismiss');
      expect(dismissButton).not.toBeInTheDocument();
    });

    test('calls onDismiss when dismiss button clicked', async () => {
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

    test('does not show dismiss button if dismissible is true but onDismiss is not provided', () => {
      render(<Banner title="Missing Handler" dismissible />);
      const dismissButton = screen.queryByLabelText('Dismiss');
      expect(dismissButton).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className', () => {
      const { container } = render(
        <Banner title="Custom Class" className="custom-banner" />
      );
      const banner = container.querySelector('.custom-banner');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    test('renders JSX in description prop', () => {
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

    test('renders both description and children', () => {
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
    test('dismiss button has proper aria-label', () => {
      const handleDismiss = jest.fn();
      render(
        <Banner
          title="Accessible"
          dismissible
          onDismiss={handleDismiss}
        />
      );
      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
    });

    test('maintains proper heading hierarchy', () => {
      render(<Banner title="Heading Test" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Heading Test');
    });
  });
});
