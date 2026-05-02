/**
 * NavbarConnectionStatusChip unit tests (Phase 181 D-13).
 * 3 specs: data-ws-chip attribute + fixed positioning + child renders.
 *
 * Mocks useWebSocketContext to control NavbarConnectionStatus's status output;
 * the chip itself is a positioning concern only — these tests confirm the
 * wrapper does not break the existing component's ARIA/role.
 */
import { render, screen } from '@testing-library/react';
import { ReadyState } from 'react-use-websocket';
import { NavbarConnectionStatusChip } from '../NavbarConnectionStatusChip';

jest.mock('@/app/context/WebSocketContext', () => ({
  useWebSocketContext: jest.fn(),
}));
import { useWebSocketContext } from '@/app/context/WebSocketContext';
const mockUseWebSocketContext = jest.mocked(useWebSocketContext);

describe('NavbarConnectionStatusChip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.OPEN,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
  });

  test('1: root element has data-ws-chip="true" attribute', () => {
    const { container } = render(<NavbarConnectionStatusChip />);
    expect(container.querySelector('[data-ws-chip="true"]')).not.toBeNull();
  });

  test('2: container has fixed position and zIndex 150', () => {
    const { container } = render(<NavbarConnectionStatusChip />);
    const chip = container.querySelector('[data-ws-chip="true"]') as HTMLElement;
    expect(chip).not.toBeNull();
    expect(chip.style.position).toBe('fixed');
    expect(chip.style.zIndex).toBe('150');
  });

  test('3: renders the wrapped NavbarConnectionStatus child (role="status" + connected text)', () => {
    render(<NavbarConnectionStatusChip />);
    // Phase 144 component renders a span with role="status".
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // Italian connected-state copy is locked by Phase 144 ("Connesso via WS"); regex lenient on case.
    expect(status.textContent).toMatch(/conness/i);
  });
});
