'use client';

import { useEffect, useRef, useState } from 'react';
import { Text } from '../../ui';

/**
 * HlsPlayer - Video player for HLS streams (Netatmo cameras)
 * Uses hls.js for HLS playback support in browsers that don't support it natively
 *
 * @param {string} src - HLS stream URL (m3u8)
 * @param {string} poster - Poster image URL (shown before video loads)
 * @param {string} className - Additional CSS classes
 * @param {function} onError - Error callback
 * @param {boolean} showControls - Show native video controls (default: false for live, true for VOD)
 * @param {boolean} autoPlay - Auto-play video (default: true)
 * @param {boolean} muted - Mute video (default: true for live, false for VOD with controls)
 */
export default function HlsPlayer({ src, poster, className = '', onError, showControls = false, autoPlay = true, muted }) {
  // Default muted based on showControls if not explicitly set
  const isMuted = muted !== undefined ? muted : !showControls;
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect iOS (Safari on iPhone/iPad)
  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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
      // iOS Safari: Use video element's webkitEnterFullscreen
      // (iOS doesn't support Fullscreen API on containers, only on video)
      if (isIOS && video.webkitEnterFullscreen) {
        if (!isFullscreen) {
          video.webkitEnterFullscreen();
        }
        // iOS exits fullscreen via native UI, no programmatic exit needed
        return;
      }

      // Desktop/Android: Use container fullscreen
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
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
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-2 right-2 p-2 rounded-full bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 transition-colors z-20"
          title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
        >
          {isFullscreen ? (
            // Exit fullscreen icon
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Enter fullscreen icon
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
