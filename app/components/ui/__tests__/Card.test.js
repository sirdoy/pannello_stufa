// app/components/ui/__tests__/Card.test.js
/**
 * Card Component Tests
 *
 * Tests accessibility, CVA variants, compound components, and namespace pattern.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDivider,
  cardVariants,
} from '../Card';

expect.extend(toHaveNoViolations);

describe('Card', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations with default variant', async () => {
      const { container } = render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with elevated variant', async () => {
      const { container } = render(
        <Card variant="elevated">
          <p>Elevated content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with subtle variant', async () => {
      const { container } = render(
        <Card variant="subtle">
          <p>Subtle content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with outlined variant', async () => {
      const { container } = render(
        <Card variant="outlined">
          <p>Outlined content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with glass variant', async () => {
      const { container } = render(
        <Card variant="glass">
          <p>Glass content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with hover enabled', async () => {
      const { container } = render(
        <Card hover>
          <p>Hoverable content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with glow enabled', async () => {
      const { container } = render(
        <Card glow>
          <p>Glowing content</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with all sub-components', async () => {
      const { container } = render(
        <Card>
          <Card.Header>
            <Card.Title icon="🔥">Title</Card.Title>
          </Card.Header>
          <Card.Content>
            <p>Content here</p>
          </Card.Content>
          <Card.Divider />
          <Card.Footer>
            <button>Action</button>
          </Card.Footer>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CVA Variants', () => {
    it('applies default variant classes correctly', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('relative');
      expect(card).toHaveClass('overflow-hidden');
      expect(card).toHaveClass('bg-slate-900/80');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-card');
    });

    it('applies elevated variant classes', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-slate-850/90');
      expect(card).toHaveClass('shadow-card-elevated');
    });

    it('applies subtle variant classes', () => {
      const { container } = render(<Card variant="subtle">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white/[0.03]');
      expect(card).not.toHaveClass('shadow-card');
    });

    it('applies outlined variant classes', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-transparent');
      expect(card).toHaveClass('border-white/[0.12]');
    });

    it('applies glass variant classes', () => {
      const { container } = render(<Card variant="glass">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-slate-900/70');
      expect(card).toHaveClass('backdrop-blur-2xl');
      expect(card).toHaveClass('backdrop-saturate-150');
    });

    it('applies hover classes when hover=true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-card-hover');
      expect(card).toHaveClass('hover:-translate-y-0.5');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('does not apply hover classes when hover=false', () => {
      const { container } = render(<Card hover={false}>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('applies glow classes when glow=true', () => {
      const { container } = render(<Card glow>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('shadow-ember-glow');
      expect(card).toHaveClass('border-ember-500/20');
    });

    it('applies padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-5');
      expect(card).toHaveClass('sm:p-6');
    });

    it('removes padding when padding=false', () => {
      const { container } = render(<Card padding={false}>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveClass('p-5');
      expect(card).not.toHaveClass('sm:p-6');
    });
  });

  describe('Compound Components', () => {
    it('CardHeader renders with flex layout', () => {
      const { container } = render(
        <CardHeader>Header content</CardHeader>
      );
      const header = container.firstChild;
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('justify-between');
      expect(header).toHaveClass('mb-4');
    });

    it('CardTitle renders with icon and heading', () => {
      render(
        <CardTitle icon="🔥">My Title</CardTitle>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('CardTitle renders without icon', () => {
      render(
        <CardTitle>No Icon Title</CardTitle>
      );
      expect(screen.getByText('No Icon Title')).toBeInTheDocument();
    });

    it('CardContent renders with spacing', () => {
      const { container } = render(
        <CardContent>
          <p>Item 1</p>
          <p>Item 2</p>
        </CardContent>
      );
      const content = container.firstChild;
      expect(content).toHaveClass('space-y-4');
    });

    it('CardFooter renders with border-t', () => {
      const { container } = render(
        <CardFooter>Footer content</CardFooter>
      );
      const footer = container.firstChild;
      expect(footer).toHaveClass('mt-5');
      expect(footer).toHaveClass('pt-4');
      expect(footer).toHaveClass('border-t');
    });

    it('CardDivider renders gradient line', () => {
      const { container } = render(<CardDivider />);
      const divider = container.firstChild;
      expect(divider).toHaveClass('h-px');
      expect(divider).toHaveClass('my-4');
      expect(divider).toHaveClass('bg-gradient-to-r');
      expect(divider).toHaveClass('from-transparent');
      expect(divider).toHaveClass('to-transparent');
    });
  });

  describe('Namespace Pattern', () => {
    it('components accessible via Card.Header', () => {
      expect(Card.Header).toBeDefined();
      expect(Card.Header).toBe(CardHeader);
    });

    it('components accessible via Card.Title', () => {
      expect(Card.Title).toBeDefined();
      expect(Card.Title).toBe(CardTitle);
    });

    it('components accessible via Card.Content', () => {
      expect(Card.Content).toBeDefined();
      expect(Card.Content).toBe(CardContent);
    });

    it('components accessible via Card.Footer', () => {
      expect(Card.Footer).toBeDefined();
      expect(Card.Footer).toBe(CardFooter);
    });

    it('components accessible via Card.Divider', () => {
      expect(Card.Divider).toBeDefined();
      expect(Card.Divider).toBe(CardDivider);
    });

    it('named exports work for tree-shaking', () => {
      // These are imported at top of file, just verify they're defined
      expect(CardHeader).toBeDefined();
      expect(CardTitle).toBeDefined();
      expect(CardContent).toBeDefined();
      expect(CardFooter).toBeDefined();
      expect(CardDivider).toBeDefined();
      expect(cardVariants).toBeDefined();
    });

    it('cardVariants is exported and returns string', () => {
      const classes = cardVariants({ variant: 'default' });
      expect(typeof classes).toBe('string');
      expect(classes).toContain('rounded-2xl');
    });
  });

  describe('forwardRef', () => {
    it('forwards ref to Card root element', () => {
      const ref = createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to CardHeader', () => {
      const ref = createRef();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to CardTitle', () => {
      const ref = createRef();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to CardContent', () => {
      const ref = createRef();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to CardFooter', () => {
      const ref = createRef();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to CardDivider', () => {
      const ref = createRef();
      render(<CardDivider ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Custom className', () => {
    it('merges custom className with Card', () => {
      const { container } = render(
        <Card className="my-custom-class">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('my-custom-class');
      expect(card).toHaveClass('rounded-2xl'); // base class preserved
    });

    it('merges custom className with CardHeader', () => {
      const { container } = render(
        <CardHeader className="my-header-class">Header</CardHeader>
      );
      expect(container.firstChild).toHaveClass('my-header-class');
      expect(container.firstChild).toHaveClass('flex');
    });

    it('merges custom className with CardTitle', () => {
      const { container } = render(
        <CardTitle className="my-title-class">Title</CardTitle>
      );
      expect(container.firstChild).toHaveClass('my-title-class');
      expect(container.firstChild).toHaveClass('items-center');
    });

    it('merges custom className with CardContent', () => {
      const { container } = render(
        <CardContent className="my-content-class">Content</CardContent>
      );
      expect(container.firstChild).toHaveClass('my-content-class');
      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('merges custom className with CardFooter', () => {
      const { container } = render(
        <CardFooter className="my-footer-class">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveClass('my-footer-class');
      expect(container.firstChild).toHaveClass('border-t');
    });

    it('merges custom className with CardDivider', () => {
      const { container } = render(
        <CardDivider className="my-divider-class" />
      );
      expect(container.firstChild).toHaveClass('my-divider-class');
      expect(container.firstChild).toHaveClass('h-px');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards additional props to Card', () => {
      const { container } = render(
        <Card data-testid="test-card" aria-label="Card label">
          Content
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('data-testid', 'test-card');
      expect(card).toHaveAttribute('aria-label', 'Card label');
    });

    it('handles onClick event on Card', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Card onClick={handleClick}>Content</Card>
      );
      container.firstChild.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('forwards props to sub-components', () => {
      render(
        <CardHeader data-testid="header">Header</CardHeader>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <Card>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('renders full composition with all sub-components', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title icon="🔥">Dashboard</Card.Title>
          </Card.Header>
          <Card.Content>
            <p>Welcome to your dashboard</p>
            <p>Here is some data</p>
          </Card.Content>
          <Card.Divider />
          <Card.Footer>
            <button>View More</button>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument();
      expect(screen.getByText('Here is some data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view more/i })).toBeInTheDocument();
    });
  });
});
