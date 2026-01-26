'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { Text } from '@/app/components/ui';

/**
 * Get status styling
 */
const getStatusStyle = (status) => {
  const styles = {
    active: {
      text: 'Attivo',
      className: 'bg-sage-500/20 text-sage-400 [html:not(.dark)_&]:bg-sage-100 [html:not(.dark)_&]:text-sage-700',
    },
    stale: {
      text: 'Inattivo',
      className: 'bg-copper-500/20 text-copper-400 [html:not(.dark)_&]:bg-copper-100 [html:not(.dark)_&]:text-copper-700',
    },
    unknown: {
      text: 'Sconosciuto',
      className: 'bg-slate-500/20 text-slate-400 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-600',
    },
  };
  return styles[status] || styles.unknown;
};

/**
 * Get device icon
 */
const getDeviceIcon = (platform, browser) => {
  if (platform === 'ios') return '📱';
  if (platform === 'android') return '📱';
  if (browser?.toLowerCase().includes('safari')) return '🧭';
  if (browser?.toLowerCase().includes('chrome')) return '🌐';
  if (browser?.toLowerCase().includes('firefox')) return '🦊';
  return '💻';
};

export default function DeviceListItem({
  device,
  isCurrentDevice,
  onUpdate,
  onRemove,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(device.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

  const statusStyle = getStatusStyle(device.status);

  // Handle save name
  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Il nome non può essere vuoto');
      return;
    }
    if (editName.length > 50) {
      setError('Il nome deve essere massimo 50 caratteri');
      return;
    }

    setIsSaving(true);
    setError(null);

    const previousName = device.displayName;

    // Optimistic update
    onUpdate(device.tokenKey, { displayName: editName.trim() });
    setIsEditing(false);

    try {
      const res = await fetch(`/api/notifications/devices/${device.tokenKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      // Rollback on failure
      onUpdate(device.tokenKey, { displayName: previousName });
      setEditName(previousName);
      setError(err.message);
      setIsEditing(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle remove with confirmation
  const handleRemove = async () => {
    const confirmed = window.confirm(
      `Rimuovere "${device.displayName || 'Dispositivo'}"?\n\nQuesto dispositivo non riceverà più notifiche.`
    );

    if (!confirmed) return;

    setIsRemoving(true);
    setError(null);

    try {
      const res = await fetch(`/api/notifications/devices/${device.tokenKey}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nella rimozione');
      }

      // Notify parent to remove from list
      onRemove(device.tokenKey);
    } catch (err) {
      setError(err.message);
      setIsRemoving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditName(device.displayName || '');
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="p-4 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700/50 [html:not(.dark)_&]:border-slate-200 rounded-xl" data-testid="device-item">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Device info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* Icon */}
            <span className="text-xl flex-shrink-0">
              {getDeviceIcon(device.platform, device.browser)}
            </span>

            {/* Name - editable or display */}
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome dispositivo"
                  size="sm"
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="flex-1"
                  data-testid="device-name-input"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? '...' : '✓'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-left flex-1 min-w-0 group"
              >
                <Text weight="medium" className="truncate group-hover:text-ember-400 transition-colors">
                  {device.displayName || 'Dispositivo senza nome'}
                </Text>
                <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-ember-400 transition-opacity">
                  ✎
                </span>
              </button>
            )}

            {/* Current device badge */}
            {isCurrentDevice && (
              <span className="px-2 py-0.5 text-xs font-medium bg-ocean-500/20 text-ocean-400 [html:not(.dark)_&]:bg-ocean-100 [html:not(.dark)_&]:text-ocean-700 rounded-full flex-shrink-0">
                Questo dispositivo
              </span>
            )}

            {/* Status badge */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${statusStyle.className}`}>
              {statusStyle.text}
            </span>
          </div>

          {/* Device details */}
          <div className="ml-8 space-y-1">
            <Text variant="secondary" size="sm">
              {device.browser || 'Browser'} • {device.os || 'Sistema'}
            </Text>
            <Text variant="tertiary" size="xs">
              Ultimo utilizzo:{' '}
              {device.lastUsed
                ? formatDistanceToNow(new Date(device.lastUsed), {
                    addSuffix: true,
                    locale: it,
                  })
                : 'Mai'}
            </Text>
            {device.tokenPrefix && (
              <Text variant="tertiary" size="xs" className="font-mono">
                Token: {device.tokenPrefix}...
              </Text>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="ml-8 mt-2">
              <Text variant="ember" size="sm">
                {error}
              </Text>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving || isCurrentDevice}
            className="text-ember-400 hover:text-ember-300 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:hover:text-ember-700"
            data-testid="remove-device"
          >
            {isRemoving ? 'Rimozione...' : 'Rimuovi'}
          </Button>
        </div>
      </div>

      {/* Warning for current device removal */}
      {isCurrentDevice && (
        <div className="mt-3 ml-8">
          <Text variant="tertiary" size="xs">
            Non puoi rimuovere il dispositivo corrente
          </Text>
        </div>
      )}
    </div>
  );
}
