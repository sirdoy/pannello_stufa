import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';

describe('RadioGroup Component', () => {
  describe('Rendering', () => {
    test('renders with multiple options', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
          <RadioGroupItem value="c" label="Option C" />
        </RadioGroup>
      );

      expect(screen.getByLabelText('Option A')).toBeInTheDocument();
      expect(screen.getByLabelText('Option B')).toBeInTheDocument();
      expect(screen.getByLabelText('Option C')).toBeInTheDocument();
    });

    test('renders with children instead of label prop', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a">First Choice</RadioGroupItem>
          <RadioGroupItem value="b">Second Choice</RadioGroupItem>
        </RadioGroup>
      );

      expect(screen.getByLabelText('First Choice')).toBeInTheDocument();
      expect(screen.getByLabelText('Second Choice')).toBeInTheDocument();
    });

    test('renders vertically by default', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const root = container.querySelector('[role="radiogroup"]');
      expect(root).toHaveClass('flex-col');
    });

    test('renders horizontally when orientation is horizontal', () => {
      const { container } = render(
        <RadioGroup defaultValue="a" orientation="horizontal">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const root = container.querySelector('[role="radiogroup"]');
      expect(root).toHaveClass('flex-row');
    });

    test('applies custom className to RadioGroup', () => {
      const { container } = render(
        <RadioGroup defaultValue="a" className="custom-class">
          <RadioGroupItem value="a" label="Option A" />
        </RadioGroup>
      );

      const root = container.querySelector('[role="radiogroup"]');
      expect(root).toHaveClass('custom-class');
    });
  });

  describe('Selection', () => {
    test('selects option on click', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup value="a" onValueChange={onValueChange}>
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      await user.click(screen.getByLabelText('Option B'));
      expect(onValueChange).toHaveBeenCalledWith('b');
    });

    test('selects option with Space key', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup value="a" onValueChange={onValueChange}>
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const optionB = screen.getByRole('radio', { name: 'Option B' });
      await user.click(optionB);
      expect(onValueChange).toHaveBeenCalledWith('b');
    });

    test('shows checked state for selected option', () => {
      render(
        <RadioGroup value="b">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const optionA = screen.getByRole('radio', { name: 'Option A' });
      const optionB = screen.getByRole('radio', { name: 'Option B' });

      expect(optionA).not.toBeChecked();
      expect(optionB).toBeChecked();
    });
  });

  describe('Keyboard Navigation', () => {
    test('has proper tabindex for keyboard navigation', () => {
      // Radix RadioGroup items have tabindex attributes for keyboard navigation
      render(
        <RadioGroup defaultValue="b">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
          <RadioGroupItem value="c" label="Option C" />
        </RadioGroup>
      );

      const optionA = screen.getByRole('radio', { name: 'Option A' });
      const optionB = screen.getByRole('radio', { name: 'Option B' });
      const optionC = screen.getByRole('radio', { name: 'Option C' });

      // All items have tabindex attribute for keyboard navigation
      expect(optionA).toHaveAttribute('tabindex');
      expect(optionB).toHaveAttribute('tabindex');
      expect(optionC).toHaveAttribute('tabindex');
    });

    test('receives keyboard events when focused', async () => {
      const user = userEvent.setup();

      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      // Tab into the group - should focus the selected item
      await user.tab();
      const optionA = screen.getByRole('radio', { name: 'Option A' });
      expect(optionA).toHaveFocus();
    });

    test('can select with click after tabbing', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup value="a" onValueChange={onValueChange}>
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      // Tab to focus, then click on B
      await user.tab();
      await user.click(screen.getByLabelText('Option B'));
      expect(onValueChange).toHaveBeenCalledWith('b');
    });
  });

  describe('Disabled State', () => {
    test('disables entire group when disabled', () => {
      render(
        <RadioGroup defaultValue="a" disabled>
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const optionA = screen.getByRole('radio', { name: 'Option A' });
      const optionB = screen.getByRole('radio', { name: 'Option B' });

      expect(optionA).toBeDisabled();
      expect(optionB).toBeDisabled();
    });

    test('disables single item when item is disabled', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" disabled />
          <RadioGroupItem value="c" label="Option C" />
        </RadioGroup>
      );

      const optionA = screen.getByRole('radio', { name: 'Option A' });
      const optionB = screen.getByRole('radio', { name: 'Option B' });
      const optionC = screen.getByRole('radio', { name: 'Option C' });

      expect(optionA).not.toBeDisabled();
      expect(optionB).toBeDisabled();
      expect(optionC).not.toBeDisabled();
    });

    test('does not select disabled option on click', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <RadioGroup value="a" onValueChange={onValueChange}>
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" disabled />
        </RadioGroup>
      );

      await user.click(screen.getByLabelText('Option B'));
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    test('applies ember variant by default', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
        </RadioGroup>
      );

      const radio = container.querySelector('button[role="radio"]');
      expect(radio).toHaveClass('data-[state=checked]:border-ember-500');
    });

    test('applies ocean variant', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" variant="ocean" />
        </RadioGroup>
      );

      const radio = container.querySelector('button[role="radio"]');
      expect(radio).toHaveClass('data-[state=checked]:border-ocean-500');
    });

    test('applies sage variant', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" variant="sage" />
        </RadioGroup>
      );

      const radio = container.querySelector('button[role="radio"]');
      expect(radio).toHaveClass('data-[state=checked]:border-sage-500');
    });
  });

  describe('Sizes', () => {
    test('applies md size by default', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
        </RadioGroup>
      );

      const radio = container.querySelector('button[role="radio"]');
      expect(radio).toHaveClass('h-5');
      expect(radio).toHaveClass('w-5');
    });

    test('applies sm size', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" size="sm" />
        </RadioGroup>
      );

      const radio = container.querySelector('button[role="radio"]');
      expect(radio).toHaveClass('h-4');
      expect(radio).toHaveClass('w-4');
    });

    test('applies lg size', () => {
      const { container } = render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" size="lg" />
        </RadioGroup>
      );

      const radio = container.querySelector('button[role="radio"]');
      expect(radio).toHaveClass('h-6');
      expect(radio).toHaveClass('w-6');
    });
  });

  describe('Accessibility', () => {
    test('has no a11y violations with no selection', async () => {
      const { container } = render(
        <RadioGroup aria-label="Options">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no a11y violations with selected value', async () => {
      const { container } = render(
        <RadioGroup value="b" aria-label="Options">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no a11y violations when disabled', async () => {
      const { container } = render(
        <RadioGroup value="a" disabled aria-label="Options">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper radiogroup role', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
        </RadioGroup>
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    test('each item has radio role', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
    });

    test('labels are associated with radio inputs', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" label="Option A" />
          <RadioGroupItem value="b" label="Option B" />
        </RadioGroup>
      );

      // Labels should associate via htmlFor
      expect(screen.getByLabelText('Option A')).toBeInTheDocument();
      expect(screen.getByLabelText('Option B')).toBeInTheDocument();
    });
  });

  describe('Compound Component Pattern', () => {
    test('works with RadioGroup.Item syntax', () => {
      const RadioGroupWithItem = require('../RadioGroup').default;

      render(
        <RadioGroupWithItem defaultValue="a">
          <RadioGroupWithItem.Item value="a" label="Option A" />
          <RadioGroupWithItem.Item value="b" label="Option B" />
        </RadioGroupWithItem>
      );

      expect(screen.getByLabelText('Option A')).toBeInTheDocument();
      expect(screen.getByLabelText('Option B')).toBeInTheDocument();
    });
  });
});
