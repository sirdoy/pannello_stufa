'use client';

import { X } from 'lucide-react';
import CameraEventIcon from './CameraEventIcon';
import { Modal, Text, Button, Card } from '../../ui';
import { getEventTypeName } from '@/lib/netatmo/netatmoCameraApi';
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
        <div className="flex items-center justify-between border-b border-white/8 p-4">
          <div className="flex items-center gap-3">
            <CameraEventIcon type={event.event_type} size={24} className="shrink-0 text-(--text-2)" />
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
            icon={<X className="size-6" />}
            onClick={onClose}
            variant="ghost"
            size="md"
            aria-label="Chiudi"
          />
        </div>

        {/* Snapshot area */}
        <div className="relative aspect-video bg-black">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Evento ${getEventTypeName(event.event_type)}`}
              className="size-full object-contain"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3">
              <CameraEventIcon type={event.event_type} size={48} className="opacity-50" />
              <Text variant="secondary">Anteprima non disponibile</Text>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/8 p-4">
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
