import { render, screen, fireEvent } from '@testing-library/react';
import { TypeTile } from '../../primitives/TypeTile';

const TONE = '#5eafff';

describe('TypeTile', () => {
  test('renders label text', () => {
    render(<TypeTile icon={<span>I</span>} label="Pianificazione" tone={TONE} selected={false} />);
    expect(screen.getByText('Pianificazione')).toBeInTheDocument();
  });

  test('renders desc text when provided', () => {
    render(
      <TypeTile
        icon={<span>I</span>}
        label="Pianificazione"
        desc="Ora o cron schedule"
        tone={TONE}
        selected={false}
      />,
    );
    expect(screen.getByText('Ora o cron schedule')).toBeInTheDocument();
  });

  test('does not render desc element when desc is not provided', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} />);
    // Only the label div should be present in content area
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  test('selected=true sets aria-pressed="true" on button', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('selected=false sets aria-pressed="false" on button', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  test('onClick fires when tile is not disabled', () => {
    const onClick = jest.fn();
    render(
      <TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('disabled=true prevents onClick from firing (D-12 trigger read-only mode)', () => {
    const onClick = jest.fn();
    render(
      <TypeTile
        icon={<span>I</span>}
        label="X"
        tone={TONE}
        selected={false}
        onClick={onClick}
        disabled
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('disabled=true sets aria-disabled="true"', () => {
    render(
      <TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} disabled />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  test('disabled=true applies opacity 0.45', () => {
    render(
      <TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} disabled />,
    );
    expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.45' });
  });

  test('disabled=true applies cursor not-allowed', () => {
    render(
      <TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} disabled />,
    );
    expect(screen.getByRole('button')).toHaveStyle({ cursor: 'not-allowed' });
  });

  test('disabled=true applies pointerEvents none', () => {
    render(
      <TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} disabled />,
    );
    expect(screen.getByRole('button')).toHaveStyle({ pointerEvents: 'none' });
  });

  test('selected=true applies tone-colored background (color-mix 18%)', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected />);
    expect(screen.getByRole('button')).toHaveStyle({
      background: `color-mix(in oklab, ${TONE} 18%, transparent)`,
    });
  });

  test('selected=false applies unselected background rgba(255,255,255,0.04)', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} />);
    expect(screen.getByRole('button')).toHaveStyle({
      background: 'rgba(255,255,255,0.04)',
    });
  });

  test('tile padding is 10px (spacing contract)', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} />);
    expect(screen.getByRole('button')).toHaveStyle({ padding: '10px' });
  });

  test('tile border-radius is 11px (spacing contract)', () => {
    render(<TypeTile icon={<span>I</span>} label="X" tone={TONE} selected={false} />);
    expect(screen.getByRole('button')).toHaveStyle({ borderRadius: '11px' });
  });

  test('aria-label is forwarded to button', () => {
    render(
      <TypeTile
        icon={<span>I</span>}
        label="X"
        tone={TONE}
        selected={false}
        aria-label="Tipo pianificazione"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Tipo pianificazione' }),
    ).toBeInTheDocument();
  });
});
