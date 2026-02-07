// app/components/ui/__tests__/PageLayout.test.js
/**
 * PageLayout Component Tests
 *
 * Tests accessibility, slot rendering, responsive variants, and prop handling.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PageLayout, { PageHeader, PageContent, PageFooter } from '../PageLayout';

expect.extend(toHaveNoViolations);

describe('PageLayout', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<PageLayout>Content</PageLayout>);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders header slot', () => {
      render(
        <PageLayout
          header={<PageLayout.Header title="Test Title" />}
        >
          Content
        </PageLayout>
      );
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title');
    });

    it('renders footer slot', () => {
      render(
        <PageLayout
          footer={<PageLayout.Footer>Footer Content</PageLayout.Footer>}
        >
          Content
        </PageLayout>
      );
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('renders all slots together', () => {
      render(
        <PageLayout
          header={<PageLayout.Header title="Page Title" description="Description" />}
          footer={<PageLayout.Footer>Footer</PageLayout.Footer>}
        >
          Main Content
        </PageLayout>
      );
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('PageHeader', () => {
    it('renders title and description', () => {
      render(
        <PageHeader title="Dashboard" description="Overview of your devices" />
      );
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
      expect(screen.getByText('Overview of your devices')).toBeInTheDocument();
    });

    it('renders actions slot', () => {
      render(
        <PageHeader
          title="Dashboard"
          actions={<button>Add Device</button>}
        />
      );
      expect(screen.getByRole('button')).toHaveTextContent('Add Device');
    });

    it('renders custom children instead of structured content', () => {
      render(
        <PageHeader>
          <div>Custom Header Content</div>
        </PageHeader>
      );
      expect(screen.getByText('Custom Header Content')).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(<PageHeader title="Test" className="custom-header" />);
      expect(screen.getByRole('banner')).toHaveClass('custom-header');
    });
  });

  describe('PageContent', () => {
    it('renders children', () => {
      render(<PageContent>Main Content</PageContent>);
      expect(screen.getByRole('main')).toHaveTextContent('Main Content');
    });

    it('has flex-1 for growth', () => {
      render(<PageContent>Content</PageContent>);
      expect(screen.getByRole('main')).toHaveClass('flex-1');
    });

    it('accepts custom className', () => {
      render(<PageContent className="custom-main">Content</PageContent>);
      expect(screen.getByRole('main')).toHaveClass('custom-main');
    });
  });

  describe('PageFooter', () => {
    it('renders children', () => {
      render(<PageFooter>Footer Content</PageFooter>);
      expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer Content');
    });

    it('has border-t class for separator', () => {
      render(<PageFooter>Footer</PageFooter>);
      expect(screen.getByRole('contentinfo')).toHaveClass('border-t');
    });

    it('accepts custom className', () => {
      render(<PageFooter className="custom-footer">Footer</PageFooter>);
      expect(screen.getByRole('contentinfo')).toHaveClass('custom-footer');
    });
  });

  describe('MaxWidth Variants', () => {
    it('applies sm maxWidth', () => {
      const { container } = render(<PageLayout maxWidth="sm">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('max-w-screen-sm');
    });

    it('applies md maxWidth', () => {
      const { container } = render(<PageLayout maxWidth="md">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('max-w-screen-md');
    });

    it('applies lg maxWidth', () => {
      const { container } = render(<PageLayout maxWidth="lg">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('max-w-screen-lg');
    });

    it('applies no maxWidth by default (layout.js handles it)', () => {
      const { container } = render(<PageLayout>Content</PageLayout>);
      // Default is 'none' - no max-width constraint since layout.js handles max-w-7xl
      expect(container.firstChild).not.toHaveClass('max-w-screen-xl');
      expect(container.firstChild).not.toHaveClass('max-w-screen-lg');
    });

    it('applies 2xl maxWidth', () => {
      const { container } = render(<PageLayout maxWidth="2xl">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('max-w-screen-2xl');
    });

    it('applies full maxWidth', () => {
      const { container } = render(<PageLayout maxWidth="full">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('max-w-full');
    });
  });

  describe('Padding Variants', () => {
    it('applies none padding', () => {
      const { container } = render(<PageLayout padding="none">Content</PageLayout>);
      expect(container.firstChild).not.toHaveClass('px-4');
    });

    it('applies sm padding', () => {
      const { container } = render(<PageLayout padding="sm">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('px-4');
    });

    it('applies no padding by default (layout.js handles it)', () => {
      const { container } = render(<PageLayout>Content</PageLayout>);
      // Default is 'none' - no padding since layout.js main already provides px-4 sm:px-6 lg:px-8
      expect(container.firstChild).not.toHaveClass('px-4');
    });

    it('applies lg padding', () => {
      const { container } = render(<PageLayout padding="lg">Content</PageLayout>);
      expect(container.firstChild).toHaveClass('px-4');
    });
  });

  describe('Centering', () => {
    it('centers content by default', () => {
      const { container } = render(<PageLayout>Content</PageLayout>);
      expect(container.firstChild).toHaveClass('mx-auto');
    });

    it('does not center when centered=false', () => {
      const { container } = render(<PageLayout centered={false}>Content</PageLayout>);
      expect(container.firstChild).not.toHaveClass('mx-auto');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with basic layout', async () => {
      const { container } = render(<PageLayout>Content</PageLayout>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with all slots', async () => {
      const { container } = render(
        <PageLayout
          header={<PageLayout.Header title="Dashboard" description="Overview" />}
          footer={<PageLayout.Footer>Copyright 2024</PageLayout.Footer>}
        >
          Main content here
        </PageLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper landmark structure', () => {
      render(
        <PageLayout
          header={<PageLayout.Header title="Test" />}
          footer={<PageLayout.Footer>Footer</PageLayout.Footer>}
        >
          Content
        </PageLayout>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('has heading hierarchy', () => {
      render(
        <PageLayout
          header={<PageLayout.Header title="Page Title" />}
        >
          Content
        </PageLayout>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Page Title');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className on PageLayout', () => {
      const { container } = render(
        <PageLayout className="custom-layout">Content</PageLayout>
      );
      expect(container.firstChild).toHaveClass('custom-layout');
    });

    it('passes additional props to root element', () => {
      const { container } = render(
        <PageLayout data-testid="page-layout">Content</PageLayout>
      );
      expect(container.querySelector('[data-testid="page-layout"]')).toBeInTheDocument();
    });

    it('merges className with variants', () => {
      const { container } = render(
        <PageLayout maxWidth="lg" className="extra-class">Content</PageLayout>
      );
      const root = container.firstChild;
      expect(root).toHaveClass('max-w-screen-lg', 'extra-class');
    });
  });

  describe('Namespace Pattern', () => {
    it('exposes Header as PageLayout.Header', () => {
      expect(PageLayout.Header).toBeDefined();
      expect(PageLayout.Header).toBe(PageHeader);
    });

    it('exposes Content as PageLayout.Content', () => {
      expect(PageLayout.Content).toBeDefined();
      expect(PageLayout.Content).toBe(PageContent);
    });

    it('exposes Footer as PageLayout.Footer', () => {
      expect(PageLayout.Footer).toBeDefined();
      expect(PageLayout.Footer).toBe(PageFooter);
    });
  });
});
