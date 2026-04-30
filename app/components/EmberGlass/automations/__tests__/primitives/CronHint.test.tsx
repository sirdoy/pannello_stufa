import { render, screen } from '@testing-library/react';
import { CronHint } from '../../primitives/CronHint';

/** Helper: return all divs whose inline fontFamily contains 'ui-monospace' (value divs) */
function getValueDivs(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('div')).filter(
    (d) => (d as HTMLElement).style.fontFamily?.includes('ui-monospace'),
  ) as HTMLElement[];
}

describe('CronHint', () => {
  test('renders exactly 5 segment containers', () => {
    const { container } = render(<CronHint expr="0 8 * * *" />);
    // Each segment has its own wrapper div with flex:1 style
    const valueDivs = getValueDivs(container);
    expect(valueDivs).toHaveLength(5);
  });

  test('renders 5 Italian labels in lowercase (verbatim from bundle)', () => {
    const { container } = render(<CronHint expr="0 8 * * *" />);
    const text = container.textContent ?? '';
    expect(text).toContain('min');
    expect(text).toContain('ora');
    expect(text).toContain('giorno');
    expect(text).toContain('mese');
    expect(text).toContain('giorno sett.');
  });

  test('parses standard cron "0 8 * * *" into correct segment values', () => {
    const { container } = render(<CronHint expr="0 8 * * *" />);
    const valueDivs = getValueDivs(container);
    expect(valueDivs.map((d) => d.textContent)).toEqual(['0', '8', '*', '*', '*']);
  });

  test('missing tokens render "—" placeholder', () => {
    const { container } = render(<CronHint expr="0 8" />);
    const valueDivs = getValueDivs(container);
    expect(valueDivs.map((d) => d.textContent)).toEqual(['0', '8', '—', '—', '—']);
  });

  test('extra whitespace between tokens is collapsed correctly', () => {
    const { container } = render(<CronHint expr="*/5    *  *  *  *" />);
    const valueDivs = getValueDivs(container);
    expect(valueDivs.map((d) => d.textContent)).toEqual(['*/5', '*', '*', '*', '*']);
  });

  test('leading/trailing whitespace is trimmed before parsing', () => {
    const { container } = render(<CronHint expr="  30 6 * * 1  " />);
    const valueDivs = getValueDivs(container);
    expect(valueDivs.map((d) => d.textContent)).toEqual(['30', '6', '*', '*', '1']);
  });

  test('value divs use ui-monospace font (spacing contract)', () => {
    const { container } = render(<CronHint expr="0 8 * * *" />);
    const valueDivs = getValueDivs(container);
    expect(valueDivs.length).toBeGreaterThan(0);
    valueDivs.forEach((d) => {
      expect(d).toHaveStyle({ fontFamily: 'ui-monospace, monospace' });
    });
  });

  test('value divs have fontSize 12px (spacing contract)', () => {
    const { container } = render(<CronHint expr="0 8 * * *" />);
    const valueDivs = getValueDivs(container);
    valueDivs.forEach((d) => {
      expect(d).toHaveStyle({ fontSize: '12px' });
    });
  });

  test('container has marginTop 8px (spacing contract)', () => {
    const { container } = render(<CronHint expr="0 8 * * *" />);
    // The outermost div is the flex container
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({ marginTop: '8px' });
  });

  test('empty string expr renders first segment as empty, rest as "—" placeholders', () => {
    // "".trim().split(/\s+/) → [""] so parts[0]="" and parts[1..4] are undefined → "—"
    const { container } = render(<CronHint expr="" />);
    const valueDivs = getValueDivs(container);
    expect(valueDivs.map((d) => d.textContent)).toEqual(['', '—', '—', '—', '—']);
  });
});
