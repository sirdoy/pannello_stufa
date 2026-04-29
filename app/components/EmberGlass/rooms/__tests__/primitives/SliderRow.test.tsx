/**
 * Phase 179 — SliderRow primitive spec
 * Bundle analog: rooms.jsx:559-585
 * Covers 7 behavior cases per plan specification.
 * TDD RED: tests written before component exists.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { Volume2 } from 'lucide-react';
import { SliderRow } from '../../primitives/SliderRow';

describe('SliderRow (D-36)', () => {
  // Test 1: renders label, value, unit
  test('renders label, value, and unit', () => {
    render(<SliderRow label="Luminosità" value={75} unit="%" tone="var(--accent)" />);
    expect(screen.getByText('Luminosità')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  // Test 2: read-only mode — no onChange supplied — cursor is not pointer
  test('read-only mode: no onChange supplied — track has cursor default', () => {
    const { container } = render(<SliderRow label="Posizione" value={50} unit="%" tone="var(--accent)" />);
    // The track div should use cursor: default (or not-allowed) when non-interactive
    const trackDiv = container.querySelector('[data-testid="slider-row-track"]') ??
      container.querySelector('[style*="border-radius: 999"]') ??
      Array.from(container.querySelectorAll('div')).find((el) =>
        (el.getAttribute('style') ?? '').includes('height: 6') ||
        (el.getAttribute('style') ?? '').includes('height:6'),
      );
    expect(trackDiv).not.toBeNull();
    const style = (trackDiv as HTMLElement).getAttribute('style') ?? '';
    // Should NOT be pointer cursor when no onChange (non-interactive)
    expect(style).not.toContain('cursor: pointer');
  });

  // Test 3: interactive mode — onChange supplied — clicking fires onChange with rounded percent 0-100
  test('interactive mode: onClick on track fires onChange with computed value', () => {
    const onChange = jest.fn();
    const { container } = render(
      <SliderRow label="Volume" value={50} unit="%" tone="var(--accent)" onChange={onChange} />,
    );
    // Find the track element (the gradient bar)
    const track = container.querySelector('[data-testid="slider-row-track"]') as HTMLElement;
    expect(track).not.toBeNull();

    // Mock getBoundingClientRect to simulate a 200px-wide track
    jest.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 200,
      width: 200,
      top: 0,
      bottom: 10,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);

    // Click at x=100 (50% of 200px width) → expect onChange(50)
    fireEvent.click(track, { clientX: 100 });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  // Test 4: disabled=true — no fire + opacity 0.45 + cursor not-allowed
  test('disabled=true: opacity 0.45 applied', () => {
    const { container } = render(
      <SliderRow label="Luminosità" value={75} unit="%" tone="var(--accent)" disabled onChange={jest.fn()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('0.45');
  });

  // Test 5: optional icon prop renders on the left
  test('optional icon renders left of label', () => {
    const { container } = render(
      <SliderRow label="Volume" value={60} unit="%" tone="var(--accent)" Icon={Volume2} />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  // Test 6: custom min/max maps gradient fill correctly
  test('custom min/max: color temp 2200-6500 maps percent correctly', () => {
    // value=4000, min=2200, max=6500 → percent = (4000-2200)/(6500-2200)*100 ≈ 41.86%
    const { container } = render(
      <SliderRow label="Temperatura" value={4000} unit="K" min={2200} max={6500} tone="var(--accent)" />,
    );
    // The fill element should have a width style reflecting ~42% (browser rounds / fractional)
    const fillEl = container.querySelector('[data-testid="slider-row-fill"]') as HTMLElement;
    expect(fillEl).not.toBeNull();
    const style = fillEl.getAttribute('style') ?? '';
    // Expect the width to include ~41 or ~42%
    expect(style).toMatch(/4[12]\./);
  });

  // Test 7: onChange NOT called on disabled even if onChange prop supplied
  test('disabled=true: onChange is NOT called even if prop supplied', () => {
    const onChange = jest.fn();
    const { container } = render(
      <SliderRow label="Luminosità" value={75} unit="%" tone="var(--accent)" disabled onChange={onChange} />,
    );
    const track = container.querySelector('[data-testid="slider-row-track"]') as HTMLElement;
    if (track) {
      jest.spyOn(track, 'getBoundingClientRect').mockReturnValue({
        left: 0, right: 200, width: 200, top: 0, bottom: 10, height: 10, x: 0, y: 0, toJSON: () => {},
      } as DOMRect);
      fireEvent.click(track, { clientX: 100 });
    }
    expect(onChange).not.toHaveBeenCalled();
  });
});
