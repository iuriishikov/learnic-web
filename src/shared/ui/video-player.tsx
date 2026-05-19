'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type PlaybackRate = (typeof PLAYBACK_RATES)[number];

type VideoPlayerProps = {
  src: string;
  poster?: string;
  className?: string;
  defaultPlaybackRate?: PlaybackRate;
  defaultVolume?: number;
  ariaLabel?: string;
  normalLabel?: string;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(seconds: number, withSign = false) {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const sign = withSign ? '-' : '';
  const total = Math.floor(s);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${sign}${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${sign}${pad(minutes)}:${pad(secs)}`;
}

function formatRate(rate: number) {
  return `${rate}×`;
}

function VolumeIcon({ volume, muted }: { volume: number; muted: boolean }) {
  if (muted || volume === 0) return <VolumeX />;
  if (volume < 0.5) return <Volume1 />;
  return <Volume2 />;
}

export function VideoPlayer({
  src,
  poster,
  className,
  defaultPlaybackRate = 1,
  defaultVolume = 1,
  ariaLabel,
  normalLabel = 'Normal',
}: VideoPlayerProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const previewVideoRef = React.useRef<HTMLVideoElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);
  const [volume, setVolume] = React.useState(defaultVolume);
  const [muted, setMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] =
    React.useState<PlaybackRate>(defaultPlaybackRate);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const [previewPct, setPreviewPct] = React.useState(0);
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const [isScrubbing, setIsScrubbing] = React.useState(false);

  const hideTimer = React.useRef<number | null>(null);

  const wake = React.useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 2400);
  }, []);

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = playbackRate;
  }, [playbackRate]);

  React.useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  React.useEffect(() => {
    const pv = previewVideoRef.current;
    if (!pv || !previewVisible || !duration) return;
    const target = previewPct * duration;
    if (Math.abs(pv.currentTime - target) > 0.05) {
      try {
        pv.currentTime = target;
      } catch {
        // ignore seek race
      }
    }
  }, [previewPct, previewVisible, duration]);

  const togglePlay = React.useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      try {
        await v.play();
      } catch {
        // autoplay rejection — leave paused state visible
      }
    } else {
      v.pause();
    }
    wake();
  }, [wake]);

  const toggleMute = React.useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (!next && volume === 0) setVolume(0.5);
      return next;
    });
    wake();
  }, [volume, wake]);

  const toggleFullscreen = React.useCallback(async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, []);

  const seekToPct = React.useCallback((pct: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    const clamped = Math.min(1, Math.max(0, pct));
    v.currentTime = clamped * v.duration;
    setCurrentTime(v.currentTime);
  }, []);

  const updatePreview = React.useCallback((clientX: number) => {
    const el = progressRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    const clamped = Math.min(1, Math.max(0, pct));
    setPreviewPct(clamped);
    setPreviewVisible(true);
    return clamped;
  }, []);

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const pct = updatePreview(e.clientX);
    if (pct !== null) seekToPct(pct);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pct = updatePreview(e.clientX);
    if (isScrubbing && pct !== null) seekToPct(pct);
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsScrubbing(false);
  };

  const handleProgressPointerLeave = () => {
    if (!isScrubbing) setPreviewVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        void togglePlay();
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        void toggleFullscreen();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - 5);
        wake();
        break;
      case 'ArrowRight':
        e.preventDefault();
        v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
        wake();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setMuted(false);
        setVolume((vv) => Math.min(1, vv + 0.1));
        wake();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume((vv) => Math.max(0, vv - 0.1));
        wake();
        break;
    }
  };

  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const hoverTime = previewPct * duration;
  const remaining = Math.max(0, duration - currentTime);

  const showCenterPlay = !isPlaying && duration > 0;
  const showControls = !isPlaying || controlsVisible || isScrubbing;
  const showPreview = previewVisible && duration > 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onPointerMove={wake}
      onPointerLeave={() => {
        if (videoRef.current && !videoRef.current.paused) {
          setControlsVisible(false);
        }
      }}
      className={cn(
        'group/player relative aspect-video w-full rounded-2xl text-white shadow-lg outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-brand',
        className,
      )}
    >
    <div className="absolute inset-0 isolate overflow-hidden rounded-2xl bg-black [-webkit-mask-image:linear-gradient(#fff,#fff)] [clip-path:inset(0_round_var(--radius-2xl))] [mask-image:linear-gradient(#fff,#fff)]">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full bg-black object-cover"
        onClick={togglePlay}
        onPlay={() => {
          setIsPlaying(true);
          wake();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDuration(el.duration);
          el.volume = volume;
          el.muted = muted;
          el.playbackRate = playbackRate;
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onProgress={(e) => {
          const el = e.currentTarget;
          if (el.buffered.length > 0) {
            setBuffered(el.buffered.end(el.buffered.length - 1));
          }
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
      />

      <AnimatePresence>
        {showCenterPlay ? (
          <motion.button
            key="center-play"
            type="button"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            onClick={togglePlay}
            aria-label="Play"
            className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-xl ring-1 ring-white/40 backdrop-blur-sm sm:size-20"
          >
            <Play
              className="size-7 translate-x-0.5 fill-current sm:size-8"
              strokeWidth={0}
            />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showControls ? (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pb-2 pt-8 sm:px-4 sm:pb-3 sm:pt-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div
                aria-hidden={!showPreview}
                style={{ left: `${previewPct * 100}%` }}
                className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2"
              >
                <motion.div
                  initial={false}
                  animate={{
                    opacity: showPreview ? 1 : 0,
                    y: showPreview || reduceMotion ? 0 : 6,
                  }}
                  transition={{
                    opacity: { duration: 0.18, ease: 'easeOut' },
                    y: { duration: 0.22, ease: 'easeOut' },
                  }}
                  className="flex flex-col items-center"
                >
                  <div className="relative aspect-video w-40 overflow-hidden rounded-xl bg-black/90 shadow-xl ring-1 ring-white/40 sm:w-48 md:w-56">
                    <video
                      ref={previewVideoRef}
                      src={src}
                      muted
                      playsInline
                      preload="auto"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold tabular-nums text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.7)] sm:text-base">
                    <span>{formatTime(hoverTime)}</span>
                    <span aria-hidden className="text-white/45">
                      |
                    </span>
                    <span className="text-white/85">{formatTime(duration)}</span>
                  </div>
                </motion.div>
              </div>

              <div
                ref={progressRef}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={currentTime}
                onPointerDown={handleProgressPointerDown}
                onPointerMove={handleProgressPointerMove}
                onPointerUp={handleProgressPointerUp}
                onPointerLeave={handleProgressPointerLeave}
                className={cn(
                  'relative h-3 touch-none select-none',
                  isScrubbing ? 'cursor-grabbing' : 'cursor-grab',
                )}
              >
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="absolute inset-y-0 left-0 bg-white/35"
                    style={{ width: `${bufferedPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-white"
                    style={{ width: `${playedPct}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                  style={{ left: `${playedPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex size-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none [&_svg]:size-4"
              >
                {isPlaying ? (
                  <Pause className="fill-current" strokeWidth={0} />
                ) : (
                  <Play
                    className="translate-x-px fill-current"
                    strokeWidth={0}
                  />
                )}
              </button>

              <div className="group/volume flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  className="flex size-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none [&_svg]:size-4"
                >
                  <VolumeIcon volume={volume} muted={muted} />
                </button>
                <VolumeBar
                  value={muted ? 0 : volume}
                  onChange={(next) => {
                    setMuted(false);
                    setVolume(next);
                    wake();
                  }}
                  className="hidden sm:flex"
                />
              </div>

              <span className="text-[11px] font-medium tabular-nums text-white/95 sm:text-xs">
                {formatTime(currentTime)}
              </span>

              <div className="flex-1" />

              <span className="text-[11px] font-medium tabular-nums text-white/85 sm:text-xs">
                {formatTime(remaining, true)}
              </span>

              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Playback speed"
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none sm:text-xs"
                    >
                      {formatRate(playbackRate)}
                    </button>
                  }
                />
                <PopoverContent
                  className="w-32 gap-0 p-1"
                  align="end"
                  sideOffset={8}
                >
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackRate(rate)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                        rate === playbackRate &&
                          'bg-brand/10 font-medium text-brand',
                      )}
                    >
                      <span className="tabular-nums">{formatRate(rate)}</span>
                      {rate === 1 ? (
                        <span className="text-xs text-muted-foreground">
                          {normalLabel}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="flex size-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none [&_svg]:size-4"
              >
                {isFullscreen ? <Minimize /> : <Maximize />}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
    </div>
  );
}

type VolumeBarProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
};

function VolumeBar({ value, onChange, className }: VolumeBarProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const setFromClient = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    onChange(Math.min(1, Math.max(0, pct)));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Volume"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={value}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        setFromClient(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) setFromClient(e.clientX);
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setDragging(false);
      }}
      className={cn(
        'group/vol relative h-3 w-16 cursor-pointer touch-none select-none items-center',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <div
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/vol:opacity-100"
        style={{ left: `${value * 100}%` }}
      />
    </div>
  );
}
