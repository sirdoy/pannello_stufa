/**
 * /altro route-level test (Phase 181 D-14 fourth bullet, route-level).
 *
 * Mocks the AltroPage child to keep this test focused on the route-shape
 * contract (sr-only h1 + child mount). Body-level coverage lives in
 * app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx.
 */
import { render, screen } from '@testing-library/react';
import AltroRoute from '../page';

jest.mock('@/app/components/EmberGlass/altro/AltroPage', () => ({
  AltroPage: () => <div data-testid="altro-page-stub" />,
}));

describe('/altro route', () => {
  it('renders the AltroPage component inside an sr-only-titled section', () => {
    render(<AltroRoute />);
    expect(screen.getByText('Altro')).toBeInTheDocument(); // sr-only h1
    expect(screen.getByTestId('altro-page-stub')).toBeInTheDocument();
  });
});
