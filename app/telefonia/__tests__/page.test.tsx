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
      // Real backend shape (TamStatusResponse)
      status: {
        tam: {
          total_messages: 0,
          new_messages: 0,
          tam_enabled: true,
          tam_name: 'Anrufbeantworter',
        },
        is_stale: false,
        fetched_at: '2026-04-22T10:00:00Z',
      },
      loading: false,
      stale: false,
    });

    dectMod.useFritzDectHandsets.mockReturnValue({
      // Real backend shape (DectHandsetModel)
      handsets: [
        { dect_id: 1, name: 'Cucina', phonebook_id: 0, model: null, registration_status: 'registered' },
        { dect_id: 2, name: 'Camera', phonebook_id: 0, model: null, registration_status: 'registered' },
      ],
      loading: false,
      stale: false,
      total: 2,
    });

    callsMod.useFritzCallHistory.mockReturnValue({
      calls: [
        // Real backend shape (CallRecordModel)
        {
          call_type: 'received',
          call_type_code: 1,
          name: 'Mario',
          caller: '+393331112233',
          called: '0301234567',
          caller_number: '+393331112233',
          called_number: '0301234567',
          date: '2026-02-17T10:30:00',
          duration_seconds: 125,
          device: 'Cucina',
          port: 'FON1',
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

  it('renders real backend data in all three cards', () => {
    render(<TelefoniaPage />);
    expect(screen.getByText('Attiva')).toBeInTheDocument();
    expect(screen.getByText('Cucina')).toBeInTheDocument();
    expect(screen.getAllByText('Registrato')).toHaveLength(2);
    expect(screen.getByText('Ricevuta')).toBeInTheDocument();
    expect(screen.getByText('+393331112233')).toBeInTheDocument();
    expect(screen.getByText('17 feb 2026 10:30')).toBeInTheDocument();
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
