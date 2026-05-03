import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { CodeSnippet } from '../CodeSnippet';

describe('CodeSnippet (D-18, D-19)', () => {
  const SAMPLE = '<CircBtn Icon={Plus} primary tone="var(--accent)" />';

  let writeTextMock: jest.Mock;
  const originalClipboard = (global.navigator as Navigator & { clipboard?: Clipboard }).clipboard;

  beforeEach(() => {
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
  });

  test('renders a <pre> with the code text', () => {
    render(<CodeSnippet code={SAMPLE} />);
    expect(screen.getByText(SAMPLE)).toBeInTheDocument();
  });

  test('renders a Copia button initially', () => {
    render(<CodeSnippet code={SAMPLE} />);
    expect(screen.getByRole('button', { name: /Copia/i })).toBeInTheDocument();
  });

  test('clicking Copia calls navigator.clipboard.writeText with the code', async () => {
    render(<CodeSnippet code={SAMPLE} />);
    fireEvent.click(screen.getByRole('button', { name: /Copia/i }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(SAMPLE);
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });
  });

  test('button flips to Copiato then back to Copia after 1500ms', async () => {
    render(<CodeSnippet code={SAMPLE} />);
    fireEvent.click(screen.getByRole('button', { name: /Copia/i }));
    // Promise resolves microtask-first
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copiato/i })).toBeInTheDocument();
    });
    // Advance timers past 1500ms
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copia/i })).toBeInTheDocument();
    });
  });

  test('clipboard rejection leaves button on Copia (silent fallback)', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('denied'));
    render(<CodeSnippet code={SAMPLE} />);
    fireEvent.click(screen.getByRole('button', { name: /Copia/i }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
    // Button label should NOT have flipped to Copiato (stays Copia)
    expect(screen.queryByRole('button', { name: /^Copiato$/i })).toBeNull();
  });
});
