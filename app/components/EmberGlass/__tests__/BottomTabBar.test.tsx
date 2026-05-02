/**
 * BottomTabBar unit tests (Phase 181 D-14 first bullet — 6 specs).
 *
 * Mocks usePathname via jest.mock('next/navigation'); each test sets the
 * mock return value before render(). Inline-style assertions follow the
 * CardHead.test.tsx idiom (read element.style.<prop> directly).
 */
import { render, screen } from '@testing-library/react';
import { BottomTabBar } from '../BottomTabBar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
import { usePathname } from 'next/navigation';
const mockUsePathname = jest.mocked(usePathname);

describe('BottomTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  test('1: renders 4 tabs with Italian labels', () => {
    render(<BottomTabBar />);
    expect(screen.getByText('Casa')).toBeInTheDocument();
    expect(screen.getByText('Stanze')).toBeInTheDocument();
    expect(screen.getByText('Automazioni')).toBeInTheDocument();
    expect(screen.getByText('Altro')).toBeInTheDocument();
  });

  test('2: pathname "/" makes Casa active (aria-current="page" + accent color)', () => {
    mockUsePathname.mockReturnValue('/');
    render(<BottomTabBar />);
    const casa = screen.getByRole('link', { name: /casa/i });
    expect(casa).toHaveAttribute('aria-current', 'page');
    expect(casa.style.color).toBe('var(--accent)');
  });

  test('3: prefix-match — pathname "/stanze/sala" makes Stanze active', () => {
    mockUsePathname.mockReturnValue('/stanze/sala');
    render(<BottomTabBar />);
    const stanze = screen.getByRole('link', { name: /stanze/i });
    expect(stanze).toHaveAttribute('aria-current', 'page');
  });

  test('4: non-tab route "/stove/scheduler" leaves ALL tabs inactive (D-06)', () => {
    mockUsePathname.mockReturnValue('/stove/scheduler');
    render(<BottomTabBar />);
    const activeLinks = screen.queryAllByRole('link').filter(
      (link) => link.getAttribute('aria-current') === 'page'
    );
    expect(activeLinks).toHaveLength(0);
  });

  test('5: each tab is a <Link> with href matching D-05 map', () => {
    mockUsePathname.mockReturnValue('/');
    render(<BottomTabBar />);
    expect(screen.getByRole('link', { name: /casa/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /stanze/i })).toHaveAttribute('href', '/stanze');
    expect(screen.getByRole('link', { name: /automazioni/i })).toHaveAttribute('href', '/automazioni');
    expect(screen.getByRole('link', { name: /altro/i })).toHaveAttribute('href', '/altro');
  });

  test('6: root container has data-bottom-tab="true" (D-09 selector hook)', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<BottomTabBar />);
    expect(container.querySelector('[data-bottom-tab="true"]')).not.toBeNull();
  });
});
