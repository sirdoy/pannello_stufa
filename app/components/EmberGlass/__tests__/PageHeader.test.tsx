import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader (ROADMAP M72)', () => {
  test('renders the title as the only h1, with eyebrow and description', () => {
    render(<PageHeader title="Rete" eyebrow="Fritz!Box" description="Stato della rete di casa" />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Rete');
    expect(screen.getByText('Fritz!Box')).toBeInTheDocument();
    expect(screen.getByText('Stato della rete di casa')).toBeInTheDocument();
  });

  test('back button links to the parent route', () => {
    render(<PageHeader title="Pianificazione" backHref="/stove" />);
    expect(screen.getByRole('link', { name: 'Indietro' })).toHaveAttribute('href', '/stove');
  });

  test('tab roots have no back button but keep the top row height', () => {
    render(<PageHeader title="Altro" />);
    expect(screen.queryByRole('link', { name: 'Indietro' })).toBeNull();
    const topRow = screen.getByTestId('page-header').firstElementChild as HTMLElement;
    expect(topRow.style.height).toBe('36px');
  });

  test('renders the actions slot next to the title', () => {
    render(<PageHeader title="Automazioni" actions={<button type="button">Nuova</button>} />);
    expect(screen.getByRole('button', { name: 'Nuova' })).toBeInTheDocument();
  });
});
