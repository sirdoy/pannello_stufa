'use client';

import { clearSemiManualMode } from '@/lib/schedulerApiClient';
import { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Banner from '../ui/Banner';
import {
  getSandboxStoveState,
  updateSandboxStoveState,
  getSandboxMaintenance,
  updateSandboxMaintenanceHours,
  resetSandboxMaintenance,
  setSandboxError,
  getSandboxSettings,
  updateSandboxSettings,
  getSandboxHistory,
  resetSandbox,
  STOVE_STATES,
  SANDBOX_ERRORS,
  isLocalEnvironment,
  isSandboxEnabled,
} from '../../../lib/sandboxService';
import {
  getFullSchedulerMode,
  setSchedulerMode,
  // clearSemiManualMode removed - use API
  saveSchedule,
  getSchedule,
} from '../../../lib/schedulerService';

/**
 * Pannello di controllo Sandbox per testing locale
 *
 * Visibile SOLO in localhost quando sandbox è abilitato
 */
export default function SandboxPanel() {
  const [isLocal, setIsLocal] = useState(false);
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [stoveState, setStoveState] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Form states
  const [newHours, setNewHours] = useState(0);
  const [newPower, setNewPower] = useState(3);
  const [newFan, setNewFan] = useState(0);
  const [newTemperature, setNewTemperature] = useState(20);

  // Scheduler states
  const [schedulerMode, setSchedulerModeState] = useState({ enabled: false, semiManual: false });
  const [testIntervalStart, setTestIntervalStart] = useState('');
  const [testIntervalEnd, setTestIntervalEnd] = useState('');
  const [testIntervalPower, setTestIntervalPower] = useState(3);
  const [testIntervalFan, setTestIntervalFan] = useState(3);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [state, maint, sett, hist, schedMode] = await Promise.all([
        getSandboxStoveState(),
        getSandboxMaintenance(),
        getSandboxSettings(),
        getSandboxHistory(),
        getFullSchedulerMode(),
      ]);

      setStoveState(state);
      setMaintenance(maint);
      setSettings(sett);
      setHistory(hist);
      setSchedulerModeState(schedMode);

      // Inizializza form con valori correnti
      setNewHours(maint.hoursWorked);
      setNewPower(state.power);
      setNewFan(state.fan);
      setNewTemperature(state.temperature);

      // Inizializza intervallo di test con orario corrente + 1 ora
      const now = new Date();
      const startHour = now.getHours().toString().padStart(2, '0');
      const startMin = now.getMinutes().toString().padStart(2, '0');
      const endHour = ((now.getHours() + 2) % 24).toString().padStart(2, '0');
      setTestIntervalStart(`${startHour}:${startMin}`);
      setTestIntervalEnd(`${endHour}:${startMin}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkEnvironment = useCallback(async () => {
    const local = isLocalEnvironment();
    setIsLocal(local);

    if (local) {
      const enabled = await isSandboxEnabled();
      setSandboxEnabled(enabled);

      if (enabled) {
        await loadData();
      }
    }
    setLoading(false);
  }, [loadData]);

  useEffect(() => {
    checkEnvironment();
  }, [checkEnvironment]);

  async function handleUpdateState(updates) {
    try {
      await updateSandboxStoveState(updates);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateHours() {
    try {
      await updateSandboxMaintenanceHours(Number(newHours));
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResetMaintenance() {
    try {
      await resetSandboxMaintenance();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetError(errorKey) {
    try {
      await setSandboxError(errorKey);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateSettings(key, value) {
    try {
      await updateSandboxSettings({ [key]: value });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResetSandbox() {
    if (confirm('Reset completo sandbox? Tutte le configurazioni saranno perse.')) {
      try {
        await resetSandbox();
        await loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  }

  // Scheduler handlers
  async function handleToggleScheduler() {
    try {
      await setSchedulerMode(!schedulerMode.enabled);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearSemiManual() {
    try {
      await clearSemiManualMode();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateTestInterval() {
    try {
      // Ottieni il giorno corrente in italiano
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      const today = dayNames[new Date().getDay()];

      // Crea intervallo di test
      const testInterval = {
        start: testIntervalStart,
        end: testIntervalEnd,
        power: testIntervalPower,
        fan: testIntervalFan,
      };

      // Salva su Firebase
      await saveSchedule(today, [testInterval]);

      // Attiva automaticamente lo scheduler se non è già attivo
      if (!schedulerMode.enabled) {
        await setSchedulerMode(true);
      }

      await loadData();
      setError(null);
      alert(`✅ Intervallo di test creato per ${today}!\n${testIntervalStart} - ${testIntervalEnd} (P${testIntervalPower}, V${testIntervalFan})`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearTestInterval() {
    if (confirm('Cancellare l\'intervallo di test?')) {
      try {
        const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const today = dayNames[new Date().getDay()];
        await saveSchedule(today, []);
        await loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  }

  // Non renderizzare se non in localhost o sandbox non abilitato
  if (!isLocal || !sandboxEnabled) {
    return null;
  }

  if (loading) {
    return (
      <Card liquid className="p-6">
        <div className="text-center text-gray-400">
          Caricamento sandbox...
        </div>
      </Card>
    );
  }

  const stateColors = {
    [STOVE_STATES.OFF]: 'bg-gray-500',
    [STOVE_STATES.START]: 'bg-yellow-500',
    [STOVE_STATES.WORK]: 'bg-green-500',
    [STOVE_STATES.CLEAN]: 'bg-blue-500',
    [STOVE_STATES.FINAL]: 'bg-purple-500',
    [STOVE_STATES.ERROR]: 'bg-red-500',
  };

  return (
    <Card liquid className="p-6 space-y-6 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-pink-900/40">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
            🧪 Sandbox Mode
          </h2>
          <p className="text-sm text-purple-200">
            Ambiente di testing locale - Nessuna chiamata reale alla stufa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            liquid
            variant="secondary"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Nascondi' : 'Mostra'} History
          </Button>
          <Button
            liquid
            variant="danger"
            size="sm"
            onClick={handleResetSandbox}
          >
            Reset Sandbox
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Banner
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Stato Stufa */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">Stato Stufa</h3>

        {/* Current state indicator */}
        <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className={`w-4 h-4 rounded-full ${stateColors[stoveState?.status]} shadow-lg`} />
          <span className="text-white font-bold">{stoveState?.status}</span>
          <span className="text-purple-200 text-sm">
            Potenza: {stoveState?.power} | Ventola: {stoveState?.fan} | Temp: {stoveState?.temperature}°C
          </span>
        </div>

        {/* State buttons */}
        <div className="grid grid-cols-3 gap-2">
          {Object.values(STOVE_STATES).map((state) => (
            <Button
              key={state}
              liquid
              variant={stoveState?.status === state ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleUpdateState({ status: state })}
              className="text-xs"
            >
              {state}
            </Button>
          ))}
        </div>
      </div>

      {/* Controlli Potenza e Ventola */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
          <label className="text-sm font-semibold text-purple-200">Potenza (1-5)</label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="1"
              max="5"
              value={newPower}
              onChange={(e) => setNewPower(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold w-8 text-center text-lg">{newPower}</span>
            <Button
              liquid
              variant="primary"
              size="sm"
              onClick={() => handleUpdateState({ power: newPower })}
            >
              Set
            </Button>
          </div>
        </div>

        <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
          <label className="text-sm font-semibold text-purple-200">Ventola (0-5)</label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="0"
              max="5"
              value={newFan}
              onChange={(e) => setNewFan(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold w-8 text-center text-lg">{newFan}</span>
            <Button
              liquid
              variant="primary"
              size="sm"
              onClick={() => handleUpdateState({ fan: newFan })}
            >
              Set
            </Button>
          </div>
        </div>
      </div>

      {/* Temperatura */}
      <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
        <label className="text-sm font-semibold text-purple-200">Temperatura (°C)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="0"
            max="100"
            value={newTemperature}
            onChange={(e) => setNewTemperature(Number(e.target.value))}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold"
          />
          <Button
            liquid
            variant="primary"
            size="sm"
            onClick={() => handleUpdateState({ temperature: newTemperature })}
          >
            Set Temp
          </Button>
        </div>
      </div>

      {/* Manutenzione */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">Manutenzione</h3>

        <div className="flex items-center gap-3">
          <span className="text-purple-200">
            Ore lavorate: <span className="text-white font-bold text-lg">{maintenance?.hoursWorked}</span> / {maintenance?.maxHours}
          </span>
          {maintenance?.needsCleaning && (
            <span className="px-3 py-1 bg-red-500/30 border border-red-500/50 rounded text-red-200 text-xs font-bold">
              ⚠️ Pulizia richiesta
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="0"
            max="300"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold"
            placeholder="Ore lavorate"
          />
          <Button
            liquid
            variant="primary"
            size="sm"
            onClick={handleUpdateHours}
          >
            Set Ore
          </Button>
          <Button
            liquid
            variant="secondary"
            size="sm"
            onClick={handleResetMaintenance}
          >
            Reset
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              maintenance?.needsCleaning ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{
              width: `${Math.min((maintenance?.hoursWorked / maintenance?.maxHours) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Errori */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">Simulazione Errori</h3>

        <div className="grid grid-cols-2 gap-2">
          <Button
            liquid
            variant="secondary"
            size="sm"
            onClick={() => handleSetError('NONE')}
          >
            Nessun errore
          </Button>
          {Object.entries(SANDBOX_ERRORS).map(([key, value]) => {
            if (key === 'NONE') return null;
            return (
              <Button
                key={key}
                liquid
                variant="secondary"
                size="sm"
                onClick={() => handleSetError(key)}
                className="text-xs"
              >
                {value.code}: {value.description}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">Impostazioni Simulazione</h3>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors">
            <input
              type="checkbox"
              checked={settings?.autoProgressStates || false}
              onChange={(e) => handleUpdateSettings('autoProgressStates', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-purple-200 text-sm font-medium">
              Progressione automatica stati (START → WORK, CLEAN → FINAL → OFF)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors">
            <input
              type="checkbox"
              checked={settings?.simulateDelay || false}
              onChange={(e) => handleUpdateSettings('simulateDelay', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-purple-200 text-sm font-medium">
              Simula ritardi realistici nelle operazioni
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors">
            <input
              type="checkbox"
              checked={settings?.randomErrors || false}
              onChange={(e) => handleUpdateSettings('randomErrors', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-purple-200 text-sm font-medium">
              Genera errori casuali (per stress testing)
            </span>
          </label>
        </div>
      </div>

      {/* Scheduler Testing */}
      <div className="space-y-3 p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white drop-shadow-lg">⏰ Test Scheduler</h3>
          <div className="flex items-center gap-2">
            {schedulerMode.enabled && schedulerMode.semiManual && (
              <span className="px-2 py-1 bg-yellow-500/30 border border-yellow-500/50 rounded text-yellow-200 text-xs font-bold">
                ⚙️ SEMI-MANUAL
              </span>
            )}
            {schedulerMode.enabled && !schedulerMode.semiManual && (
              <span className="px-2 py-1 bg-green-500/30 border border-green-500/50 rounded text-green-200 text-xs font-bold">
                ⏰ AUTO
              </span>
            )}
            {!schedulerMode.enabled && (
              <span className="px-2 py-1 bg-gray-500/30 border border-gray-500/50 rounded text-gray-200 text-xs font-bold">
                🔧 MANUAL
              </span>
            )}
          </div>
        </div>

        {/* Toggle Scheduler */}
        <div className="flex gap-2">
          <Button
            liquid
            variant={schedulerMode.enabled ? 'success' : 'secondary'}
            size="sm"
            onClick={handleToggleScheduler}
            className="flex-1"
          >
            {schedulerMode.enabled ? '✓ Scheduler Attivo' : 'Attiva Scheduler'}
          </Button>
          {schedulerMode.enabled && schedulerMode.semiManual && (
            <Button
              liquid
              variant="warning"
              size="sm"
              onClick={handleClearSemiManual}
            >
              ↩️ Clear Semi-Manual
            </Button>
          )}
        </div>

        {/* Quick Test Setup */}
        <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-cyan-200 font-medium">Quick Test - Crea intervallo oggi</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-purple-200">Inizio</label>
              <input
                type="time"
                value={testIntervalStart}
                onChange={(e) => setTestIntervalStart(e.target.value)}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-purple-200">Fine</label>
              <input
                type="time"
                value={testIntervalEnd}
                onChange={(e) => setTestIntervalEnd(e.target.value)}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-purple-200">Potenza</label>
              <select
                value={testIntervalPower}
                onChange={(e) => setTestIntervalPower(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>Livello {p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-purple-200">Ventola</label>
              <select
                value={testIntervalFan}
                onChange={(e) => setTestIntervalFan(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map(f => (
                  <option key={f} value={f}>Livello {f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              liquid
              variant="primary"
              size="sm"
              onClick={handleCreateTestInterval}
              className="flex-1"
            >
              ✓ Crea Intervallo Test
            </Button>
            <Button
              liquid
              variant="secondary"
              size="sm"
              onClick={handleClearTestInterval}
            >
              ✕ Clear
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-200 leading-relaxed">
            <strong>💡 Come testare il cambio automatico a Semi-Manuale:</strong><br />
            1. Crea un intervallo di test<br />
            2. Metti la stufa in stato WORK<br />
            3. Vai sulla StoveCard e modifica Fan o Power<br />
            4. Dovresti vedere il toast &quot;Modalità cambiata in Semi-Manuale&quot; ⚙️
          </p>
        </div>
      </div>

      {/* History */}
      {showHistory && (
        <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white drop-shadow-lg">Storico Azioni</h3>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {history.length === 0 ? (
              <p className="text-purple-200 text-sm text-center py-4">
                Nessuna azione registrata
              </p>
            ) : (
              history.map((entry, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">
                      {entry.action}
                    </span>
                    <span className="text-purple-300 text-xs">
                      {new Date(entry.timestamp).toLocaleTimeString('it-IT')}
                    </span>
                  </div>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <pre className="text-xs text-purple-200 mt-1 overflow-x-auto">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
