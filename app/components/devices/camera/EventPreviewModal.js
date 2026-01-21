'use client';

import { useState, useEffect } from 'react';
import { Modal, Text, Button, Card } from '../../ui';
import HlsPlayer from './HlsPlayer';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import { downloadHlsVideo } from '@/lib/hlsDownloader';

/**
 * EventPreviewModal - Modal for viewing camera event video
 * Uses the UI Modal component for proper centering and scroll lock
 *
 * @param {Object} event - Event object with video_id, snapshot, type, time
 * @param {Object} camera - Camera object with vpn_url
 * @param {function} onClose - Callback to close modal
 */
export default function EventPreviewModal({ event, camera, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [downloadError, setDownloadError] = useState(null);

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
  const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') || null;

  // Get URLs
  const snapshotUrl = NETATMO_CAMERA_API.getEventSnapshotUrl(event);
  const thumbnailUrl = NETATMO_CAMERA_API.getEventVideoThumbnail(event, camera);
  const videoUrl = NETATMO_CAMERA_API.getEventVideoUrl(event, camera);
  const downloadUrl = NETATMO_CAMERA_API.getEventVideoDownloadUrl(event, camera);

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
      const date = new Date(event.time * 1000);
      const filename = `video_${date.toISOString().slice(0, 10)}_${date.toTimeString().slice(0, 5).replace(':', '-')}`;

      await downloadHlsVideo(downloadUrl, filename, (percent, message) => {
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
              <Text variant="body" weight="semibold">
                {event.sub_type
                  ? NETATMO_CAMERA_API.getSubTypeName(event.sub_type)
                  : NETATMO_CAMERA_API.getEventTypeName(event.type)}
              </Text>
              <Text variant="tertiary" size="sm">
                {new Date(event.time * 1000).toLocaleString('it-IT', {
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
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 [html:not(.dark)_&]:hover:bg-slate-100 transition-colors"
            title="Chiudi"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                    <svg className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
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
              variant="ocean"
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
