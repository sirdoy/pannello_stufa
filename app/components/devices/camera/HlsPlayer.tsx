'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Text, Button } from '../../ui';

interface HlsPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  onError?: (error: string) => void;
  showControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

/**
 * HlsPlayer - Video player for HLS streams (Netatmo cameras)
 * Uses hls.js for HLS playback support in browsers that don't support it natively
 */
export default function HlsPlayer({
  src,
  poster,
  className = '',
  onError,
  showControls = false,
  autoPlay = true,
  muted
}: HlsPlayerProps) {
  // Default muted based on showControls if not explicitly set
  const isMuted = muted !== undefined ? muted : !showControls;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect mobile devices (iOS and Android)
  const isMobile = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    /Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
  );

  // Handle fullscreen changes (including exit via Esc key)
  useEffect(() => {
    const video = videoRef.current;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };

    // iOS Safari uses different events on the video element
    const handleIOSFullscreenBegin = () => setIsFullscreen(true);
    const handleIOSFullscreenEnd = () => setIsFullscreen(false);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // iOS-specific events on video element
    if (video) {
      video.addEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin);
      video.addEventListener('webkitendfullscreen', handleIOSFullscreenEnd);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin);
        video.removeEventListener('webkitendfullscreen', handleIOSFullscreenEnd);
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    try {
      // Check if already in fullscreen
      const inFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

      if (inFullscreen) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        return;
      }

      // Mobile devices: Use video element fullscreen (more reliable)
      if (isMobile) {
        // Try iOS Safari method first
        if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
          return;
        }
        // Try standard Fullscreen API on video element (Android)
        if (video.requestFullscreen) {
          await video.requestFullscreen();
          return;
        }
        if (video.webkitRequestFullscreen) {
          await video.webkitRequestFullscreen();
          return;
        }
      }

      // Desktop: Use container fullscreen for better UI control
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      // Fallback: try video element fullscreen if container failed
      try {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          await video.webkitRequestFullscreen();
        }
      } catch (fallbackErr) {
        console.error('Fullscreen fallback error:', fallbackErr);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls = null;

    const initPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if browser supports HLS natively (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setLoading(false);
            if (autoPlay) {
              video.play().catch(() => {
                // Autoplay blocked - user needs to interact
              });
            }
          });
          video.addEventListener('error', handleError);
          return;
        }

        // Use hls.js for other browsers
        const Hls = (await import('hls.js')).default;

        if (!Hls.isSupported()) {
          setError('HLS non supportato dal browser');
          setLoading(false);
          onError?.('HLS_NOT_SUPPORTED');
          return;
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          if (autoPlay) {
            video.play().catch(() => {
              // Autoplay blocked
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS network error', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS media error', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('HLS fatal error', data);
                handleError();
                break;
            }
          }
        });
      } catch (err) {
        console.error('Error initializing HLS player:', err);
        handleError();
      }
    };

    const handleError = () => {
      setError('Errore caricamento stream');
      setLoading(false);
      onError?.('STREAM_ERROR');
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onError, autoPlay]);

  if (error) {
    return (
      <div className={`relative bg-slate-800 flex items-center justify-center ${className}`}>
        {poster && (
          <img
            src={poster}
            alt="Camera preview"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative z-10 text-center p-4">
          <span className="text-3xl mb-2 block">📹</span>
          <Text variant="secondary" size="sm">{error}</Text>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-slate-900 ${className} ${isFullscreen ? 'flex items-center justify-center' : ''}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
            <Text variant="secondary" size="sm">
              {showControls ? 'Caricamento video...' : 'Connessione al live...'}
            </Text>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className={`w-full h-full ${showControls ? 'object-contain' : 'object-cover'} ${isFullscreen ? 'max-h-screen' : ''}`}
        poster={poster}
        playsInline
        muted={isMuted}
        controls={showControls}
      />

      {/* Fullscreen button - only show when not using native controls */}
      {!loading && !error && !showControls && (
        <Button.Icon
          icon={isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
          onClick={toggleFullscreen}
          variant="ghost"
          size="sm"
          aria-label={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 z-20"
        />
      )}
    </div>
  );
}
