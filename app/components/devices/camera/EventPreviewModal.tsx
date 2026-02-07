'use client';

import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { Modal, Text, Button, Card } from '../../ui';
import HlsPlayer from './HlsPlayer';
import NETATMO_CAMERA_API, { ParsedEvent, ParsedCamera } from '@/lib/netatmoCameraApi';
import { downloadHlsVideo } from '@/lib/hlsDownloader';

interface EventPreviewModalProps {
  event: ParsedEvent | null;
  camera: ParsedCamera | null;
  onClose: () => void;
}

/**
 * EventPreviewModal - Modal for viewing camera event video
 * Uses the UI Modal component for proper centering and scroll lock
 */
export default function EventPreviewModal({ event, camera, onClose }: EventPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Reset state when event changes
  useEffect(() => {
    setIsPlaying(false);
    setUseFallback(false);
    setIsDownloading(false);
    setDownloadProgress('');
    setDownloadError(null);
  }, [event?.id]);

  if (!event || !camera) return null;

  // Strip HTML tags from message
  const stripHtml = (html: string | undefined): string | null => html?.replace(/<[^>]*>/g, '') || null;

  // Get URLs
  const snapshotUrl = NETATMO_CAMERA_API.getEventSnapshotUrl(event as any);
  const thumbnailUrl = NETATMO_CAMERA_API.getEventVideoThumbnail(event as any, camera as any);
  const videoUrl = NETATMO_CAMERA_API.getEventVideoUrl(event as any, camera as any);
  const downloadUrl = NETATMO_CAMERA_API.getEventVideoDownloadUrl(event as any, camera as any);

  // Use thumbnail if available, fallback to snapshot if thumbnail fails
  const previewUrl = useFallback ? snapshotUrl : (thumbnailUrl || snapshotUrl);
  const hasVideo = !!videoUrl;

  // Download video as MP4
  const handleDownload = async () => {
    if (!downloadUrl || isDownloading) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress('Avvio download...');

    try {
      // Generate filename from event date
      const date = new Date(Number(event.time) * 1000);
      const filename = `video_${date.toISOString().slice(0, 10)}_${date.toTimeString().slice(0, 5).replace(':', '-')}`;

      await downloadHlsVideo(downloadUrl, filename, (percent: number, message?: string) => {
        setDownloadProgress(message || `${percent}%`);
      });

      setDownloadProgress('Download completato!');
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress('');
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError('Errore durante il download');
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <Modal
      isOpen={!!event}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 [html:not(.dark)_&]:border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {event.sub_type
                ? NETATMO_CAMERA_API.getSubTypeIcon(event.sub_type)
                : NETATMO_CAMERA_API.getEventIcon(event.type)}
            </span>
            <div>
              <Text variant="body">
                {event.sub_type
                  ? NETATMO_CAMERA_API.getSubTypeName(event.sub_type)
                  : NETATMO_CAMERA_API.getEventTypeName(event.type)}
              </Text>
              <Text variant="tertiary" size="sm">
                {new Date(Number(event.time) * 1000).toLocaleString('it-IT', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {/* Event message from Netatmo */}
              {event.message && (
                <Text variant="secondary" size="sm" className="mt-1">
                  {stripHtml(event.message)}
                </Text>
              )}
            </div>
          </div>
          <Button.Icon
            icon={<X className="w-6 h-6" /> as any}
            onClick={onClose}
            variant="ghost"
            size="md"
            aria-label="Chiudi"
            className="text-slate-400 hover:bg-slate-800 [html:not(.dark)_&]:hover:bg-slate-100"
          />
        </div>

        {/* Video/Preview area */}
        <div className="relative aspect-video bg-black">
          {isPlaying && videoUrl ? (
            <HlsPlayer
              src={videoUrl}
              poster={previewUrl}
              className="w-full h-full"
              onError={() => setIsPlaying(false)}
              showControls={true}
              autoPlay={true}
            />
          ) : (
            <>
              {/* Preview image */}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Evento ${NETATMO_CAMERA_API.getEventTypeName(event.type)}`}
                  className="w-full h-full object-contain"
                  onError={() => {
                    // If thumbnail failed and we have a snapshot, try it
                    if (!useFallback && snapshotUrl && thumbnailUrl) {
                      setUseFallback(true);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <span className="text-5xl opacity-50">
                    {NETATMO_CAMERA_API.getEventIcon(event.type)}
                  </span>
                  <Text variant="secondary">Anteprima non disponibile</Text>
                </div>
              )}

              {/* Play button overlay */}
              {hasVideo && (
                <Button
                  variant="ghost"
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 rounded-none group"
                  aria-label="Riproduci video"
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                    <Play className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" />
                  </div>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 [html:not(.dark)_&]:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {event.video_status && (
              <Text variant="tertiary" size="sm">
                Video: {event.video_status === 'available' ? 'Disponibile' :
                        event.video_status === 'recording' ? 'In registrazione' :
                        event.video_status === 'deleted' ? 'Eliminato' : event.video_status}
              </Text>
            )}
            {!hasVideo && (
              <Text variant="tertiary" size="sm">
                Nessun video associato
              </Text>
            )}
          </div>
          <div className="flex gap-2">
            {isPlaying && (
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setIsPlaying(false)}
              >
                Torna all&apos;anteprima
              </Button>
            )}
            {downloadUrl && (
              <Button
                variant="subtle"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? downloadProgress : 'Scarica video'}
              </Button>
            )}
            {downloadError && (
              <Text variant="danger" size="sm">{downloadError}</Text>
            )}
            <Button
              variant="ember"
              size="sm"
              onClick={onClose}
            >
              Chiudi
            </Button>
          </div>
        </div>
      </Card>
    </Modal>
  );
}
