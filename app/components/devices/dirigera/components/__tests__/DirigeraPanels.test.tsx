/**
 * DIRIGERA stats/history panels rendered with the real backend payloads
 * (backend/api/providers/dirigera: raw sensor_events rows, in-memory job stats).
 */

import { render, screen } from '@testing-library/react';
import DirigeraHistoryPanel from '../DirigeraHistoryPanel';
import DirigeraStatsPanel from '../DirigeraStatsPanel';
import type { DirigeraStatsResponse, SensorEvent } from '@/types/dirigeraProxy';

describe('DirigeraHistoryPanel', () => {
  const events: SensorEvent[] = [
    { id: 1, sensor_id: 'sensor-door', event_type: 'open', timestamp: 1773000000 },
    { id: 2, sensor_id: 'sensor-unknown', event_type: 'close', timestamp: 1773000060 },
  ];

  it('renders sensor names from sensorNames and a valid date from `timestamp`', () => {
    render(
      <DirigeraHistoryPanel
        items={events}
        total={2}
        loading={false}
        isLoadingMore={false}
        error={null}
        stale={false}
        loadMore={() => {}}
        sensorNames={{ 'sensor-door': 'Porta ingresso' }}
      />,
    );

    expect(screen.getByText('Porta ingresso')).toBeInTheDocument();
    expect(screen.getByText('sensor-unknown')).toBeInTheDocument(); // falls back to id
    const expected = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' })
      .format(new Date(1773000000 * 1000));
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe('DirigeraStatsPanel', () => {
  it('renders the real aggregation/retention fields (null → n/d)', () => {
    const data: DirigeraStatsResponse = {
      aggregation: { last_run: 1773244800, last_sensors_processed: 6, total_runs: 3 },
      retention: {
        last_run: null,
        last_raw_events_deleted: 42,
        last_daily_rows_deleted: null,
        last_telemetry_deleted: 5,
        total_runs: 0,
      },
    };

    render(<DirigeraStatsPanel data={data} loading={false} error={null} stale={false} />);

    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('n/d')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
  });
});
