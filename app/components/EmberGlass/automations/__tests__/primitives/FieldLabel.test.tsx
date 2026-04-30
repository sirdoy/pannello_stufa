import { render, screen } from '@testing-library/react';
import { FieldLabel } from '../../primitives/FieldLabel';

describe('FieldLabel', () => {
  test('renders children as label text', () => {
    render(<FieldLabel>Nome</FieldLabel>);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  test('renders as a label element', () => {
    render(<FieldLabel>Test</FieldLabel>);
    expect(screen.getByText('Test').tagName).toBe('LABEL');
  });

  test('htmlFor attribute is forwarded to label element', () => {
    render(<FieldLabel htmlFor="my-input">Label</FieldLabel>);
    const label = screen.getByText('Label');
    expect(label).toHaveAttribute('for', 'my-input');
  });

  test('normal (default) font size is 11px', () => {
    render(<FieldLabel>Normal</FieldLabel>);
    const label = screen.getByText('Normal');
    expect(label).toHaveStyle({ fontSize: '11px' });
  });

  test('small prop reduces font size to 10px', () => {
    render(<FieldLabel small>Small</FieldLabel>);
    const label = screen.getByText('Small');
    expect(label).toHaveStyle({ fontSize: '10px' });
  });

  test('applies uppercase textTransform', () => {
    render(<FieldLabel>Upper</FieldLabel>);
    const label = screen.getByText('Upper');
    expect(label).toHaveStyle({ textTransform: 'uppercase' });
  });

  test('applies correct letterSpacing of 0.8', () => {
    render(<FieldLabel>Spacing</FieldLabel>);
    const label = screen.getByText('Spacing');
    expect(label).toHaveStyle({ letterSpacing: '0.8px' });
  });

  test('applies marginBottom of 6px', () => {
    render(<FieldLabel>Margin</FieldLabel>);
    const label = screen.getByText('Margin');
    expect(label).toHaveStyle({ marginBottom: '6px' });
  });
});
