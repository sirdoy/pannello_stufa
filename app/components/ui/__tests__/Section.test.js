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

expect.extend(toHaveNoViolations);

describe('Section', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Section>Test content</Section>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Section title="My Section">Content</Section>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Section');
    });

    it('renders description when provided', () => {
      render(<Section description="Section description">Content</Section>);
      expect(screen.getByText('Section description')).toBeInTheDocument();
    });

    it('renders action element when provided', () => {
      render(
        <Section title="Title" action={<button>Action</button>}>
          Content
        </Section>
      );
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Subtitle', () => {
    it('renders subtitle with default value when title is provided', () => {
      render(<Section title="Title">Content</Section>);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders custom subtitle when provided', () => {
      render(<Section title="Title" subtitle="Custom Category">Content</Section>);
      expect(screen.getByText('Custom Category')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('does not render subtitle without title', () => {
      render(<Section subtitle="Custom Category">Content</Section>);
      expect(screen.queryByText('Custom Category')).not.toBeInTheDocument();
    });
  });

  describe('Ember Accent', () => {
    it('renders ember accent bar when title is provided', () => {
      const { container } = render(<Section title="Title">Content</Section>);
      const accentBar = container.querySelector('.from-ember-500');
      expect(accentBar).toBeInTheDocument();
      expect(accentBar).toHaveClass('to-flame-600');
    });

    it('accent bar has aria-hidden', () => {
      const { container } = render(<Section title="Title">Content</Section>);
      const accentBar = container.querySelector('.from-ember-500');
      expect(accentBar).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not render ember accent bar without title', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.querySelector('.from-ember-500')).not.toBeInTheDocument();
    });
  });

  describe('Spacing Variants', () => {
    it('applies sm spacing variant', () => {
      const { container } = render(<Section spacing="sm">Content</Section>);
      expect(container.firstChild).toHaveClass('py-4');
    });

    it('applies md spacing variant (default)', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.firstChild).toHaveClass('py-6');
    });

    it('applies lg spacing variant', () => {
      const { container } = render(<Section spacing="lg">Content</Section>);
      expect(container.firstChild).toHaveClass('py-8');
    });

    it('applies none spacing variant', () => {
      const { container } = render(<Section spacing="none">Content</Section>);
      expect(container.firstChild).not.toHaveClass('py-4');
      expect(container.firstChild).not.toHaveClass('py-6');
      expect(container.firstChild).not.toHaveClass('py-8');
    });

    it('header spacing scales with section spacing (sm)', () => {
      const { container } = render(<Section spacing="sm" title="Title">Content</Section>);
      const header = container.querySelector('.mb-3');
      expect(header).toBeInTheDocument();
    });

    it('header spacing scales with section spacing (lg)', () => {
      const { container } = render(<Section spacing="lg" title="Title">Content</Section>);
      const header = container.querySelector('.mb-6');
      expect(header).toBeInTheDocument();
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
      const { container } = render(<Section spacing="sm" className="mt-4">Content</Section>);
      expect(container.firstChild).toHaveClass('py-4');
      expect(container.firstChild).toHaveClass('mt-4');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with minimal props', async () => {
      const { container } = render(<Section>Content</Section>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with full props', async () => {
      const { container } = render(
        <Section
          title="My Section"
          subtitle="Category"
          description="This is a description"
          action={<button>Action</button>}
          spacing="lg"
        >
          Content
        </Section>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
