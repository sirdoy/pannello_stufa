'use client';

import { useState } from 'react';
import { Card, Button } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';

export default function RoomCard({ room, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTemp, setEditingTemp] = useState(false);
  const [targetTemp, setTargetTemp] = useState(room.setpoint || 20);

  const hasData = room.temperature !== undefined;
  const isHeating = room.heating || false;

  // Temperature color coding
  function getTempColor(temp, setpoint) {
    if (!temp || !setpoint) return 'text-neutral-600';
    const diff = temp - setpoint;
    if (diff >= 0.5) return 'text-success-600';
    if (diff <= -1) return 'text-primary-600';
    return 'text-warning-600';
  }

  // Mode badge
  function getModeBadge(mode) {
    const badges = {
      manual: { text: 'Manuale', color: 'bg-accent-100 text-accent-700' },
      home: { text: 'Casa', color: 'bg-success-100 text-success-700' },
      max: { text: 'Max', color: 'bg-primary-100 text-primary-700' },
      off: { text: 'Off', color: 'bg-neutral-100 text-neutral-700' },
      schedule: { text: 'Programmato', color: 'bg-info-100 text-info-700' },
    };
    return badges[mode] || badges.schedule;
  }

  async function setTemperature(temp) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          mode: 'manual',
          temp,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEditingTemp(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function setModeHome() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          mode: 'home',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function setModeOff() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          mode: 'off',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const badge = getModeBadge(room.mode);

  return (
    <Card className="p-6 transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {room.name}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            {room.type || 'Stanza'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isHeating && (
            <span className="text-2xl" title="Riscaldamento attivo">
              🔥
            </span>
          )}
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
        </div>
      </div>

      {/* Temperature Display */}
      {hasData ? (
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${getTempColor(room.temperature, room.setpoint)}`}>
              {room.temperature?.toFixed(1)}°
            </span>
            <span className="text-neutral-400">/</span>
            <span className="text-xl font-semibold text-neutral-600">
              {room.setpoint?.toFixed(1)}°
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Attuale / Setpoint
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-neutral-400 italic">Dati non disponibili</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl">
          <p className="text-sm text-primary-700">{error}</p>
        </div>
      )}

      {/* Temperature Editor */}
      {editingTemp ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTargetTemp(Math.max(5, targetTemp - 0.5))}
            >
              −
            </Button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold text-neutral-900">
                {targetTemp.toFixed(1)}°
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTargetTemp(Math.min(30, targetTemp + 0.5))}
            >
              +
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={() => setTemperature(targetTemp)}
              loading={loading}
              className="flex-1"
              size="sm"
            >
              ✓ Conferma
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingTemp(false)}
              disabled={loading}
              size="sm"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="accent"
            onClick={() => setEditingTemp(true)}
            disabled={loading}
            size="sm"
          >
            🎯 Imposta
          </Button>
          <Button
            variant="success"
            onClick={setModeHome}
            disabled={loading}
            size="sm"
          >
            🏠 Auto
          </Button>
          <Button
            variant="outline"
            onClick={setModeOff}
            disabled={loading}
            size="sm"
          >
            ⏸️ Off
          </Button>
        </div>
      )}

      {/* Module Count */}
      {room.modules && room.modules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500">
            {room.modules.length} {room.modules.length === 1 ? 'modulo' : 'moduli'}
          </p>
        </div>
      )}
    </Card>
  );
}
