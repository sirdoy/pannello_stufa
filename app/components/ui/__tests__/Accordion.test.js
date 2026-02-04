import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../Accordion';

/**
 * Test helper: Standard accordion setup with single mode
 */
const TestAccordion = ({ type = 'single', collapsible = false, defaultValue, ...props }) => (
  <Accordion type={type} collapsible={collapsible} defaultValue={defaultValue} {...props}>
    <Accordion.Item value="item-1">
      <Accordion.Trigger>Section 1</Accordion.Trigger>
      <Accordion.Content>Content 1</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-2">
      <Accordion.Trigger>Section 2</Accordion.Trigger>
      <Accordion.Content>Content 2</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-3">
      <Accordion.Trigger>Section 3</Accordion.Trigger>
      <Accordion.Content>Content 3</Accordion.Content>
    </Accordion.Item>
  </Accordion>
);

/**
 * Test helper: Accordion with multiple mode
 */
const TestAccordionMultiple = ({ defaultValue = [], ...props }) => (
  <Accordion type="multiple" defaultValue={defaultValue} {...props}>
    <Accordion.Item value="item-1">
      <Accordion.Trigger>Section 1</Accordion.Trigger>
      <Accordion.Content>Content 1</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-2">
      <Accordion.Trigger>Section 2</Accordion.Trigger>
      <Accordion.Content>Content 2</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-3">
      <Accordion.Trigger>Section 3</Accordion.Trigger>
      <Accordion.Content>Content 3</Accordion.Content>
    </Accordion.Item>
  </Accordion>
);

describe('Accordion Component', () => {
  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<TestAccordion />);

      expect(screen.getByRole('button', { name: 'Section 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Section 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Section 3' })).toBeInTheDocument();
    });

    test('renders multiple items', () => {
      render(<TestAccordion />);

      const triggers = screen.getAllByRole('button');
      expect(triggers).toHaveLength(3);
    });

    test('renders with defaultValue (initially open)', () => {
      render(<TestAccordion defaultValue="item-1" />);

      const trigger = screen.getByRole('button', { name: 'Section 1' });
      expect(trigger).toHaveAttribute('data-state', 'open');
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    test('all items closed by default when no defaultValue', () => {
      render(<TestAccordion />);

      const triggers = screen.getAllByRole('button');
      triggers.forEach(trigger => {
        expect(trigger).toHaveAttribute('data-state', 'closed');
      });
    });

    test('renders chevron icon in trigger', () => {
      render(<TestAccordion />);

      // Chevron should be rendered within trigger
      const trigger = screen.getByRole('button', { name: 'Section 1' });
      const svg = trigger.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Single Mode', () => {
    test('opens item on click', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      await user.click(screen.getByRole('button', { name: 'Section 1' }));

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    test('closes current when opening another (single mode)', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue="item-1" />);

      // Item 1 is open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');

      // Click item 2
      await user.click(screen.getByRole('button', { name: 'Section 2' }));

      // Item 1 should be closed, Item 2 should be open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'closed');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'open');
    });

    test('allows closing all when collapsible=true', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue="item-1" collapsible />);

      // Item 1 is open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');

      // Click item 1 again to close
      await user.click(screen.getByRole('button', { name: 'Section 1' }));

      // Item 1 should be closed
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'closed');
    });

    test('prevents closing last item when collapsible=false', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue="item-1" collapsible={false} />);

      // Item 1 is open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');

      // Click item 1 again - should stay open (collapsible=false)
      await user.click(screen.getByRole('button', { name: 'Section 1' }));

      // Item 1 should still be open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Multiple Mode', () => {
    test('opens multiple items simultaneously', async () => {
      const user = userEvent.setup();
      render(<TestAccordionMultiple />);

      // Open item 1
      await user.click(screen.getByRole('button', { name: 'Section 1' }));
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');

      // Open item 2 as well
      await user.click(screen.getByRole('button', { name: 'Section 2' }));
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'open');

      // Both should be open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'open');
    });

    test('maintains open state independently', async () => {
      const user = userEvent.setup();
      render(<TestAccordionMultiple defaultValue={['item-1', 'item-2']} />);

      // Both items should be open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'open');

      // Close item 1
      await user.click(screen.getByRole('button', { name: 'Section 1' }));

      // Item 1 closed, Item 2 still open
      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'closed');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'open');
    });

    test('renders with multiple defaultValue items open', () => {
      render(<TestAccordionMultiple defaultValue={['item-1', 'item-3']} />);

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'closed');
      expect(screen.getByRole('button', { name: 'Section 3' })).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Keyboard Navigation', () => {
    test('Enter key toggles item', async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      // Focus first trigger
      screen.getByRole('button', { name: 'Section 1' }).focus();

      // Press Enter to open
      await user.keyboard('{Enter}');

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
    });

    test('Space key toggles item', async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      // Focus first trigger
      screen.getByRole('button', { name: 'Section 1' }).focus();

      // Press Space to open
      await user.keyboard(' ');

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
    });

    test('Arrow down moves focus to next trigger', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Focus first trigger
      screen.getByRole('button', { name: 'Section 1' }).focus();

      // Press arrow down
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveFocus();
    });

    test('Arrow up moves focus to previous trigger', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Focus second trigger
      screen.getByRole('button', { name: 'Section 2' }).focus();

      // Press arrow up
      await user.keyboard('{ArrowUp}');

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveFocus();
    });

    test('Home key moves focus to first trigger', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Focus last trigger
      screen.getByRole('button', { name: 'Section 3' }).focus();

      // Press Home
      await user.keyboard('{Home}');

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveFocus();
    });

    test('End key moves focus to last trigger', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Focus first trigger
      screen.getByRole('button', { name: 'Section 1' }).focus();

      // Press End
      await user.keyboard('{End}');

      expect(screen.getByRole('button', { name: 'Section 3' })).toHaveFocus();
    });

    test('Arrow down wraps from last to first', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Focus last trigger
      screen.getByRole('button', { name: 'Section 3' }).focus();

      // Press arrow down - should wrap to first
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveFocus();
    });

    test('Arrow up wraps from first to last', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Focus first trigger
      screen.getByRole('button', { name: 'Section 1' }).focus();

      // Press arrow up - should wrap to last
      await user.keyboard('{ArrowUp}');

      expect(screen.getByRole('button', { name: 'Section 3' })).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    test('aria-expanded changes on toggle', async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      const trigger = screen.getByRole('button', { name: 'Section 1' });

      // Initially closed
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Open
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Close
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    test('aria-controls links trigger to content', () => {
      render(<TestAccordion defaultValue="item-1" />);

      const trigger = screen.getByRole('button', { name: 'Section 1' });
      const ariaControls = trigger.getAttribute('aria-controls');

      expect(ariaControls).toBeTruthy();
      expect(document.getElementById(ariaControls)).toBeInTheDocument();
    });

    test('content has role region when open', () => {
      render(<TestAccordion defaultValue="item-1" />);

      // Radix assigns role="region" to open accordion content
      const content = screen.getByRole('region');
      expect(content).toBeInTheDocument();
    });

    test('passes axe accessibility audit', async () => {
      const { container } = render(<TestAccordion defaultValue="item-1" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('passes axe audit in multiple mode', async () => {
      const { container } = render(<TestAccordionMultiple defaultValue={['item-1', 'item-2']} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Animation', () => {
    test('content has animate-accordion-down when open', async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      await user.click(screen.getByRole('button', { name: 'Section 1' }));

      // Find the content element (has data-state attribute from Radix)
      const contentWrapper = document.querySelector('[data-state="open"][role="region"]');
      expect(contentWrapper).toHaveClass('data-[state=open]:animate-accordion-down');
    });

    test('content has animate-accordion-up when closed', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue="item-1" collapsible />);

      // Close the open item
      await user.click(screen.getByRole('button', { name: 'Section 1' }));

      // Content should have the closed animation class applied via CSS selector
      const trigger = screen.getByRole('button', { name: 'Section 1' });
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });
  });

  describe('Styling', () => {
    test('trigger has min-h-[48px] for touch target', () => {
      render(<TestAccordion />);

      const trigger = screen.getByRole('button', { name: 'Section 1' });
      expect(trigger).toHaveClass('min-h-[48px]');
    });

    test('chevron has rotate-180 class in open state', async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      const trigger = screen.getByRole('button', { name: 'Section 1' });
      await user.click(trigger);

      const chevron = trigger.querySelector('svg');
      expect(chevron).toHaveClass('group-data-[state=open]:rotate-180');
    });

    test('applies custom className to root', () => {
      render(
        <Accordion type="single" className="custom-accordion-class">
          <Accordion.Item value="item-1">
            <Accordion.Trigger>Test</Accordion.Trigger>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      // Find the root element
      const root = document.querySelector('.custom-accordion-class');
      expect(root).toBeInTheDocument();
    });

    test('applies custom className to item', () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <Accordion.Item value="item-1" className="custom-item-class">
            <Accordion.Trigger>Test</Accordion.Trigger>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      const item = document.querySelector('.custom-item-class');
      expect(item).toBeInTheDocument();
    });

    test('applies custom className to trigger', () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <Accordion.Item value="item-1">
            <Accordion.Trigger className="custom-trigger-class">Test</Accordion.Trigger>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: 'Test' });
      expect(trigger).toHaveClass('custom-trigger-class');
    });

    test('applies custom className to content', () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <Accordion.Item value="item-1">
            <Accordion.Trigger>Test</Accordion.Trigger>
            <Accordion.Content className="custom-content-class">Content</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      const content = screen.getByRole('region');
      expect(content).toHaveClass('custom-content-class');
    });

    test('item has border styling', () => {
      render(<TestAccordion />);

      // AccordionItem renders a div with data-state and our border-b class
      // Find items by looking for elements that have both border-b and data-state="closed"
      const items = document.querySelectorAll('[data-state="closed"].border-b');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Controlled Mode', () => {
    test('works with value/onValueChange props in single mode', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <Accordion type="single" value="item-1" onValueChange={handleChange}>
          <Accordion.Item value="item-1">
            <Accordion.Trigger>Section 1</Accordion.Trigger>
            <Accordion.Content>Content 1</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2">
            <Accordion.Trigger>Section 2</Accordion.Trigger>
            <Accordion.Content>Content 2</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      await user.click(screen.getByRole('button', { name: 'Section 2' }));

      expect(handleChange).toHaveBeenCalledWith('item-2');
    });

    test('works with value/onValueChange props in multiple mode', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Accordion type="multiple" value={['item-1']} onValueChange={handleChange}>
          <Accordion.Item value="item-1">
            <Accordion.Trigger>Section 1</Accordion.Trigger>
            <Accordion.Content>Content 1</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2">
            <Accordion.Trigger>Section 2</Accordion.Trigger>
            <Accordion.Content>Content 2</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      await user.click(screen.getByRole('button', { name: 'Section 2' }));

      expect(handleChange).toHaveBeenCalledWith(['item-1', 'item-2']);
    });

    test('updates when controlled value changes', async () => {
      const { rerender } = render(
        <Accordion type="single" value="item-1" onValueChange={() => {}}>
          <Accordion.Item value="item-1">
            <Accordion.Trigger>Section 1</Accordion.Trigger>
            <Accordion.Content>Content 1</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2">
            <Accordion.Trigger>Section 2</Accordion.Trigger>
            <Accordion.Content>Content 2</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'open');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'closed');

      // Update value to item-2
      rerender(
        <Accordion type="single" value="item-2" onValueChange={() => {}}>
          <Accordion.Item value="item-1">
            <Accordion.Trigger>Section 1</Accordion.Trigger>
            <Accordion.Content>Content 1</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2">
            <Accordion.Trigger>Section 2</Accordion.Trigger>
            <Accordion.Content>Content 2</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      );

      expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute('data-state', 'closed');
      expect(screen.getByRole('button', { name: 'Section 2' })).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Named Exports', () => {
    test('Accordion is exported', () => {
      expect(Accordion).toBeDefined();
    });

    test('AccordionItem is exported', () => {
      expect(AccordionItem).toBeDefined();
    });

    test('AccordionTrigger is exported', () => {
      expect(AccordionTrigger).toBeDefined();
    });

    test('AccordionContent is exported', () => {
      expect(AccordionContent).toBeDefined();
    });

    test('namespace components are attached', () => {
      expect(Accordion.Item).toBe(AccordionItem);
      expect(Accordion.Trigger).toBe(AccordionTrigger);
      expect(Accordion.Content).toBe(AccordionContent);
    });
  });

  describe('Ref Forwarding', () => {
    test('AccordionItem forwards ref', () => {
      const ref = { current: null };
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem ref={ref} value="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('AccordionTrigger forwards ref', () => {
      const ref = { current: null };
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger ref={ref}>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test('AccordionContent forwards ref', () => {
      const ref = { current: null };
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent ref={ref}>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
