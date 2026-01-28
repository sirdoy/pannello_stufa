// app/components/ui/__tests__/accessibility.test.js
/**
 * Accessibility Test Suite
 *
 * This file demonstrates jest-axe usage patterns for the design system.
 * Each component should add its own a11y tests following these patterns.
 *
 * Note: jest-axe catches ~30% of a11y issues automatically.
 * Color contrast and some ARIA patterns require manual testing or Lighthouse.
 */
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import existing components to test
import Button, { IconButton } from '../Button';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Button', () => {
    it('should have no accessibility violations in default state', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations when loading', async () => {
      const { container } = render(<Button loading>Loading</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for ember variant', async () => {
      const { container } = render(<Button variant="ember">Primary</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for subtle variant', async () => {
      const { container } = render(<Button variant="subtle">Secondary</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for danger variant', async () => {
      const { container } = render(<Button variant="danger">Delete</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for ghost variant', async () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for outline variant', async () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with icon', async () => {
      const { container } = render(<Button icon="+" iconPosition="left">Add Item</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('IconButton', () => {
    it('should have no violations with proper aria-label', async () => {
      const { container } = render(<IconButton icon="X" label="Close" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for different variants', async () => {
      const { container } = render(
        <div>
          <IconButton icon="+" label="Add" variant="ember" />
          <IconButton icon="-" label="Remove" variant="danger" />
          <IconButton icon="?" label="Help" variant="subtle" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Template for new component a11y tests:
  // describe('ComponentName', () => {
  //   it('should have no accessibility violations', async () => {
  //     const { container } = render(<ComponentName>Content</ComponentName>);
  //     const results = await axe(container);
  //     expect(results).toHaveNoViolations();
  //   });
  // });
});
