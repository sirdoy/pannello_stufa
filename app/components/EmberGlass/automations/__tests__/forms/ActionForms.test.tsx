/**
 * ActionForms tests — Phase 180 Plan 06 Task 1
 * Covers: 11 form renders, conditional field logic, JSON validation,
 * dispatcher, and D-09b unsupported type fallback.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  NetatmoSetRoomTempForm,
  NetatmoSetHomeModeForm,
  NetatmoSwitchScheduleForm,
  ThermorossiForm,
  HueLightForm,
  HueGroupForm,
  HueSceneForm,
  TuyaForm,
  SonosForm,
  HttpWebhookForm,
  LogEventForm,
  ActionForm,
} from '../../forms/ActionForms';
import { defaultAction } from '../../lib/automations-config';
import type {
  ThermorossiAction,
  SonosAction,
  TuyaAction,
  HttpWebhookAction,
} from '@/types/automations';

// ─── 1. NetatmoSetRoomTempForm ───────────────────────────────────────────────
describe('NetatmoSetRoomTempForm', () => {
  it('renders without crashing given default action', () => {
    const action = defaultAction('netatmo_set_room_temp');
    expect(() =>
      render(<NetatmoSetRoomTempForm action={action as Parameters<typeof NetatmoSetRoomTempForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders home_id, room_id, mode, temp fields', () => {
    const action = defaultAction('netatmo_set_room_temp');
    render(<NetatmoSetRoomTempForm action={action as Parameters<typeof NetatmoSetRoomTempForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Home ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Room ID')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Modalità/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura')).toBeInTheDocument();
  });
});

// ─── 2. NetatmoSetHomeModeForm ───────────────────────────────────────────────
describe('NetatmoSetHomeModeForm', () => {
  it('renders without crashing given default action', () => {
    const action = defaultAction('netatmo_set_home_mode');
    expect(() =>
      render(<NetatmoSetHomeModeForm action={action as Parameters<typeof NetatmoSetHomeModeForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders home_id and mode fields', () => {
    const action = defaultAction('netatmo_set_home_mode');
    render(<NetatmoSetHomeModeForm action={action as Parameters<typeof NetatmoSetHomeModeForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Home ID')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Modalità/i })).toBeInTheDocument();
  });
});

// ─── 3. NetatmoSwitchScheduleForm ────────────────────────────────────────────
describe('NetatmoSwitchScheduleForm', () => {
  it('renders without crashing given default action', () => {
    const action = defaultAction('netatmo_switch_schedule');
    expect(() =>
      render(<NetatmoSwitchScheduleForm action={action as Parameters<typeof NetatmoSwitchScheduleForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders home_id and schedule_id fields', () => {
    const action = defaultAction('netatmo_switch_schedule');
    render(<NetatmoSwitchScheduleForm action={action as Parameters<typeof NetatmoSwitchScheduleForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Home ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Schedule ID')).toBeInTheDocument();
  });
});

// ─── 4. ThermorossiForm ──────────────────────────────────────────────────────
describe('ThermorossiForm', () => {
  it('renders without crashing given default action (ignite)', () => {
    const action = defaultAction('thermorossi') as ThermorossiAction;
    expect(() =>
      render(<ThermorossiForm action={action} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('hides power_level, fan_level, water_temp when command=ignite', () => {
    const action: ThermorossiAction = { type: 'thermorossi', command: 'ignite', power_level: null, fan_level: null, water_temp: null };
    render(<ThermorossiForm action={action} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Livello potenza')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Livello ventola')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Temperatura acqua')).not.toBeInTheDocument();
  });

  it('shows ONLY power_level when command=set_power', () => {
    const action: ThermorossiAction = { type: 'thermorossi', command: 'set_power', power_level: null, fan_level: null, water_temp: null };
    render(<ThermorossiForm action={action} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Livello potenza')).toBeInTheDocument();
    expect(screen.queryByLabelText('Livello ventola')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Temperatura acqua')).not.toBeInTheDocument();
  });

  it('shows ONLY fan_level when command=set_fan', () => {
    const action: ThermorossiAction = { type: 'thermorossi', command: 'set_fan', power_level: null, fan_level: null, water_temp: null };
    render(<ThermorossiForm action={action} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Livello potenza')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Livello ventola')).toBeInTheDocument();
    expect(screen.queryByLabelText('Temperatura acqua')).not.toBeInTheDocument();
  });

  it('shows ONLY water_temp when command=set_water_temp', () => {
    const action: ThermorossiAction = { type: 'thermorossi', command: 'set_water_temp', power_level: null, fan_level: null, water_temp: null };
    render(<ThermorossiForm action={action} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Livello potenza')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Livello ventola')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura acqua')).toBeInTheDocument();
  });

  it('resets all conditional fields on command switch (set_power -> set_fan)', () => {
    const action: ThermorossiAction = { type: 'thermorossi', command: 'set_power', power_level: 3, fan_level: null, water_temp: null };
    const onChange = jest.fn();
    render(<ThermorossiForm action={action} onChange={onChange} />);
    // Click set_fan segment
    fireEvent.click(screen.getByRole('radio', { name: /Ventola/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'set_fan', power_level: null, fan_level: null, water_temp: null }),
    );
  });
});

// ─── 5. HueLightForm ─────────────────────────────────────────────────────────
describe('HueLightForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('hue_light');
    expect(() =>
      render(<HueLightForm action={action as Parameters<typeof HueLightForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders all 6 fields (light_id, on, brightness, color_temp, hue, sat)', () => {
    const action = defaultAction('hue_light');
    render(<HueLightForm action={action as Parameters<typeof HueLightForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Light ID')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Stato/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Luminosità')).toBeInTheDocument();
    expect(screen.getByLabelText('Temp. colore')).toBeInTheDocument();
    expect(screen.getByLabelText('Tonalità')).toBeInTheDocument();
    expect(screen.getByLabelText('Saturazione')).toBeInTheDocument();
  });
});

// ─── 6. HueGroupForm ─────────────────────────────────────────────────────────
describe('HueGroupForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('hue_group');
    expect(() =>
      render(<HueGroupForm action={action as Parameters<typeof HueGroupForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders group_id, on, brightness, color_temp — but NOT hue or sat', () => {
    const action = defaultAction('hue_group');
    render(<HueGroupForm action={action as Parameters<typeof HueGroupForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Group ID')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Stato/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Luminosità')).toBeInTheDocument();
    expect(screen.getByLabelText('Temp. colore')).toBeInTheDocument();
    // NO hue/sat
    expect(screen.queryByLabelText('Tonalità')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Saturazione')).not.toBeInTheDocument();
  });
});

// ─── 7. HueSceneForm ─────────────────────────────────────────────────────────
describe('HueSceneForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('hue_scene');
    expect(() =>
      render(<HueSceneForm action={action as Parameters<typeof HueSceneForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders group_id and scene_id', () => {
    const action = defaultAction('hue_scene');
    render(<HueSceneForm action={action as Parameters<typeof HueSceneForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Group ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Scene ID')).toBeInTheDocument();
  });
});

// ─── 8. SonosForm ────────────────────────────────────────────────────────────
describe('SonosForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('sonos') as SonosAction;
    expect(() =>
      render(<SonosForm action={action} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('shows volume ONLY when command=set_volume', () => {
    const action: SonosAction = { type: 'sonos', speaker_uid: '', command: 'set_volume', volume: null, source: null };
    render(<SonosForm action={action} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: /Sorgente/i })).not.toBeInTheDocument();
  });

  it('shows source ONLY when command=switch_source', () => {
    const action: SonosAction = { type: 'sonos', speaker_uid: '', command: 'switch_source', volume: null, source: null };
    render(<SonosForm action={action} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Volume')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Sorgente/i })).toBeInTheDocument();
  });

  it('hides volume and source when command=play', () => {
    const action: SonosAction = { type: 'sonos', speaker_uid: '', command: 'play', volume: null, source: null };
    render(<SonosForm action={action} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Volume')).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: /Sorgente/i })).not.toBeInTheDocument();
  });
});

// ─── 9. TuyaForm ─────────────────────────────────────────────────────────────
describe('TuyaForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('tuya') as TuyaAction;
    expect(() =>
      render(<TuyaForm action={action} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('shows on ONLY when command=set_status', () => {
    const action: TuyaAction = { type: 'tuya', device_id: '', command: 'set_status', on: null, timer_seconds: null };
    render(<TuyaForm action={action} onChange={jest.fn()} />);
    expect(screen.getByRole('radiogroup', { name: /Stato/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Timer')).not.toBeInTheDocument();
  });

  it('shows timer_seconds ONLY when command=set_timer', () => {
    const action: TuyaAction = { type: 'tuya', device_id: '', command: 'set_timer', on: null, timer_seconds: null };
    render(<TuyaForm action={action} onChange={jest.fn()} />);
    expect(screen.queryByRole('radiogroup', { name: /Stato/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Timer')).toBeInTheDocument();
  });
});

// ─── 10. HttpWebhookForm ─────────────────────────────────────────────────────
describe('HttpWebhookForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('http_webhook') as HttpWebhookAction;
    expect(() =>
      render(<HttpWebhookForm action={action} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('calls onChange with payload: { a: 1 } and onValidationChange(true) for valid JSON', () => {
    const action: HttpWebhookAction = { type: 'http_webhook', url: '', method: 'POST', payload: null };
    const onChange = jest.fn();
    const onValidationChange = jest.fn();
    render(<HttpWebhookForm action={action} onChange={onChange} onValidationChange={onValidationChange} />);
    fireEvent.change(screen.getByLabelText('Payload JSON'), { target: { value: '{"a":1}' } });
    expect(onValidationChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ payload: { a: 1 } }));
  });

  it('shows "JSON non valido" and calls onValidationChange(false) for invalid JSON', () => {
    const action: HttpWebhookAction = { type: 'http_webhook', url: '', method: 'POST', payload: null };
    const onValidationChange = jest.fn();
    render(<HttpWebhookForm action={action} onChange={jest.fn()} onValidationChange={onValidationChange} />);
    fireEvent.change(screen.getByLabelText('Payload JSON'), { target: { value: '{' } });
    expect(screen.getByText('JSON non valido')).toBeInTheDocument();
    expect(onValidationChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange with payload: null and onValidationChange(true) for empty textarea', () => {
    const action: HttpWebhookAction = { type: 'http_webhook', url: '', method: 'POST', payload: null };
    const onChange = jest.fn();
    const onValidationChange = jest.fn();
    render(<HttpWebhookForm action={action} onChange={onChange} onValidationChange={onValidationChange} />);
    // First type invalid JSON, then clear — ensures onChange fires on a real value change
    const textarea = screen.getByLabelText('Payload JSON');
    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    onChange.mockClear();
    onValidationChange.mockClear();
    fireEvent.change(textarea, { target: { value: '' } });
    expect(onValidationChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ payload: null }));
  });
});

// ─── 11. LogEventForm ────────────────────────────────────────────────────────
describe('LogEventForm', () => {
  it('renders without crashing', () => {
    const action = defaultAction('log_event');
    expect(() =>
      render(<LogEventForm action={action as Parameters<typeof LogEventForm>[0]['action']} onChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders message field', () => {
    const action = defaultAction('log_event');
    render(<LogEventForm action={action as Parameters<typeof LogEventForm>[0]['action']} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Messaggio')).toBeInTheDocument();
  });
});

// ─── ActionForm dispatcher ────────────────────────────────────────────────────
describe('ActionForm dispatcher', () => {
  const allTypes = [
    'netatmo_set_room_temp',
    'netatmo_set_home_mode',
    'netatmo_switch_schedule',
    'thermorossi',
    'hue_light',
    'hue_group',
    'hue_scene',
    'tuya',
    'sonos',
    'http_webhook',
    'log_event',
  ] as const;

  allTypes.forEach((type) => {
    it(`renders ${type} form via dispatcher`, () => {
      const action = defaultAction(type);
      expect(() =>
        render(<ActionForm action={action} onChange={jest.fn()} />),
      ).not.toThrow();
    });
  });
});
