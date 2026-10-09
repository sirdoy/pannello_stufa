/**
 * /altro route-level test (Phase 181 D-14 fourth bullet, route-level).
 *
 * Mocks the AltroPage child to keep this test focused on the route-shape
 * contract (child mount; the visible h1 comes from PageHeader inside AltroPage). Body-level coverage lives in
 * app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx.
 */
import { render, screen } from '@testing-library/react';
import AltroRoute from '../page';

jest.mock('@/app/components/EmberGlass/altro/AltroPage', () => ({
  AltroPage: () => <div data-testid="altro-page-stub" />,
}));

describe('/altro route', () => {
  it('renders the AltroPage component without a wrapper heading', () => {
    render(<AltroRoute />);
    // The h1 is rendered by PageHeader inside AltroPage (stubbed here), not by the route
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByTestId('altro-page-stub')).toBeInTheDocument();
  });
});
