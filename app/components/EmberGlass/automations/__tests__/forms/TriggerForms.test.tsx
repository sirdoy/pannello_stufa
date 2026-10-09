/**
 * TriggerForms test suite — AUTO-03 + D-08 + D-12
 *
 * RED phase: tests written before implementation.
 * Tests cover ScheduleCronForm, ManualApiCallForm, TriggerForm dispatcher.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleCronForm, ManualApiCallForm, TriggerForm } from '../../forms/TriggerForms';

describe('ScheduleCronForm', () => {
  test('renders cron TextInput with mono font + value + CronHint', () => {
    render(
      <ScheduleCronForm
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew
      />
    );
    const input = screen.getByLabelText(/Espressione cron/i) as HTMLInputElement;
    expect(input.value).toBe('0 8 * * *');
    expect(input).not.toHaveAttribute('readonly');
    // CronHint renders 5 segment labels
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('giorno sett.')).toBeInTheDocument();
  });

  test('onChange fires with full ScheduleCronTrigger shape', () => {
    const onChange = jest.fn();
    render(
      <ScheduleCronForm
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={onChange}
        isNew
      />
    );
    fireEvent.change(screen.getByLabelText(/Espressione cron/i), { target: { value: '*/5 * * * *' } });
    expect(onChange).toHaveBeenCalledWith({ type: 'schedule_cron', cron_expression: '*/5 * * * *' });
  });

  test('isNew=false makes TextInput readOnly (D-12)', () => {
    render(
      <ScheduleCronForm
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew={false}
      />
    );
    expect(screen.getByLabelText(/Espressione cron/i)).toHaveAttribute('readonly');
  });

  test('renders Italian hint copy', () => {
    render(
      <ScheduleCronForm
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew
      />
    );
    expect(screen.getByText(/Formato: min ora giorno mese giorno_sett\./)).toBeInTheDocument();
  });

  test('FieldLabel renders "Espressione cron" uppercase', () => {
    render(
      <ScheduleCronForm
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew
      />
    );
    // FieldLabel renders as a <label> element
    expect(screen.getByText(/Espressione cron/i).tagName).toBe('LABEL');
  });
});

describe('ScheduleCronForm — validation and local time (ROADMAP M69)', () => {
  const noop = () => undefined;

  it('says the time is the local one', () => {
    render(<ScheduleCronForm trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }} onChange={noop} isNew />);
    expect(screen.getByText(/orario è quello di casa/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows what is wrong in a malformed expression of a new rule', () => {
    render(<ScheduleCronForm trigger={{ type: 'schedule_cron', cron_expression: '0 25 * * *' }} onChange={noop} isNew />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ora: 25 è fuori da 0–23.');
  });

  it('does not complain about the read-only trigger of an existing rule', () => {
    render(
      <ScheduleCronForm trigger={{ type: 'schedule_cron', cron_expression: 'bad' }} onChange={noop} isNew={false} />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('ManualApiCallForm', () => {
  test('renders Italian info copy verbatim, no inputs', () => {
    render(<ManualApiCallForm trigger={{ type: 'manual_api_call' }} onChange={() => {}} isNew />);
    expect(
      screen.getByText(
        /Questa automazione si avvia solo quando viene invocata manualmente dall'app o via API\./
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('renders as a paragraph-style div (no interactive elements)', () => {
    const { container } = render(
      <ManualApiCallForm trigger={{ type: 'manual_api_call' }} onChange={() => {}} isNew />
    );
    expect(container.querySelectorAll('input')).toHaveLength(0);
    expect(container.querySelectorAll('select')).toHaveLength(0);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('TriggerForm dispatcher', () => {
  test('schedule_cron renders ScheduleCronForm', () => {
    render(
      <TriggerForm
        trigger={{ type: 'schedule_cron', cron_expression: '0 8 * * *' }}
        onChange={() => {}}
        isNew
      />
    );
    expect(screen.getByLabelText(/Espressione cron/i)).toBeInTheDocument();
  });

  test('manual_api_call renders ManualApiCallForm', () => {
    render(<TriggerForm trigger={{ type: 'manual_api_call' }} onChange={() => {}} isNew />);
    expect(screen.getByText(/invocata manualmente/)).toBeInTheDocument();
  });

  test('dispatcher passes isNew=false down to form (readOnly enforcement)', () => {
    render(
      <TriggerForm
        trigger={{ type: 'schedule_cron', cron_expression: '* * * * *' }}
        onChange={() => {}}
        isNew={false}
      />
    );
    expect(screen.getByLabelText(/Espressione cron/i)).toHaveAttribute('readonly');
  });
});
