/**
 * WeatherCard — Phase 177 (DASH-06) — Jest unit tests
 *
 * Coverage:
 *   - Renders summary fields from useWeatherSummary hook.
 *   - Renders fallback when loading / temp null (`—` + `Non raggiungibile`).
 *   - Read-only contract (D-11 / SC-#3): NO Sheet mounted, NO cursor pointer,
 *     clicking the card does NOT render any "Controlli in arrivo" body.
 */
import { fireEvent, render } from '@testing-library/react';

import WeatherCard from '../WeatherCard';

jest.mock('@/app/components/devices/weather/hooks/useWeatherSummary', () => ({
  useWeatherSummary: jest.fn(),
}));

import { useWeatherSummary } from '@/app/components/devices/weather/hooks/useWeatherSummary';

const mockedUseWeatherSummary = useWeatherSummary as jest.MockedFunction<typeof useWeatherSummary>;

describe('WeatherCard (Phase 177 — DASH-06)', () => {
  beforeEach(() => {
    mockedUseWeatherSummary.mockReset();
  });

  test('(a) renders city, temp, and Italian subtitle from hook data', () => {
    mockedUseWeatherSummary.mockReturnValue({
      city: 'Milano',
      temp: 22,
      condition: 'Sereno',
      high: 25,
      low: 14,
      loading: false,
    });

    const { getByTestId, getByText } = render(<WeatherCard />);

    expect(getByText('Milano')).toBeInTheDocument();
    expect(getByTestId('weather-temp')).toHaveTextContent('22');
    expect(getByText(/Sereno · ↑25° ↓14°/)).toBeInTheDocument();
  });

  test('(b) when loading=true and temp=null renders em-dash + "Non raggiungibile"', () => {
    mockedUseWeatherSummary.mockReturnValue({
      city: null,
      temp: null,
      condition: null,
      high: null,
      low: null,
      loading: true,
    });

    const { getByTestId, getByText } = render(<WeatherCard />);

    expect(getByTestId('weather-temp')).toHaveTextContent('—');
    expect(getByText('Non raggiungibile')).toBeInTheDocument();
  });

  test('(c) clicking card does NOT mount a sheet placeholder body (D-11 / SC-#3)', () => {
    mockedUseWeatherSummary.mockReturnValue({
      city: 'Milano',
      temp: 22,
      condition: 'Sereno',
      high: 25,
      low: 14,
      loading: false,
    });

    const { getByTestId, queryByText } = render(<WeatherCard />);

    fireEvent.click(getByTestId('weather-card'));

    expect(queryByText(/Controlli in arrivo/i)).toBeNull();
  });

  test('(d) root has NO cursor: pointer (no Pressable wrap — D-11)', () => {
    mockedUseWeatherSummary.mockReturnValue({
      city: 'Milano',
      temp: 22,
      condition: 'Sereno',
      high: 25,
      low: 14,
      loading: false,
    });

    const { getByTestId } = render(<WeatherCard />);

    expect(getByTestId('weather-card').style.cursor).not.toBe('pointer');
  });
});
