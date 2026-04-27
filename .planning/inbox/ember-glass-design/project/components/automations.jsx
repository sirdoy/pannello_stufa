// Automations — list + creation/edit flow with nested AND/OR conditions and multiple actions

const { useState: useAutoState } = React;

// ─── Catalog (mirror of automations.md spec) ───
const TRIGGER_TYPES = [
  { id: 'schedule_cron',                  label: 'Pianificazione',         Icon: IconClock,    tone: '#5eafff', desc: 'Ora o cron schedule' },
  { id: 'sensor_state_change',            label: 'Cambio stato sensore',   Icon: IconZap,      tone: '#ffb84a', desc: 'Quando un sensore cambia stato' },
  { id: 'sensor_threshold',               label: 'Soglia sensore',         Icon: IconThermo,   tone: '#b080ff', desc: 'Quando un valore supera una soglia' },
  { id: 'netatmo_temperature_threshold',  label: 'Soglia temperatura',     Icon: IconThermo,   tone: '#5eafff', desc: 'Temperatura stanza Netatmo' },
  { id: 'manual_api_call',                label: 'Manuale',                Icon: IconPower,    tone: 'var(--text-2)', desc: 'Attivata solo via app o API' },
];

const CONDITION_TYPES = [
  { id: 'time_window',       label: 'Fascia oraria',          Icon: IconClock,   tone: '#5eafff' },
  { id: 'device_state',      label: 'Stato dispositivo',      Icon: IconHome,    tone: '#ffb84a' },
  { id: 'temperature_range', label: 'Intervallo temperatura', Icon: IconThermo,  tone: '#b080ff' },
  { id: 'always_true',       label: 'Sempre vero',            Icon: IconCheck,   tone: 'var(--text-2)' },
];

const ACTION_TYPES = [
  { id: 'netatmo_set_room_temp',   label: 'Imposta temp. stanza', Icon: IconThermo,  tone: '#5eafff' },
  { id: 'netatmo_set_home_mode',   label: 'Modalità casa',        Icon: IconHome,    tone: '#ffb84a' },
  { id: 'netatmo_switch_schedule', label: 'Cambia programma',     Icon: IconCalendar,tone: '#b080ff' },
  { id: 'stove_set_power',         label: 'Livello stufa',        Icon: IconFlame,   tone: 'var(--accent)' },
  { id: 'light_set',               label: 'Controllo luce',       Icon: IconBulb,    tone: '#f5c84a' },
  { id: 'plug_toggle',             label: 'Toggle presa',         Icon: IconPlug,    tone: '#ffb84a' },
  { id: 'sonos_control',           label: 'Controllo Sonos',      Icon: IconMusic,   tone: '#b080ff' },
  { id: 'http_webhook',            label: 'Webhook HTTP',         Icon: IconZap,     tone: '#5eafff' },
  { id: 'log_event',               label: 'Scrivi log',           Icon: IconAlert,   tone: 'var(--text-2)' },
];

// ─── Mock existing automations (rich format) ───
const INITIAL_AUTOMATIONS = [
  {
    id: 1, name: 'Risveglio', desc: 'Stufa a 22° e tapparelle su alle 6:30',
    Icon: IconSun, tone: '#ffb84a', enabled: true,
    trigger: { type: 'schedule_cron', cron: '30 6 * * 1-5' },
    conditions: { op: 'AND', items: [{ kind: 'cond', type: 'time_window', start: '06:30', end: '09:00' }] },
    actions: [
      { type: 'netatmo_set_room_temp', room: 'Soggiorno', mode: 'manual', temp: 22 },
      { type: 'stove_set_power', level: 3 },
    ],
    cooldown: { min_interval: 3600, max_per_hour: 1 },
    lastRun: '2h fa',
  },
  {
    id: 2, name: 'Partenza', desc: 'Quando tutti escono, spegni tutto',
    Icon: IconHome, tone: '#5eafff', enabled: true,
    trigger: { type: 'sensor_state_change', sensor: 'presenza_casa', from: 'home', to: 'away' },
    conditions: { op: 'AND', items: [] },
    actions: [
      { type: 'netatmo_set_home_mode', mode: 'away' },
      { type: 'light_set', target: 'all', on: false },
      { type: 'plug_toggle', plug: 'TV + console', on: false },
    ],
    cooldown: { min_interval: 300, max_per_hour: 0 },
    lastRun: 'ieri',
  },
  {
    id: 3, name: 'Auto-boost freddo', desc: 'Se fuori < 0° E casa < 20°, stufa livello 4',
    Icon: IconZap, tone: '#5eafff', enabled: true,
    trigger: { type: 'netatmo_temperature_threshold', room: 'Esterno', op: 'lt', threshold: 0 },
    conditions: {
      op: 'AND',
      items: [
        { kind: 'cond', type: 'temperature_range', min: null, max: 20 },
        { kind: 'cond', type: 'time_window', start: '05:00', end: '23:00' },
      ],
    },
    actions: [{ type: 'stove_set_power', level: 4 }],
    cooldown: { min_interval: 1800, max_per_hour: 2 },
    lastRun: '3g fa',
  },
  {
    id: 4, name: 'Notte', desc: 'Luci giù, stufa eco dalle 23:00',
    Icon: IconMoon, tone: '#b080ff', enabled: true,
    trigger: { type: 'schedule_cron', cron: '0 23 * * *' },
    conditions: { op: 'AND', items: [] },
    actions: [
      { type: 'light_set', target: 'all', on: false },
      { type: 'stove_set_power', level: 1 },
    ],
    cooldown: { min_interval: 0, max_per_hour: 0 },
    lastRun: 'oggi 23:00',
  },
  {
    id: 5, name: 'Cena', desc: 'Luci cucina al 40%, Sonos jazz',
    Icon: IconMusic, tone: 'var(--accent)', enabled: false,
    trigger: { type: 'manual_api_call' },
    conditions: { op: 'AND', items: [] },
    actions: [
      { type: 'light_set', target: 'Cucina', on: true, brightness: 40 },
      { type: 'sonos_control', group: 'Cucina', action: 'play', playlist: 'Jazz Dinner' },
    ],
    cooldown: { min_interval: 0, max_per_hour: 0 },
    lastRun: 'mai',
  },
];

// ─── Main tab ───
const AutomationsTab = () => {
  const [items, setItems] = useAutoState(INITIAL_AUTOMATIONS);
  const [editing, setEditing] = useAutoState(null); // automation object being edited/created

  const active = items.filter(a => a.enabled).length;

  const toggleAutomation = (id) => setItems((xs) => xs.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));

  const saveAutomation = (auto) => {
    setItems((xs) => {
      const exists = xs.find(x => x.id === auto.id);
      return exists ? xs.map(x => x.id === auto.id ? auto : x) : [...xs, auto];
    });
    setEditing(null);
  };

  const createNew = () => {
    setEditing({
      id: Date.now(), name: '', desc: '', Icon: IconZap, tone: 'var(--accent)', enabled: true,
      trigger: { type: 'schedule_cron', cron: '0 8 * * *' },
      conditions: { op: 'AND', items: [] },
      actions: [],
      cooldown: { min_interval: 0, max_per_hour: 0 },
      lastRun: 'mai',
      _new: true,
    });
  };

  return (
    <>
      <div style={{ paddingTop: 70, paddingBottom: 20 }}>
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{active} di {items.length} attive</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.8 }}>Automazioni</div>
          </div>
          <button onClick={createNew} style={{
            height: 38, padding: '0 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 16px color-mix(in oklab, var(--accent) 40%, transparent)',
          }}>
            <IconPlus size={14} sw={2.6} /> Nuova
          </button>
        </div>
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((a) => (
            <AutomationRow key={a.id} automation={a}
                           onToggle={() => toggleAutomation(a.id)}
                           onOpen={() => setEditing(a)} />
          ))}
          {items.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
              Nessuna automazione. Tocca <b>Nuova</b> per crearne una.
            </div>
          )}
        </div>
      </div>

      <AutomationEditor
        open={!!editing}
        automation={editing}
        onClose={() => setEditing(null)}
        onSave={saveAutomation}
      />
    </>
  );
};

// ─── List row ───
const AutomationRow = ({ automation: a, onToggle, onOpen }) => (
  <div onClick={onOpen} style={{
    position: 'relative', borderRadius: 'var(--r-card)', padding: 14, cursor: 'pointer',
    background: a.enabled
      ? `linear-gradient(135deg, color-mix(in oklab, ${a.tone} 10%, rgba(255,255,255,0.04)) 0%, rgba(255,255,255,0.03) 100%)`
      : 'rgba(255,255,255,0.03)',
    border: `0.5px solid ${a.enabled ? `color-mix(in oklab, ${a.tone} 22%, rgba(255,255,255,0.06))` : 'rgba(255,255,255,0.06)'}`,
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: a.enabled ? `color-mix(in oklab, ${a.tone} 22%, transparent)` : 'rgba(255,255,255,0.05)',
        color: a.enabled ? a.tone : 'rgba(255,255,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `0.5px solid ${a.enabled ? `color-mix(in oklab, ${a.tone} 30%, transparent)` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: a.enabled ? `0 0 12px color-mix(in oklab, ${a.tone} 30%, transparent)` : 'none',
      }}>
        <a.Icon size={18} sw={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{a.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {a.desc}
        </div>
      </div>
      <InlineToggle on={a.enabled} color={a.tone} onChange={(e) => { e.stopPropagation(); onToggle(); }} />
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <Pill tone={a.tone}>
        {describeTrigger(a.trigger)}
      </Pill>
      {countConditions(a.conditions) > 0 && (
        <Pill>{countConditions(a.conditions)} condizion{countConditions(a.conditions) === 1 ? 'e' : 'i'}</Pill>
      )}
      <Pill>{a.actions.length} azion{a.actions.length === 1 ? 'e' : 'i'}</Pill>
      <div style={{ flex: 1 }} />
      <Pill muted>{a.lastRun}</Pill>
    </div>
  </div>
);

const Pill = ({ children, tone, muted }) => (
  <div style={{
    padding: '4px 9px', borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: 0.2,
    background: tone
      ? `color-mix(in oklab, ${tone} 16%, transparent)`
      : muted ? 'transparent' : 'rgba(255,255,255,0.06)',
    color: tone ? tone : muted ? 'var(--text-2)' : '#fff',
    border: tone
      ? `0.5px solid color-mix(in oklab, ${tone} 25%, transparent)`
      : '0.5px solid rgba(255,255,255,0.08)',
  }}>{children}</div>
);

function describeTrigger(t) {
  if (t.type === 'schedule_cron') return `⏰ ${t.cron}`;
  if (t.type === 'sensor_state_change') return `→ ${t.sensor}`;
  if (t.type === 'sensor_threshold') return `${t.sensor} ${t.op} ${t.threshold}`;
  if (t.type === 'netatmo_temperature_threshold') return `${t.room} ${t.op} ${t.threshold}°`;
  if (t.type === 'manual_api_call') return 'Manuale';
  return t.type;
}

function countConditions(group) {
  if (!group || !group.items) return 0;
  let n = 0;
  group.items.forEach((it) => {
    if (it.kind === 'cond') n++;
    else if (it.kind === 'group') n += countConditions(it);
  });
  return n;
}

// ─── Editor sheet ───
const AutomationEditor = ({ open, automation, onClose, onSave }) => {
  const [draft, setDraft] = useAutoState(null);
  const [activeSection, setActiveSection] = useAutoState('trigger');

  // reset draft when automation changes
  React.useEffect(() => {
    if (automation) { setDraft(automation); setActiveSection('trigger'); }
  }, [automation?.id, automation?._new]);

  if (!draft) return <Sheet open={false} onClose={onClose} />;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Sheet open={open} onClose={onClose} title={draft._new ? 'Nuova automazione' : 'Modifica automazione'}>
      {/* Name */}
      <div style={{ marginBottom: 18 }}>
        <FieldLabel>Nome</FieldLabel>
        <TextInput value={draft.name} placeholder="Es. Buongiorno" onChange={(v) => update({ name: v })} />
        <div style={{ height: 10 }} />
        <FieldLabel>Descrizione</FieldLabel>
        <TextInput value={draft.desc} placeholder="Breve descrizione" onChange={(v) => update({ desc: v })} />
      </div>

      {/* Section tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
        padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.06)', marginBottom: 16,
      }}>
        {[
          { id: 'trigger', label: 'Trigger' },
          { id: 'conditions', label: 'Condizioni', badge: countConditions(draft.conditions) },
          { id: 'actions', label: 'Azioni', badge: draft.actions.length },
          { id: 'advanced', label: 'Avanzate' },
        ].map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: activeSection === s.id ? 'rgba(255,255,255,0.09)' : 'transparent',
            color: activeSection === s.id ? '#fff' : 'var(--text-2)',
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {s.label}
            {s.badge > 0 && (
              <span style={{
                background: 'var(--accent)', color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999,
              }}>{s.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      {activeSection === 'trigger' && <TriggerSection trigger={draft.trigger} onChange={(t) => update({ trigger: t })} />}
      {activeSection === 'conditions' && <ConditionsSection group={draft.conditions} onChange={(c) => update({ conditions: c })} />}
      {activeSection === 'actions' && <ActionsSection actions={draft.actions} onChange={(a) => update({ actions: a })} />}
      {activeSection === 'advanced' && <AdvancedSection cooldown={draft.cooldown} onChange={(c) => update({ cooldown: c })} />}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 20 }}>
        <button onClick={onClose} style={{
          flex: 1, height: 46, borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Annulla</button>
        <button onClick={() => onSave(draft)} disabled={!draft.name || draft.actions.length === 0} style={{
          flex: 2, height: 46, borderRadius: 12, border: 'none',
          background: (!draft.name || draft.actions.length === 0) ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
          color: '#fff', fontWeight: 700, fontSize: 14,
          cursor: (!draft.name || draft.actions.length === 0) ? 'not-allowed' : 'pointer',
          boxShadow: (!draft.name || draft.actions.length === 0) ? 'none' : '0 4px 20px color-mix(in oklab, var(--accent) 40%, transparent)',
        }}>{draft._new ? 'Crea automazione' : 'Salva modifiche'}</button>
      </div>
    </Sheet>
  );
};

// ─── Trigger section ───
const TriggerSection = ({ trigger, onChange }) => {
  const meta = TRIGGER_TYPES.find(t => t.id === trigger.type) || TRIGGER_TYPES[0];
  return (
    <>
      <FieldLabel>Quando fire?</FieldLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {TRIGGER_TYPES.map((t) => (
          <TypeTile key={t.id} meta={t} selected={trigger.type === t.id}
                    onClick={() => onChange(defaultTrigger(t.id))} />
        ))}
      </div>
      <div style={{
        padding: 14, borderRadius: 14,
        background: `color-mix(in oklab, ${meta.tone} 8%, rgba(255,255,255,0.03))`,
        border: `0.5px solid color-mix(in oklab, ${meta.tone} 20%, rgba(255,255,255,0.06))`,
      }}>
        <TriggerConfigForm trigger={trigger} onChange={onChange} />
      </div>
    </>
  );
};

const TriggerConfigForm = ({ trigger, onChange }) => {
  if (trigger.type === 'schedule_cron') {
    return (
      <>
        <FieldLabel>Espressione cron</FieldLabel>
        <TextInput value={trigger.cron} mono onChange={(v) => onChange({ ...trigger, cron: v })} placeholder="0 22 * * *" />
        <CronHint cron={trigger.cron} />
      </>
    );
  }
  if (trigger.type === 'sensor_state_change') {
    return (
      <>
        <FieldLabel>Sensore</FieldLabel>
        <TextInput value={trigger.sensor} onChange={(v) => onChange({ ...trigger, sensor: v })} placeholder="presenza_casa" />
        <TwoCol>
          <div><FieldLabel>Da</FieldLabel><TextInput value={trigger.from || ''} onChange={(v) => onChange({ ...trigger, from: v })} placeholder="home" /></div>
          <div><FieldLabel>A</FieldLabel><TextInput value={trigger.to || ''} onChange={(v) => onChange({ ...trigger, to: v })} placeholder="away" /></div>
        </TwoCol>
      </>
    );
  }
  if (trigger.type === 'sensor_threshold' || trigger.type === 'netatmo_temperature_threshold') {
    const isNetatmo = trigger.type === 'netatmo_temperature_threshold';
    return (
      <>
        <FieldLabel>{isNetatmo ? 'Stanza' : 'Sensore'}</FieldLabel>
        <TextInput value={isNetatmo ? trigger.room : trigger.sensor}
                   onChange={(v) => onChange({ ...trigger, [isNetatmo ? 'room' : 'sensor']: v })}
                   placeholder={isNetatmo ? 'Soggiorno' : 'umidità_bagno'} />
        <TwoCol>
          <div>
            <FieldLabel>Operatore</FieldLabel>
            <SegmentedControl value={trigger.op} onChange={(v) => onChange({ ...trigger, op: v })}
                              options={[{v:'gt',l:'>'}, {v:'gte',l:'≥'}, {v:'lt',l:'<'}, {v:'lte',l:'≤'}]} />
          </div>
          <div>
            <FieldLabel>Soglia</FieldLabel>
            <NumInput value={trigger.threshold} onChange={(v) => onChange({ ...trigger, threshold: v })} />
          </div>
        </TwoCol>
      </>
    );
  }
  if (trigger.type === 'manual_api_call') {
    return <div style={{ fontSize: 12, color: 'var(--text-2)', padding: '6px 0' }}>
      Questa automazione si avvia solo quando viene invocata manualmente dall'app o via API.
    </div>;
  }
  return null;
};

function defaultTrigger(type) {
  if (type === 'schedule_cron') return { type, cron: '0 8 * * *' };
  if (type === 'sensor_state_change') return { type, sensor: '', from: '', to: '' };
  if (type === 'sensor_threshold') return { type, sensor: '', op: 'gt', threshold: 0 };
  if (type === 'netatmo_temperature_threshold') return { type, room: 'Soggiorno', op: 'lt', threshold: 18 };
  if (type === 'manual_api_call') return { type };
  return { type };
}

// ─── Conditions section — nested AND/OR groups ───
const ConditionsSection = ({ group, onChange }) => {
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
        Le condizioni devono essere soddisfatte affinché le azioni vengano eseguite. Puoi combinarle con <b>E</b>/<b>O</b> e annidare gruppi.
      </div>
      <ConditionGroup group={group} onChange={onChange} depth={0} canRemove={false} />
    </>
  );
};

const ConditionGroup = ({ group, onChange, depth, canRemove, onRemove }) => {
  const toggleOp = () => onChange({ ...group, op: group.op === 'AND' ? 'OR' : 'AND' });
  const addCondition = () => onChange({ ...group, items: [...group.items, { kind: 'cond', type: 'time_window', start: '08:00', end: '20:00' }] });
  const addGroup = () => onChange({ ...group, items: [...group.items, { kind: 'group', op: 'OR', items: [] }] });
  const updateItem = (i, next) => onChange({ ...group, items: group.items.map((x, idx) => idx === i ? next : x) });
  const removeItem = (i) => onChange({ ...group, items: group.items.filter((_, idx) => idx !== i) });

  const opColor = group.op === 'AND' ? '#5eafff' : '#ffb84a';
  const leftBar = depth > 0 ? `2px solid color-mix(in oklab, ${opColor} 35%, transparent)` : 'none';

  return (
    <div style={{
      borderLeft: leftBar,
      paddingLeft: depth > 0 ? 12 : 0,
      marginTop: depth > 0 ? 4 : 0,
    }}>
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button onClick={toggleOp} style={{
          padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: `color-mix(in oklab, ${opColor} 20%, transparent)`,
          color: opColor, fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
          border: `0.5px solid color-mix(in oklab, ${opColor} 35%, transparent)`,
        }}>
          {group.op === 'AND' ? 'TUTTE (E)' : 'ALMENO UNA (O)'}
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
          {group.items.length === 0 ? 'vuoto' : `${group.items.length} element${group.items.length === 1 ? 'o' : 'i'}`}
        </div>
        <div style={{ flex: 1 }} />
        {canRemove && (
          <button onClick={onRemove} style={{
            width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'rgba(255,102,118,0.12)', color: '#ff6676',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconX size={12} sw={2.4} /></button>
        )}
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 0 8px' }}>
                <div style={{ height: 1, flex: 0, width: 12, background: `color-mix(in oklab, ${opColor} 40%, transparent)` }} />
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                  color: opColor,
                }}>{group.op === 'AND' ? 'E' : 'O'}</div>
                <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            )}
            {it.kind === 'cond' ? (
              <ConditionItem cond={it} onChange={(next) => updateItem(i, next)} onRemove={() => removeItem(i)} />
            ) : (
              <ConditionGroup group={it} depth={depth + 1}
                              onChange={(next) => updateItem(i, next)}
                              canRemove={true} onRemove={() => removeItem(i)} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Add buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: group.items.length ? 10 : 0 }}>
        <AddChip onClick={addCondition}>+ Condizione</AddChip>
        {depth < 2 && <AddChip onClick={addGroup}>+ Gruppo {group.op === 'AND' ? 'O' : 'E'}</AddChip>}
      </div>
    </div>
  );
};

const ConditionItem = ({ cond, onChange, onRemove }) => {
  const meta = CONDITION_TYPES.find(c => c.id === cond.type) || CONDITION_TYPES[0];
  return (
    <div style={{
      padding: 10, borderRadius: 12,
      background: `color-mix(in oklab, ${meta.tone} 8%, rgba(255,255,255,0.03))`,
      border: `0.5px solid color-mix(in oklab, ${meta.tone} 18%, rgba(255,255,255,0.06))`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: `color-mix(in oklab, ${meta.tone} 20%, transparent)`,
          color: meta.tone,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><meta.Icon size={12} sw={2.2} /></div>
        <select value={cond.type} onChange={(e) => onChange(defaultCondition(e.target.value))}
                style={selectStyle}>
          {CONDITION_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={onRemove} style={{
          width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><IconX size={10} sw={2.4} /></button>
      </div>
      <ConditionConfigForm cond={cond} onChange={onChange} />
    </div>
  );
};

const ConditionConfigForm = ({ cond, onChange }) => {
  if (cond.type === 'time_window') {
    return (
      <TwoCol>
        <div><FieldLabel small>Da</FieldLabel><TextInput value={cond.start} onChange={(v) => onChange({ ...cond, start: v })} placeholder="08:00" /></div>
        <div><FieldLabel small>A</FieldLabel><TextInput value={cond.end} onChange={(v) => onChange({ ...cond, end: v })} placeholder="20:00" /></div>
      </TwoCol>
    );
  }
  if (cond.type === 'device_state') {
    return (
      <TwoCol>
        <div><FieldLabel small>Dispositivo</FieldLabel><TextInput value={cond.sensor} onChange={(v) => onChange({ ...cond, sensor: v })} placeholder="stufa" /></div>
        <div><FieldLabel small>Stato</FieldLabel><TextInput value={cond.expected_state} onChange={(v) => onChange({ ...cond, expected_state: v })} placeholder="on" /></div>
      </TwoCol>
    );
  }
  if (cond.type === 'temperature_range') {
    return (
      <TwoCol>
        <div><FieldLabel small>Min °C</FieldLabel><NumInput value={cond.min} onChange={(v) => onChange({ ...cond, min: v })} allowNull /></div>
        <div><FieldLabel small>Max °C</FieldLabel><NumInput value={cond.max} onChange={(v) => onChange({ ...cond, max: v })} allowNull /></div>
      </TwoCol>
    );
  }
  if (cond.type === 'always_true') {
    return <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Nessun parametro — sempre vero.</div>;
  }
  return null;
};

function defaultCondition(type) {
  if (type === 'time_window') return { kind: 'cond', type, start: '08:00', end: '20:00' };
  if (type === 'device_state') return { kind: 'cond', type, sensor: '', expected_state: '' };
  if (type === 'temperature_range') return { kind: 'cond', type, min: null, max: null };
  return { kind: 'cond', type: 'always_true' };
}

// ─── Actions section ───
const ActionsSection = ({ actions, onChange }) => {
  const [picking, setPicking] = useAutoState(false);

  const add = (type) => { onChange([...actions, defaultAction(type)]); setPicking(false); };
  const update = (i, next) => onChange(actions.map((a, idx) => idx === i ? next : a));
  const remove = (i) => onChange(actions.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= actions.length) return;
    const next = [...actions]; [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
        Quando il trigger scatta e le condizioni sono verificate, queste azioni vengono eseguite <b>in sequenza</b>.
      </div>

      {actions.length === 0 && (
        <div style={{
          padding: 24, borderRadius: 14, textAlign: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px dashed rgba(255,255,255,0.12)',
          color: 'var(--text-2)', fontSize: 13, marginBottom: 12,
        }}>Nessuna azione. Aggiungine almeno una.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {actions.map((a, i) => (
          <ActionItem key={i} action={a} index={i} total={actions.length}
                      onChange={(next) => update(i, next)} onRemove={() => remove(i)} onMove={(dir) => move(i, dir)} />
        ))}
      </div>

      {picking ? (
        <div style={{
          padding: 10, borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8, padding: '0 4px' }}>Scegli tipo azione</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {ACTION_TYPES.map((t) => (
              <button key={t.id} onClick={() => add(t.id)} style={{
                padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                color: '#fff',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 500, textAlign: 'left',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: `color-mix(in oklab, ${t.tone} 20%, transparent)`,
                  color: t.tone,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><t.Icon size={12} sw={2.2} /></div>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => setPicking(false)} style={{
            marginTop: 8, width: '100%', height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)', fontSize: 12, fontWeight: 600,
          }}>Annulla</button>
        </div>
      ) : (
        <button onClick={() => setPicking(true)} style={{
          width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px dashed rgba(255,255,255,0.15)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><IconPlus size={14} sw={2.4} /> Aggiungi azione</button>
      )}
    </>
  );
};

const ActionItem = ({ action, index, total, onChange, onRemove, onMove }) => {
  const meta = ACTION_TYPES.find(a => a.id === action.type) || ACTION_TYPES[0];
  return (
    <div style={{
      padding: 12, borderRadius: 12,
      background: `color-mix(in oklab, ${meta.tone} 8%, rgba(255,255,255,0.03))`,
      border: `0.5px solid color-mix(in oklab, ${meta.tone} 18%, rgba(255,255,255,0.06))`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        }}>{index + 1}</div>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `color-mix(in oklab, ${meta.tone} 20%, transparent)`,
          color: meta.tone,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><meta.Icon size={13} sw={2.2} /></div>
        <select value={action.type} onChange={(e) => onChange(defaultAction(e.target.value))} style={selectStyle}>
          {ACTION_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn disabled={index === 0} onClick={() => onMove(-1)}><IconChevU size={10} sw={2.4} /></IconBtn>
          <IconBtn disabled={index === total - 1} onClick={() => onMove(1)}><IconChevD size={10} sw={2.4} /></IconBtn>
          <IconBtn onClick={onRemove}><IconX size={10} sw={2.4} /></IconBtn>
        </div>
      </div>
      <ActionConfigForm action={action} onChange={onChange} />
    </div>
  );
};

const IconBtn = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: 24, height: 24, borderRadius: 6, border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    background: 'rgba(255,255,255,0.05)',
    color: disabled ? 'rgba(255,255,255,0.2)' : 'var(--text-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>{children}</button>
);

const ActionConfigForm = ({ action, onChange }) => {
  const T = action.type;
  if (T === 'netatmo_set_room_temp') {
    return (
      <>
        <TwoCol>
          <div><FieldLabel small>Stanza</FieldLabel><TextInput value={action.room} onChange={(v) => onChange({ ...action, room: v })} placeholder="Soggiorno" /></div>
          <div><FieldLabel small>Temp °C</FieldLabel><NumInput value={action.temp} onChange={(v) => onChange({ ...action, temp: v })} /></div>
        </TwoCol>
        <FieldLabel small>Modalità</FieldLabel>
        <SegmentedControl value={action.mode} onChange={(v) => onChange({ ...action, mode: v })}
                          options={[{v:'manual',l:'Manuale'},{v:'home',l:'Home'}]} />
      </>
    );
  }
  if (T === 'netatmo_set_home_mode') {
    return (
      <>
        <FieldLabel small>Modalità casa</FieldLabel>
        <SegmentedControl value={action.mode} onChange={(v) => onChange({ ...action, mode: v })}
                          options={[{v:'schedule',l:'Schedule'},{v:'away',l:'Fuori'},{v:'hg',l:'Antigelo'}]} />
      </>
    );
  }
  if (T === 'netatmo_switch_schedule') {
    return (
      <>
        <FieldLabel small>Programma</FieldLabel>
        <TextInput value={action.schedule_id} onChange={(v) => onChange({ ...action, schedule_id: v })} placeholder="weekend" />
      </>
    );
  }
  if (T === 'stove_set_power') {
    return (
      <>
        <FieldLabel small>Livello fiamma</FieldLabel>
        <SegmentedControl value={String(action.level)} onChange={(v) => onChange({ ...action, level: parseInt(v) })}
                          options={[{v:'0',l:'Off'},{v:'1',l:'1'},{v:'2',l:'2'},{v:'3',l:'3'},{v:'4',l:'4'},{v:'5',l:'5'}]} />
      </>
    );
  }
  if (T === 'light_set') {
    return (
      <>
        <TwoCol>
          <div><FieldLabel small>Target</FieldLabel><TextInput value={action.target} onChange={(v) => onChange({ ...action, target: v })} placeholder="all | Cucina" /></div>
          <div><FieldLabel small>Luminosità %</FieldLabel><NumInput value={action.brightness ?? 100} onChange={(v) => onChange({ ...action, brightness: v })} /></div>
        </TwoCol>
        <FieldLabel small>Stato</FieldLabel>
        <SegmentedControl value={action.on ? 'on' : 'off'} onChange={(v) => onChange({ ...action, on: v === 'on' })}
                          options={[{v:'on',l:'Accendi'},{v:'off',l:'Spegni'}]} />
      </>
    );
  }
  if (T === 'plug_toggle') {
    return (
      <>
        <FieldLabel small>Presa</FieldLabel>
        <TextInput value={action.plug} onChange={(v) => onChange({ ...action, plug: v })} placeholder="Caricatore Tesla" />
        <FieldLabel small>Stato</FieldLabel>
        <SegmentedControl value={action.on ? 'on' : 'off'} onChange={(v) => onChange({ ...action, on: v === 'on' })}
                          options={[{v:'on',l:'Accendi'},{v:'off',l:'Spegni'}]} />
      </>
    );
  }
  if (T === 'sonos_control') {
    return (
      <>
        <TwoCol>
          <div><FieldLabel small>Gruppo</FieldLabel><TextInput value={action.group} onChange={(v) => onChange({ ...action, group: v })} placeholder="Cucina" /></div>
          <div><FieldLabel small>Playlist</FieldLabel><TextInput value={action.playlist || ''} onChange={(v) => onChange({ ...action, playlist: v })} placeholder="Jazz" /></div>
        </TwoCol>
        <FieldLabel small>Azione</FieldLabel>
        <SegmentedControl value={action.action} onChange={(v) => onChange({ ...action, action: v })}
                          options={[{v:'play',l:'Play'},{v:'pause',l:'Pausa'},{v:'stop',l:'Stop'}]} />
      </>
    );
  }
  if (T === 'http_webhook') {
    return (
      <>
        <FieldLabel small>URL</FieldLabel>
        <TextInput value={action.url} mono onChange={(v) => onChange({ ...action, url: v })} placeholder="https://..." />
        <FieldLabel small>Metodo</FieldLabel>
        <SegmentedControl value={action.method} onChange={(v) => onChange({ ...action, method: v })}
                          options={[{v:'GET',l:'GET'},{v:'POST',l:'POST'}]} />
      </>
    );
  }
  if (T === 'log_event') {
    return (
      <>
        <FieldLabel small>Messaggio</FieldLabel>
        <TextInput value={action.message} onChange={(v) => onChange({ ...action, message: v })} placeholder="Stufa accesa alle 6:30" />
      </>
    );
  }
  return null;
};

function defaultAction(type) {
  if (type === 'netatmo_set_room_temp')   return { type, room: 'Soggiorno', mode: 'manual', temp: 21 };
  if (type === 'netatmo_set_home_mode')   return { type, mode: 'schedule' };
  if (type === 'netatmo_switch_schedule') return { type, schedule_id: '' };
  if (type === 'stove_set_power')         return { type, level: 3 };
  if (type === 'light_set')               return { type, target: 'all', on: true, brightness: 80 };
  if (type === 'plug_toggle')             return { type, plug: '', on: true };
  if (type === 'sonos_control')           return { type, group: 'Soggiorno', action: 'play', playlist: '' };
  if (type === 'http_webhook')            return { type, url: '', method: 'POST' };
  if (type === 'log_event')               return { type, message: '' };
  return { type };
}

// ─── Advanced section ───
const AdvancedSection = ({ cooldown, onChange }) => (
  <>
    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
      Limita la frequenza di esecuzione per evitare cicli o eccessi di eventi.
    </div>
    <FieldLabel>Intervallo minimo fra attivazioni</FieldLabel>
    <NumInput value={cooldown.min_interval} unit="sec" onChange={(v) => onChange({ ...cooldown, min_interval: v })} />
    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>0 = nessun limite</div>

    <div style={{ height: 14 }} />

    <FieldLabel>Massimo attivazioni/ora</FieldLabel>
    <NumInput value={cooldown.max_per_hour} onChange={(v) => onChange({ ...cooldown, max_per_hour: v })} />
    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>0 = illimitato</div>
  </>
);

// ─── Building blocks ───
const FieldLabel = ({ children, small }) => (
  <div style={{ fontSize: small ? 10 : 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, mono }) => (
  <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
         style={{
           width: '100%', height: 38, borderRadius: 9,
           background: 'rgba(255,255,255,0.05)',
           border: '0.5px solid rgba(255,255,255,0.08)',
           color: '#fff', padding: '0 11px',
           fontSize: 13, outline: 'none',
           fontFamily: mono ? 'ui-monospace, SF Mono, monospace' : 'inherit',
         }} />
);

const NumInput = ({ value, onChange, unit, allowNull }) => (
  <div style={{ position: 'relative' }}>
    <input type="number" value={value === null ? '' : value}
           onChange={(e) => {
             const v = e.target.value;
             if (v === '' && allowNull) onChange(null);
             else onChange(parseFloat(v) || 0);
           }}
           style={{
             width: '100%', height: 38, borderRadius: 9,
             background: 'rgba(255,255,255,0.05)',
             border: '0.5px solid rgba(255,255,255,0.08)',
             color: '#fff', padding: '0 36px 0 11px',
             fontSize: 13, outline: 'none', fontVariantNumeric: 'tabular-nums',
           }} />
    {unit && <div style={{ position: 'absolute', right: 11, top: 0, height: 38, display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-2)' }}>{unit}</div>}
  </div>
);

const SegmentedControl = ({ value, onChange, options }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 3,
    padding: 3, borderRadius: 9,
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.08)',
  }}>
    {options.map((o) => (
      <button key={o.v} onClick={() => onChange(o.v)} style={{
        padding: '7px 4px', borderRadius: 7, border: 'none', cursor: 'pointer',
        background: value === o.v ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: value === o.v ? '#fff' : 'var(--text-2)',
        fontSize: 12, fontWeight: 600,
      }}>{o.l}</button>
    ))}
  </div>
);

const TwoCol = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>{children}</div>
);

const TypeTile = ({ meta, selected, onClick }) => (
  <button onClick={onClick} style={{
    padding: 10, borderRadius: 11, border: 'none', cursor: 'pointer', textAlign: 'left',
    background: selected
      ? `color-mix(in oklab, ${meta.tone} 18%, transparent)`
      : 'rgba(255,255,255,0.04)',
    border: `0.5px solid ${selected ? `color-mix(in oklab, ${meta.tone} 40%, transparent)` : 'rgba(255,255,255,0.06)'}`,
    boxShadow: selected ? `0 0 14px color-mix(in oklab, ${meta.tone} 25%, transparent)` : 'none',
  }}>
    <div style={{
      width: 26, height: 26, borderRadius: 7,
      background: `color-mix(in oklab, ${meta.tone} 22%, transparent)`,
      color: meta.tone,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 6,
    }}><meta.Icon size={13} sw={2.2} /></div>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{meta.label}</div>
    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.3 }}>{meta.desc}</div>
  </button>
);

const AddChip = ({ onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '7px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px dashed rgba(255,255,255,0.15)',
    color: '#fff', fontSize: 11, fontWeight: 600,
  }}>{children}</button>
);

const CronHint = ({ cron }) => {
  const parts = (cron || '').trim().split(/\s+/);
  const labels = ['min', 'ora', 'giorno', 'mese', 'giorno sett.'];
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
      {labels.map((l, i) => (
        <div key={i} style={{
          flex: 1, padding: '4px 6px', borderRadius: 6,
          background: 'rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
          <div style={{ fontSize: 12, color: '#fff', fontFamily: 'ui-monospace, monospace', marginTop: 1 }}>{parts[i] || '—'}</div>
        </div>
      ))}
    </div>
  );
};

const selectStyle = {
  flex: 1, height: 28, borderRadius: 7,
  background: 'rgba(255,255,255,0.05)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  color: '#fff', padding: '0 8px', fontSize: 12, fontWeight: 500,
  outline: 'none', cursor: 'pointer',
};

Object.assign(window, { AutomationsTab });
