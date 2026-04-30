import { render, screen } from '@testing-library/react';
import { Pill } from '../../primitives/Pill';

describe('Pill', () => {
  test('renders children text', () => {
    render(<Pill>Pianificazione</Pill>);
    expect(screen.getByText('Pianificazione')).toBeInTheDocument();
  });

  // Neutral (default) mode
  test('default (neutral) mode has white text color', () => {
    render(<Pill>Neutral</Pill>);
    expect(screen.getByText('Neutral')).toHaveStyle({ color: '#fff' });
  });

  test('default (neutral) mode has glass background', () => {
    render(<Pill>Neutral</Pill>);
    expect(screen.getByText('Neutral')).toHaveStyle({
      background: 'rgba(255,255,255,0.06)',
    });
  });

  test('default (neutral) mode has white border', () => {
    render(<Pill>Neutral</Pill>);
    expect(screen.getByText('Neutral')).toHaveStyle({
      border: '0.5px solid rgba(255,255,255,0.08)',
    });
  });

  // Tone-colored mode
  test('tone prop applies tone-colored background (color-mix)', () => {
    render(<Pill tone="#5eafff">Cron</Pill>);
    expect(screen.getByText('Cron')).toHaveStyle({
      background: 'color-mix(in oklab, #5eafff 16%, transparent)',
    });
  });

  test('tone prop applies tone color as text color', () => {
    render(<Pill tone="#5eafff">Cron</Pill>);
    expect(screen.getByText('Cron')).toHaveStyle({ color: '#5eafff' });
  });

  test('tone prop applies tone-colored border', () => {
    render(<Pill tone="#5eafff">Cron</Pill>);
    expect(screen.getByText('Cron')).toHaveStyle({
      border: '0.5px solid color-mix(in oklab, #5eafff 25%, transparent)',
    });
  });

  // Muted mode
  test('muted prop applies transparent background', () => {
    render(<Pill muted>Muted</Pill>);
    expect(screen.getByText('Muted')).toHaveStyle({ background: 'transparent' });
  });

  test('muted prop applies var(--text-2) text color', () => {
    render(<Pill muted>Muted</Pill>);
    expect(screen.getByText('Muted')).toHaveStyle({ color: 'var(--text-2)' });
  });

  test('muted prop still applies white 0.08 border', () => {
    render(<Pill muted>Muted</Pill>);
    expect(screen.getByText('Muted')).toHaveStyle({
      border: '0.5px solid rgba(255,255,255,0.08)',
    });
  });

  // Shared style values
  test('padding is 4px 9px (spacing contract)', () => {
    render(<Pill>Pill</Pill>);
    expect(screen.getByText('Pill')).toHaveStyle({ padding: '4px 9px' });
  });

  test('border-radius is 999px (pill shape)', () => {
    render(<Pill>Pill</Pill>);
    expect(screen.getByText('Pill')).toHaveStyle({ borderRadius: '999px' });
  });

  test('font size is 10px', () => {
    render(<Pill>Pill</Pill>);
    expect(screen.getByText('Pill')).toHaveStyle({ fontSize: '10px' });
  });

  test('font weight is 600', () => {
    render(<Pill>Pill</Pill>);
    expect(screen.getByText('Pill')).toHaveStyle({ fontWeight: '600' });
  });

  test('letter spacing is 0.2px', () => {
    render(<Pill>Pill</Pill>);
    expect(screen.getByText('Pill')).toHaveStyle({ letterSpacing: '0.2px' });
  });
});
