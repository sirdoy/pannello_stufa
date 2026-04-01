'use client';

import { X } from 'lucide-react';
import { Modal, Text, Button, Card } from '../../ui';
import { getEventTypeName, getEventIcon } from '@/lib/netatmo/netatmoCameraApi';
import { CAMERA_ROUTES } from '@/lib/routes';
import type { CameraEvent } from '@/types/netatmoProxy';

interface EventPreviewModalProps {
  event: CameraEvent | null;
  onClose: () => void;
}

/**
 * EventPreviewModal - Modal for viewing camera event snapshot
 * Shows event snapshot, type, timestamp and message.
 * Video playback is out of scope — proxy provides events + snapshots only.
 */
export default function EventPreviewModal({ event, onClose }: EventPreviewModalProps) {
  if (!event) return null;

  // Strip HTML tags from message
  const stripHtml = (html: string | null | undefined): string | undefined =>
    html?.replace(/<[^>]*>/g, '') || undefined;

  // Use snapshot_url directly from proxy; fall back to the binary endpoint for full-size
  const previewUrl = event.snapshot_url ?? CAMERA_ROUTES.eventSnapshot(event.event_id);

  return (
    <Modal
      isOpen={!!event}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {getEventIcon(event.event_type)}
            </span>
            <div>
              <Text variant="body">
                {getEventTypeName(event.event_type)}
              </Text>
              <Text variant="tertiary" size="sm">
                {new Date(event.timestamp * 1000).toLocaleString('it-IT', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {/* Event message */}
              {event.message && (
                <Text variant="secondary" size="sm" className="mt-1">
                  {stripHtml(event.message)}
                </Text>
              )}
            </div>
          </div>
          <Button.Icon
            icon={<X className="w-6 h-6" />}
            onClick={onClose}
            variant="ghost"
            size="md"
            aria-label="Chiudi"
            className="text-slate-400 hover:bg-slate-800"
          />
        </div>

        {/* Snapshot area */}
        <div className="relative aspect-video bg-black">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Evento ${getEventTypeName(event.event_type)}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <span className="text-5xl opacity-50">
                {getEventIcon(event.event_type)}
              </span>
              <Text variant="secondary">Anteprima non disponibile</Text>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-end">
          <Button
            variant="ember"
            size="sm"
            onClick={onClose}
          >
            Chiudi
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
