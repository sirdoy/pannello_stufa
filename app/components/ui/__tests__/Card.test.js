import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    test('renders children correctly', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('applies base classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-300');
    });

    test('applies standard styling by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-soft');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-slate-200/50');
    });
  });

  describe('Glass Effect', () => {
    test('applies glass effect when glass prop is true', () => {
      const { container } = render(<Card glass>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white/70');
      expect(card).toHaveClass('backdrop-blur-xl');
      expect(card).toHaveClass('shadow-glass-lg');
      expect(card).toHaveClass('border-white/40');
    });

    test('does not apply glass effect by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveClass('backdrop-blur-xl');
      expect(card).not.toHaveClass('bg-white/70');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className', () => {
      const { container } = render(
        <Card className="p-6 custom-class">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('p-6');
      expect(card).toHaveClass('custom-class');
    });

    test('custom className does not override base classes', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Props Forwarding', () => {
    test('forwards additional props to div element', () => {
      const { container } = render(
        <Card data-testid="test-card" aria-label="Card label">
          Content
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('data-testid', 'test-card');
      expect(card).toHaveAttribute('aria-label', 'Card label');
    });

    test('handles onClick event', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Card onClick={handleClick}>Content</Card>
      );
      const card = container.firstChild;
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Rendering', () => {
    test('renders multiple children', () => {
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

    test('renders complex JSX children', () => {
      render(
        <Card>
          <div>
            <span>Nested</span>
            <strong>Content</strong>
          </div>
        </Card>
      );
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
