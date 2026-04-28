import { render } from '@testing-library/react';
import { SheetPlaceholderBody } from '../cards/SheetPlaceholderBody';

describe('SheetPlaceholderBody (EmberGlass helper — Phase 177 / DASH-11 placeholder)', () => {
  test('renders Italian phrase "Controlli in arrivo nella Phase 178" when phase="178"', () => {
    const { getByText } = render(<SheetPlaceholderBody phase="178" device="stove" />);
    expect(getByText(/Controlli in arrivo nella Phase 178/)).not.toBeNull();
  });

  test('renders subtitle "Stiamo cucinando."', () => {
    const { getByText } = render(<SheetPlaceholderBody phase="178" device="stove" />);
    expect(getByText('Stiamo cucinando.')).not.toBeNull();
  });

  test('renders an SVG icon (lucide) when device="stove" (Flame)', () => {
    const { container } = render(<SheetPlaceholderBody phase="178" device="stove" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  test('falls back to Flame icon for unknown device key', () => {
    // Cast to any since "unknown" is not a declared key in the ICONS map.
    const { container } = render(
      <SheetPlaceholderBody phase="178" device={'unknown' as never} />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  test('reflects phase prop in the heading text', () => {
    const { getByText } = render(<SheetPlaceholderBody phase="200" device="lights" />);
    expect(getByText(/Controlli in arrivo nella Phase 200/)).not.toBeNull();
  });
});
