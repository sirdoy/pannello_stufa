/**
 * TriggerSection test suite — AUTO-03 + D-08 + D-12
 *
 * RED phase: tests written before implementation.
 * Tests cover: 2-tile constraint (D-08), create vs edit mode (D-12),
 * config panel tone-wrapping, TriggerForm integration.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { TriggerSection } from '../../sections/TriggerSection';

describe('TriggerSection (AUTO-03 + D-08 + D-12)', () => {
  test('renders exactly 2 type tiles (D-08 — schedule_cron + manual_api_call only)', () => {
    render(
      <TriggerSection
        trigger={{ type: 'manual_api_call' }}
        onChange={() => {}}
        isNew
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByLabelText(/Pianificazione/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Manuale/)).toBeInTheDocument();
  });

  test('create mode: clicking unselected tile fires onChange with defaultTrigger', () => {
    const onChange = jest.fn();
    render(
      <TriggerSection
        trigger={{ type: 'manual_api_call' }}
        onChange={onChange}
        isNew
      />
    );
    fireEvent.click(screen.getByLabelText(/Pianificazione/));
    expect(onChange).toHaveBeenCalledWith({ type: 'schedule_cron', cron_expression: '0 8 * * *' });
  });

  test('create mode: clicking already-selected tile does NOT fire onChange', () => {
    const onChange = jest.fn();
    render(
      <TriggerSection
        trigger={{ type: 'manual_api_call' }}
        onChange={onChange}
        isNew
      />
    );
    fireEvent.click(screen.getByLabelText(/Manuale/));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('edit mode (isNew=false): tiles disabled, click does NOT fire onChange (D-12)', () => {
    const onChange = jest.fn();
    render(
      <TriggerSection
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={onChange}
        isNew={false}
      />
    );
    const cronTile = screen.getByLabelText(/Pianificazione/);
    expect(cronTile).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(cronTile);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('edit mode: inline note appears above tile grid (D-12)', () => {
    render(
      <TriggerSection
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew={false}
      />
    );
    expect(
      screen.getByText("Per cambiare il trigger, elimina e ricrea l'automazione.")
    ).toBeInTheDocument();
  });

  test('create mode: inline note does NOT render', () => {
    render(
      <TriggerSection
        trigger={{ type: 'manual_api_call' }}
        onChange={() => {}}
        isNew
      />
    );
    expect(
      screen.queryByText("Per cambiare il trigger, elimina e ricrea l'automazione.")
    ).not.toBeInTheDocument();
  });

  test('config panel renders TriggerForm matching the selected trigger type', () => {
    const { rerender } = render(
      <TriggerSection
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew
      />
    );
    expect(screen.getByLabelText(/Espressione cron/)).toBeInTheDocument();
    rerender(
      <TriggerSection
        trigger={{ type: 'manual_api_call' }}
        onChange={() => {}}
        isNew
      />
    );
    expect(screen.getByText(/invocata manualmente/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Espressione cron/)).not.toBeInTheDocument();
  });

  test('null trigger: no config panel renders (defensive)', () => {
    render(
      <TriggerSection
        trigger={null}
        onChange={() => {}}
        isNew
      />
    );
    // No config panel = no cron input and no manual info copy
    expect(screen.queryByLabelText(/Espressione cron/)).not.toBeInTheDocument();
    expect(screen.queryByText(/invocata manualmente/)).not.toBeInTheDocument();
  });
});
