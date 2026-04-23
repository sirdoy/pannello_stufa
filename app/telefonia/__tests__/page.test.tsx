import { render, screen, fireEvent } from '@testing-library/react';
import TelefoniaPage from '../page';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('../hooks/useFritzTamStatus', () => ({
  useFritzTamStatus: jest.fn(),
}));

jest.mock('../hooks/useFritzDectHandsets', () => ({
  useFritzDectHandsets: jest.fn(),
}));

jest.mock('../hooks/useFritzCallHistory', () => ({
  useFritzCallHistory: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tamMod = require('../hooks/useFritzTamStatus') as {
  useFritzTamStatus: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dectMod = require('../hooks/useFritzDectHandsets') as {
  useFritzDectHandsets: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const callsMod = require('../hooks/useFritzCallHistory') as {
  useFritzCallHistory: jest.Mock;
};

describe('TelefoniaPage', () => {
  beforeEach(() => {
    pushMock.mockClear();

    tamMod.useFritzTamStatus.mockReturnValue({
      status: {
        enabled: true,
        new_messages: 0,
        total_messages: 0,
        is_stale: false,
        fetched_at: '2026-04-22T10:00:00Z',
      },
      loading: false,
      stale: false,
    });

    dectMod.useFritzDectHandsets.mockReturnValue({
      handsets: [
        {
          id: '1',
          name: 'Cucina',
          model: 'C6',
          firmware_version: '113.01',
          battery_charge_level: 75,
          is_registered: true,
        },
        {
          id: '2',
          name: 'Camera',
          model: 'C5',
          firmware_version: '112.00',
          battery_charge_level: 80,
          is_registered: true,
        },
      ],
      loading: false,
      stale: false,
      total: 2,
    });

    callsMod.useFritzCallHistory.mockReturnValue({
      calls: [
        {
          id: 'c1',
          call_type: 'incoming',
          number: '+393331112233',
          name: 'Mario',
          duration_seconds: 125,
          timestamp: 1713700000,
          port: 'DECT-1',
        },
      ],
      loading: false,
      stale: false,
      totalCount: 3,
      page: 0,
      setPage: jest.fn(),
    });
  });

  it('renders an <h1> with "Telefonia"', () => {
    render(<TelefoniaPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Telefonia');
  });

  it('renders Segreteria, Cornette DECT, and Cronologia chiamate section titles', () => {
    render(<TelefoniaPage />);
    expect(screen.getByText('Segreteria')).toBeInTheDocument();
    expect(screen.getByText('Cornette DECT')).toBeInTheDocument();
    expect(screen.getByText('Cronologia chiamate')).toBeInTheDocument();
  });

  it('does not emit console errors during render', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<TelefoniaPage />);
    // Filter out React act() warnings — they are test-harness noise, not production errors.
    const productionErrors = errorSpy.mock.calls.filter((args) => {
      const first = String(args[0] ?? '');
      return !first.includes('not wrapped in act');
    });
    expect(productionErrors).toEqual([]);
    errorSpy.mockRestore();
  });

  it('clicking "Indietro" calls router.push("/")', () => {
    render(<TelefoniaPage />);
    const back = screen.getByRole('button', { name: 'Torna alla homepage' });
    fireEvent.click(back);
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
