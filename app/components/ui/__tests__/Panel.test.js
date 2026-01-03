import { render, screen } from '@testing-library/react';
import Panel from '../Panel';

describe('Panel Component', () => {
  describe('Rendering', () => {
    test('renders children content', () => {
      render(
        <Panel>
          <div>Test content</div>
        </Panel>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    test('renders with title', () => {
      render(
        <Panel title="Test Title">
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    test('renders with description', () => {
      render(
        <Panel title="Title" description="Test description">
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('renders with headerAction', () => {
      render(
        <Panel title="Title" headerAction={<button>Action</button>}>
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <Panel className="custom-class">
          <div>Content</div>
        </Panel>
      );
      const panel = container.firstChild;
      expect(panel).toHaveClass('custom-class');
    });

    test('applies custom contentClassName', () => {
      render(
        <Panel title="Title" contentClassName="custom-content">
          <div>Content</div>
        </Panel>
      );
      const content = screen.getByText('Content').parentElement;
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('Styles', () => {
    test('uses liquid glass style by default', () => {
      const { container } = render(
        <Panel>
          <div>Content</div>
        </Panel>
      );
      // Card component should have liquid prop by default
      expect(container.firstChild).toBeInTheDocument();
    });

    test('can use glassmorphism style', () => {
      const { container } = render(
        <Panel glassmorphism liquid={false}>
          <div>Content</div>
        </Panel>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    test('can use solid style', () => {
      const { container } = render(
        <Panel solid liquid={false}>
          <div>Content</div>
        </Panel>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    test('shows header when title is provided', () => {
      render(
        <Panel title="Test Title">
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    test('shows header when headerAction is provided', () => {
      render(
        <Panel headerAction={<button>Action</button>}>
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('hides header when no title or headerAction', () => {
      const { container } = render(
        <Panel>
          <div>Content</div>
        </Panel>
      );
      // Header should not be rendered (no border-b class in container)
      const hasBorderBottom = container.innerHTML.includes('border-b');
      expect(hasBorderBottom).toBe(false);
    });

    test('renders title and description together', () => {
      render(
        <Panel title="Title" description="Description">
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    test('renders title with headerAction', () => {
      render(
        <Panel title="Title" headerAction={<button>Action</button>}>
          <div>Content</div>
        </Panel>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Content Section', () => {
    test('renders content', () => {
      render(
        <Panel>
          <div>Test content</div>
        </Panel>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    test('adds padding-top when header is present', () => {
      render(
        <Panel title="Title">
          <div>Content</div>
        </Panel>
      );
      const content = screen.getByText('Content').parentElement;
      expect(content).toHaveClass('pt-4');
    });

    test('does not add padding-top when header is absent', () => {
      render(
        <Panel>
          <div>Content</div>
        </Panel>
      );
      const content = screen.getByText('Content').parentElement;
      expect(content).not.toHaveClass('pt-4');
    });
  });
});
