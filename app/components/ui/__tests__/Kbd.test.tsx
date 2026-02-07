import { render, screen } from '@testing-library/react';
import Kbd from '../Kbd';

describe('Kbd', () => {
  describe('Rendering', () => {
    it('renders children text correctly', () => {
      render(<Kbd>Cmd+K</Kbd>);
      expect(screen.getByText('Cmd+K')).toBeInTheDocument();
    });

    it('renders as a kbd element', () => {
      render(<Kbd>Enter</Kbd>);
      const element = screen.getByText('Enter');
      expect(element.tagName).toBe('KBD');
    });

    it('renders special characters and symbols', () => {
      // Mac command symbol
      render(<Kbd>{'\u2318'}K</Kbd>);
      expect(screen.getByText('\u2318K')).toBeInTheDocument();
    });

    it('renders unicode symbols correctly', () => {
      // Shift symbol
      render(<Kbd>{'\u21E7'}Enter</Kbd>);
      expect(screen.getByText('\u21E7Enter')).toBeInTheDocument();
    });

    it('renders arrow key symbols', () => {
      render(<Kbd>{'\u2191'}</Kbd>); // Up arrow
      expect(screen.getByText('\u2191')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies base styling classes', () => {
      render(<Kbd>Escape</Kbd>);
      const element = screen.getByText('Escape');

      // Check for key styling classes
      expect(element.className).toContain('inline-flex');
      expect(element.className).toContain('items-center');
      expect(element.className).toContain('justify-center');
      expect(element.className).toContain('font-mono');
      expect(element.className).toContain('rounded-md');
      expect(element.className).toContain('shadow-sm');
    });

    it('applies padding classes', () => {
      render(<Kbd>Tab</Kbd>);
      const element = screen.getByText('Tab');

      expect(element.className).toContain('px-2');
      expect(element.className).toContain('py-1');
    });

    it('applies font styling', () => {
      render(<Kbd>F1</Kbd>);
      const element = screen.getByText('F1');

      expect(element.className).toContain('text-xs');
      expect(element.className).toContain('font-medium');
    });

    it('merges custom className', () => {
      render(<Kbd className="custom-class">Space</Kbd>);
      const element = screen.getByText('Space');

      expect(element.className).toContain('custom-class');
      // Should still have base classes
      expect(element.className).toContain('font-mono');
    });

    it('allows custom className to override defaults', () => {
      render(<Kbd className="text-ember-400">Delete</Kbd>);
      const element = screen.getByText('Delete');

      expect(element.className).toContain('text-ember-400');
    });
  });

  describe('Props passing', () => {
    it('passes additional props to kbd element', () => {
      render(<Kbd data-testid="kbd-element">Alt</Kbd>);
      expect(screen.getByTestId('kbd-element')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Kbd aria-label="Command key">Cmd</Kbd>);
      expect(screen.getByLabelText('Command key')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for standard shortcut', () => {
      const { container } = render(<Kbd>Cmd+K</Kbd>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for symbol shortcut', () => {
      const { container } = render(<Kbd>{'\u2318'}K</Kbd>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with custom class', () => {
      const { container } = render(<Kbd className="text-ember-400">Enter</Kbd>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
