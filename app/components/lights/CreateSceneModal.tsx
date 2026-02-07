'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { X } from 'lucide-react';

interface HueRoom {
  id: string;
  metadata?: { name?: string };
  services?: Array<{ rid: string }>;
  [key: string]: any;
}

interface HueLight {
  id: string;
  on?: { on: boolean };
  dimming?: { brightness: number };
  color?: { xy?: { x: number; y: number } };
  [key: string]: any;
}

interface LightConfig {
  on: boolean;
  brightness: number;
  color: { x: number; y: number } | null;
}

interface SceneAction {
  target: { rid: string; rtype: string };
  action: {
    on: { on: boolean };
    dimming?: { brightness: number };
    color?: { xy: { x: number; y: number } };
  };
}

interface CreateSceneModalProps {
  isOpen: boolean;
  rooms?: HueRoom[];
  onConfirm: (data: { name: string; groupRid: string; actions: SceneAction[] }) => void;
  onCancel: () => void;
}

/**
 * CreateSceneModal Component
 *
 * Hybrid flow:
 * 1. User selects room
 * 2. Fetches current light states for that room
 * 3. Pre-populates form with current states
 * 4. User can adjust on/off, brightness, color for each light
 * 5. Saves scene with configured states
 */
export default function CreateSceneModal({
  isOpen,
  rooms = [],
  onConfirm,
  onCancel,
}: CreateSceneModalProps) {
  const [name, setName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [lights, setLights] = useState<HueLight[]>([]);
  const [lightConfigs, setLightConfigs] = useState<Record<string, LightConfig>>({});
  const [loadingLights, setLoadingLights] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedRoom('');
      setLights([]);
      setLightConfigs({});
      setError('');
    }
  }, [isOpen]);

  // Fetch lights when room is selected
  const fetchRoomLights = useCallback(async (roomId) => {
    try {
      setLoadingLights(true);
      setError('');

      const response = await fetch('/api/hue/lights');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Filter lights for selected room
      const selectedRoomObj = rooms.find(r => r.id === roomId);
      const roomLights = data.lights.filter(light => {
        // Light belongs to room if it's in room's services
        return selectedRoomObj?.services?.some(
          service => service.rid === light.id
        );
      });

      setLights(roomLights);

      // Pre-populate with current states (hybrid flow)
      const initialConfigs = {};
      roomLights.forEach(light => {
        initialConfigs[light.id] = {
          on: light.on?.on ?? true,
          brightness: light.dimming?.brightness ?? 100,
          // Color support check
          color: light.color ? {
            x: light.color.xy?.x ?? 0.3227,
            y: light.color.xy?.y ?? 0.329
          } : null
        };
      });
      setLightConfigs(initialConfigs);

    } catch (err) {
      console.error('Error fetching lights:', err);
      setError('Impossibile caricare le luci della stanza');
    } finally {
      setLoadingLights(false);
    }
  }, [rooms]);

  useEffect(() => {
    if (selectedRoom) {
      fetchRoomLights(selectedRoom);
    } else {
      setLights([]);
      setLightConfigs({});
    }
  }, [selectedRoom, fetchRoomLights]);

  function handleLightToggle(lightId: string) {
    setLightConfigs(prev => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        on: !prev[lightId]?.on
      }
    }));
  }

  function handleBrightnessChange(lightId: string, brightness: number) {
    setLightConfigs(prev => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        brightness: Number(brightness)
      }
    }));
  }

  function handleColorChange(lightId: string, x: number, y: number) {
    setLightConfigs(prev => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        color: { x: Number(x), y: Number(y) }
      }
    }));
  }

  function handleConfirm() {
    // Validation
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Il nome della scena è obbligatorio');
      return;
    }

    if (trimmedName.length > 255) {
      setError('Il nome non può superare 255 caratteri');
      return;
    }

    if (!selectedRoom) {
      setError('Seleziona una stanza');
      return;
    }

    if (lights.length === 0) {
      setError('La stanza non contiene luci');
      return;
    }

    // Build actions array for Hue API
    const actions: SceneAction[] = lights.map(light => {
      const config = lightConfigs[light.id] || { on: true, brightness: 100, color: null };

      const action: SceneAction = {
        target: { rid: light.id, rtype: 'light' },
        action: {
          on: { on: config.on ?? true }
        }
      };

      // Add brightness if light supports dimming
      if (light.dimming) {
        action.action.dimming = { brightness: config.brightness ?? 100 };
      }

      // Add color if light supports it and user set it
      if (light.color && config.color) {
        action.action.color = {
          xy: {
            x: config.color.x,
            y: config.color.y
          }
        };
      }

      return action;
    });

    onConfirm({
      name: trimmedName,
      groupRid: selectedRoom,
      actions
    });
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  }

  // Color presets (XY CIE color space - standard for Hue)
  const COLOR_PRESETS = [
    { name: 'Bianco', x: 0.3227, y: 0.329 },
    { name: 'Rosso', x: 0.675, y: 0.322 },
    { name: 'Verde', x: 0.408, y: 0.517 },
    { name: 'Blu', x: 0.168, y: 0.041 },
    { name: 'Giallo', x: 0.4432, y: 0.5154 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-3xl"
    >
      <Card variant="glass" className="animate-scale-in-center p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Heading level={3} size="xl">
              Crea Nuova Scena
            </Heading>
            <Text variant="secondary" size="sm" className="mt-1">
              Cattura lo stato attuale delle luci o personalizza
            </Text>
          </div>
          <ActionButton
            icon={<X />}
            variant="ghost"
            size="md"
            onClick={onCancel}
            ariaLabel="Chiudi"
          />
        </div>

        {/* Body */}
        <div className="space-y-6">
          {/* Scene Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300 mb-2">
              Nome Scena <span className="text-ember-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Es: Relax serale, Lettura..."
              maxLength={255}
              autoFocus
            />
            <Text variant="tertiary" size="xs" className="mt-2">
              {name.length}/255 caratteri
            </Text>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300 mb-2">
              Stanza <span className="text-ember-500">*</span>
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-white/60 [html:not(.dark)_&]:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-300/50 [html:not(.dark)_&]:border-slate-600/50 focus:border-ember-500 [html:not(.dark)_&]:focus:border-ember-400 focus:ring-2 focus:ring-ember-500/20 [html:not(.dark)_&]:focus:ring-ember-400/20 text-slate-900 [html:not(.dark)_&]:text-white transition-all outline-none"
            >
              <option value="">Seleziona una stanza...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.metadata?.name || 'Stanza'}
                </option>
              ))}
            </select>
          </div>

          {/* Lights Configuration */}
          {loadingLights && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-3 border-ember-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <Text variant="secondary" size="sm">Caricamento luci...</Text>
            </div>
          )}

          {!loadingLights && lights.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300 mb-3">
                Configurazione Luci
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lights.map(light => {
                  const config = lightConfigs[light.id] || { on: true, brightness: 100, color: null };
                  return (
                    <div key={light.id} className="p-4 bg-white/40 [html:not(.dark)_&]:bg-slate-800/40 rounded-xl border border-slate-200/50 [html:not(.dark)_&]:border-slate-700/50">
                      {/* Light Name + Toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <Text as="span">
                          {light.metadata?.name || 'Luce'}
                        </Text>
                        <button
                          onClick={() => handleLightToggle(light.id)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            config.on
                              ? 'bg-flame-500'
                              : 'bg-slate-300 [html:not(.dark)_&]:bg-slate-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            config.on ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Brightness Slider (if supported and on) */}
                      {light.dimming && config.on && (
                        <div className="mb-3">
                          <label className="block text-xs text-slate-600 [html:not(.dark)_&]:text-slate-400 mb-1">
                            Luminosità: {config.brightness}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.brightness || 100}
                            onChange={(e) => handleBrightnessChange(light.id, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 [html:not(.dark)_&]:bg-slate-700 rounded appearance-none cursor-pointer accent-flame-500"
                          />
                        </div>
                      )}

                      {/* Color Picker (if supported and on) - Simplified */}
                      {light.color && config.on && (
                        <div>
                          <label className="block text-xs text-slate-600 [html:not(.dark)_&]:text-slate-400 mb-1">
                            Colore (preset comuni)
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.name}
                                onClick={() => handleColorChange(light.id, preset.x, preset.y)}
                                className="p-2 rounded-lg bg-slate-200/50 [html:not(.dark)_&]:bg-slate-700/50 hover:bg-slate-300/50 [html:not(.dark)_&]:hover:bg-slate-600/50 text-xs transition-colors"
                                title={preset.name}
                              >
                                {preset.name[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Text variant="ember" size="sm" className="flex items-center gap-1">
              <span>⚠️</span>
              <span>{error}</span>
            </Text>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="subtle"
            onClick={onCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            variant="ember"
            onClick={handleConfirm}
            className="flex-1"
            disabled={!name.trim() || !selectedRoom || lights.length === 0 || loadingLights}
          >
            Crea Scena
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
