// app/components/ui/__tests__/Section.test.js
/**
 * Section Component Tests
 *
 * Tests spacing variants, subtitle rendering, ember accent, and accessibility.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Section, { sectionVariants } from '../Section';
import Button from '../Button';

expect.extend(toHaveNoViolations);

describe('Section', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <Section>
          <div>Content</div>
        </Section>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders title and description', () => {
      render(
        <Section title="Section Title" description="Section description">
          <div>Content</div>
        </Section>
      );
      expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument();
      expect(screen.getByText('Section description')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(
        <Section subtitle="Category" title="Title">
          <div>Content</div>
        </Section>
      );
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('renders action', () => {
      render(
        <Section title="Title" action={<Button>Action</Button>}>
          <div>Content</div>
        </Section>
      );
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Spacing Variants', () => {
    it('applies spacing variants', () => {
      const { container, rerender } = render(
        <Section spacing="sm">
          <div>Content</div>
        </Section>
      );
      expect(container.firstChild).toHaveClass('py-4');

      rerender(
        <Section spacing="lg">
          <div>Content</div>
        </Section>
      );
      expect(container.firstChild).toHaveClass('py-8');
    });

    it('applies md spacing variant (default)', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.firstChild).toHaveClass('py-6');
    });

    it('applies none spacing variant', () => {
      const { container } = render(<Section spacing="none">Content</Section>);
      expect(container.firstChild).not.toHaveClass('py-4');
      expect(container.firstChild).not.toHaveClass('py-6');
      expect(container.firstChild).not.toHaveClass('py-8');
    });

    it('header spacing scales with section spacing (sm)', () => {
      const { container } = render(
        <Section spacing="sm" title="Title">
          Content
        </Section>
      );
      const header = container.querySelector('.mb-3');
      expect(header).toBeInTheDocument();
    });

    it('header spacing scales with section spacing (lg)', () => {
      const { container } = render(
        <Section spacing="lg" title="Title">
          Content
        </Section>
      );
      const header = container.querySelector('.mb-6');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Polymorphic Rendering', () => {
    it('renders as section by default', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders as different element', () => {
      render(
        <Section as="div" data-testid="section">
          <div>Content</div>
        </Section>
      );
      expect(screen.getByTestId('section').tagName).toBe('DIV');
    });

    it('renders as article', () => {
      render(
        <Section as="article" data-testid="section">
          <div>Content</div>
        </Section>
      );
      expect(screen.getByTestId('section').tagName).toBe('ARTICLE');
    });
  });

  describe('Ember Accent', () => {
    it('renders ember accent bar', () => {
      const { container } = render(
        <Section title="Title">
          <div>Content</div>
        </Section>
      );
      expect(container.querySelector('.from-ember-500')).toBeInTheDocument();
    });

    it('does not render header when no title/description/action', () => {
      const { container } = render(
        <Section>
          <div>Content only</div>
        </Section>
      );
      // No header elements
      expect(container.querySelector('.from-ember-500')).not.toBeInTheDocument();
    });
  });

  describe('Subtitle', () => {
    it('does not render subtitle when not provided', () => {
      render(<Section title="Title">Content</Section>);
      // Only the heading should render, no subtitle text
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Title');
    });

    it('renders subtitle when provided with title', () => {
      render(
        <Section title="Title" subtitle="Custom Category">
          Content
        </Section>
      );
      expect(screen.getByText('Custom Category')).toBeInTheDocument();
    });
  });

  describe('CVA Export', () => {
    it('exports sectionVariants function', () => {
      expect(typeof sectionVariants).toBe('function');
    });

    it('sectionVariants returns correct classes for sm', () => {
      const classes = sectionVariants({ spacing: 'sm' });
      expect(classes).toContain('py-4');
    });

    it('sectionVariants returns correct classes for md', () => {
      const classes = sectionVariants({ spacing: 'md' });
      expect(classes).toContain('py-6');
    });

    it('sectionVariants returns correct classes for lg', () => {
      const classes = sectionVariants({ spacing: 'lg' });
      expect(classes).toContain('py-8');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(<Section className="custom-class">Content</Section>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('className merges with spacing classes', () => {
      const { container } = render(
        <Section spacing="sm" className="mt-4">
          Content
        </Section>
      );
      expect(container.firstChild).toHaveClass('py-4');
      expect(container.firstChild).toHaveClass('mt-4');
    });
  });

  describe('Heading Level', () => {
    it('renders h2 by default', () => {
      render(<Section title="Title">Content</Section>);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('renders h1 when level={1}', () => {
      render(<Section title="Main Title" level={1}>Content</Section>);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('uses 3xl size for h1', () => {
      render(<Section title="Main Title" level={1}>Content</Section>);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-3xl');
    });

    it('uses 2xl size for h2 (default)', () => {
      render(<Section title="Section Title">Content</Section>);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-2xl');
    });

    it('renders custom heading level (h3)', () => {
      render(<Section title="Sub Title" level={3}>Content</Section>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Section title="Accessible Section" description="Description">
          <div>Content</div>
        </Section>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with full props', async () => {
      const { container } = render(
        <Section
          title="My Section"
          subtitle="Category"
          description="This is a description"
          action={<Button>Action</Button>}
          spacing="lg"
        >
          Content
        </Section>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with h1 level', async () => {
      const { container } = render(
        <Section title="Page Title" level={1}>
          Content
        </Section>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
