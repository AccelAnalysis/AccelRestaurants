/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type {
  AudioCoordinationMode,
  GlobalMediaTrack,
  MediaSchedule,
  Screen,
  ScreenAudioConfig,
} from '../types';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const APP_VOLUME_KEY = 'accelrestaurants.applicationVolume';
const APP_MUTE_KEY = 'accelrestaurants.applicationMuted';
const volumeTimers = new WeakMap<HTMLMediaElement, number>();

type MediaProps = Record<string, unknown>;

const readString = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const readNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const readBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

export const DEFAULT_MEDIA_SCHEDULE: MediaSchedule = {
  enabled: false,
  startTime: '00:00',
  endTime: '23:59',
  days: [0, 1, 2, 3, 4, 5, 6],
};

export const DEFAULT_QUIET_HOURS: MediaSchedule = {
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
  days: [0, 1, 2, 3, 4, 5, 6],
};

export const DEFAULT_SCREEN_AUDIO_CONFIG: ScreenAudioConfig = {
  enabled: true,
  masterVolume: 0.7,
  backgroundMusic: '',
  playlist: [],
  schedule: { ...DEFAULT_MEDIA_SCHEDULE },
  allowVideoAudio: true,
  fadeBetweenTracksMs: 1200,
  quietHours: { ...DEFAULT_QUIET_HOURS },
  coordinationMode: 'priority',
  duckingEnabled: true,
  duckLevel: 0.25,
};

export function normalizeAudioConfig(config?: Partial<ScreenAudioConfig> | null): ScreenAudioConfig {
  return {
    ...DEFAULT_SCREEN_AUDIO_CONFIG,
    ...(config || {}),
    playlist: Array.isArray(config?.playlist) ? config.playlist : [],
    schedule: { ...DEFAULT_MEDIA_SCHEDULE, ...(config?.schedule || {}) },
    quietHours: { ...DEFAULT_QUIET_HOURS, ...(config?.quietHours || {}) },
  };
}

function minutesFromTime(value: string) {
  const [hours = '0', minutes = '0'] = (value || '00:00').split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function isScheduleActive(schedule?: MediaSchedule | null, now = new Date()) {
  if (!schedule?.enabled) return true;
  if (Array.isArray(schedule.days) && schedule.days.length > 0 && !schedule.days.includes(now.getDay())) {
    return false;
  }

  const current = now.getHours() * 60 + now.getMinutes();
  const start = minutesFromTime(schedule.startTime);
  const end = minutesFromTime(schedule.endTime);
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

export function isQuietHours(config: ScreenAudioConfig, now = new Date()) {
  return Boolean(config.quietHours.enabled) && isScheduleActive(config.quietHours, now);
}

function parseScheduleDays(value: unknown) {
  const rawDays = Array.isArray(value)
    ? value
    : readString(value, '0,1,2,3,4,5,6').split(',');

  const days = rawDays
    .map((day) => Number(day))
    .filter((day) => Number.isFinite(day) && day >= 0 && day <= 6);

  return days.length ? days : [0, 1, 2, 3, 4, 5, 6];
}

export function scheduleFromTileProps(props: MediaProps): MediaSchedule {
  return {
    enabled: readBoolean(props.scheduleEnabled),
    startTime: readString(props.scheduleStart, '00:00'),
    endTime: readString(props.scheduleEnd, '23:59'),
    days: parseScheduleDays(props.scheduleDays),
  };
}

type ApplicationAudioContextValue = {
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
};

const ApplicationAudioContext = React.createContext<ApplicationAudioContextValue | null>(null);

export function ApplicationAudioProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = React.useState(() => {
    if (typeof window === 'undefined') return 1;
    const stored = Number(window.localStorage.getItem(APP_VOLUME_KEY));
    return Number.isFinite(stored) ? clamp(stored) : 1;
  });
  const [muted, setMutedState] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(APP_MUTE_KEY) === 'true';
  });

  const setVolume = React.useCallback((next: number) => setVolumeState(clamp(next)), []);
  const setMuted = React.useCallback((next: boolean) => setMutedState(next), []);

  React.useEffect(() => {
    window.localStorage.setItem(APP_VOLUME_KEY, String(volume));
  }, [volume]);

  React.useEffect(() => {
    window.localStorage.setItem(APP_MUTE_KEY, String(muted));
  }, [muted]);

  const value = React.useMemo(() => ({ volume, muted, setVolume, setMuted }), [volume, muted, setVolume, setMuted]);
  return <ApplicationAudioContext.Provider value={value}>{children}</ApplicationAudioContext.Provider>;
}

export function useApplicationAudio() {
  const context = React.useContext(ApplicationAudioContext);
  if (!context) {
    return { volume: 1, muted: false, setVolume: () => undefined, setMuted: () => undefined };
  }
  return context;
}

type SourceRole = 'background' | 'foreground';
type MediaKind = 'audio' | 'video';

type MediaRegistration = {
  id: string;
  element: HTMLMediaElement;
  role: SourceRole;
  mediaKind: MediaKind;
  priority: number;
  sourceVolume: number;
  forceMuted: boolean;
  duckBackground: boolean;
  intendedPlay: boolean;
  startedAt: number;
  fadeInMs: number;
};

type ScreenAudioContextValue = {
  config: ScreenAudioConfig;
  requestPlayback: (registration: Omit<MediaRegistration, 'startedAt'>) => void;
  stopPlayback: (id: string, reset?: boolean) => void;
  markEnded: (id: string) => void;
  unregister: (id: string) => void;
  rebalance: () => void;
};

const ScreenAudioContext = React.createContext<ScreenAudioContextValue | null>(null);

function rampVolume(element: HTMLMediaElement, target: number, durationMs: number) {
  const safeTarget = clamp(target);
  const previousTimer = volumeTimers.get(element);
  if (previousTimer !== undefined) window.clearInterval(previousTimer);

  if (!durationMs || durationMs <= 0) {
    element.volume = safeTarget;
    volumeTimers.delete(element);
    return;
  }

  const start = element.volume;
  const startedAt = performance.now();
  const timer = window.setInterval(() => {
    const progress = clamp((performance.now() - startedAt) / durationMs);
    element.volume = clamp(start + (safeTarget - start) * progress);
    if (progress >= 1) {
      window.clearInterval(timer);
      volumeTimers.delete(element);
    }
  }, 40);
  volumeTimers.set(element, timer);
}

export function ScreenAudioProvider({ screen, children }: { screen: Screen; children: React.ReactNode }) {
  const applicationAudio = useApplicationAudio();
  const config = React.useMemo(() => normalizeAudioConfig(screen.audioConfig), [screen.audioConfig]);
  const registrations = React.useRef<Map<string, MediaRegistration>>(new Map());

  const rebalance = React.useCallback(() => {
    const now = new Date();
    const screenAudioActive =
      config.enabled &&
      !applicationAudio.muted &&
      applicationAudio.volume > 0 &&
      isScheduleActive(config.schedule, now) &&
      !isQuietHours(config, now);

    const sources = [...registrations.current.values()].filter((source) => source.intendedPlay);
    const foreground = sources
      .filter((source) => source.role === 'foreground')
      .sort((a, b) => b.priority - a.priority || b.startedAt - a.startedAt);
    const background = sources.filter((source) => source.role === 'background');

    const foregroundWinner = foreground[0];
    const exclusiveWinner = [...sources].sort((a, b) => b.priority - a.priority || b.startedAt - a.startedAt)[0];

    const isAllowedByMode = (source: MediaRegistration) => {
      if (config.coordinationMode === 'mix') return true;
      if (config.coordinationMode === 'exclusive') return source.id === exclusiveWinner?.id;
      if (source.role === 'background') return true;
      return source.id === foregroundWinner?.id;
    };

    const audibleForegroundExists = foreground.some((source) => isAllowedByMode(source));
    const shouldDuck = config.duckingEnabled && audibleForegroundExists && foreground.some((source) => source.duckBackground && isAllowedByMode(source));

    for (const source of sources) {
      const allowedByMode = isAllowedByMode(source);
      const videoAudioAllowed = source.mediaKind !== 'video' || config.allowVideoAudio;
      const canOutputAudio = screenAudioActive && allowedByMode && videoAudioAllowed && !source.forceMuted;
      const duckMultiplier = source.role === 'background' && shouldDuck ? config.duckLevel : 1;
      const targetVolume = canOutputAudio
        ? clamp(source.sourceVolume * config.masterVolume * applicationAudio.volume * duckMultiplier)
        : 0;

      source.element.dataset.accelTargetVolume = String(targetVolume);

      if (source.mediaKind === 'video') {
        source.element.muted = !canOutputAudio;
        rampVolume(source.element, targetVolume || clamp(source.sourceVolume), source.fadeInMs);
        if (source.intendedPlay && source.element.paused) source.element.play().catch(() => undefined);
        continue;
      }

      if (!screenAudioActive || !allowedByMode) {
        if (!source.element.paused) source.element.pause();
        continue;
      }

      source.element.muted = source.forceMuted;
      rampVolume(source.element, targetVolume, source.fadeInMs);
      if (source.element.paused && !source.element.ended) source.element.play().catch(() => undefined);
    }

    for (const source of background) {
      if (!source.intendedPlay && !source.element.paused) source.element.pause();
    }
  }, [applicationAudio.muted, applicationAudio.volume, config]);

  const requestPlayback = React.useCallback((registration: Omit<MediaRegistration, 'startedAt'>) => {
    const existing = registrations.current.get(registration.id);
    registrations.current.set(registration.id, {
      ...registration,
      startedAt: existing?.startedAt || Date.now(),
    });
    rebalance();
  }, [rebalance]);

  const stopPlayback = React.useCallback((id: string, reset = false) => {
    const source = registrations.current.get(id);
    if (!source) return;
    source.intendedPlay = false;
    source.element.pause();
    if (reset) {
      try {
        source.element.currentTime = 0;
      } catch {
        // Metadata can be unavailable while a source is still loading.
      }
    }
    rebalance();
  }, [rebalance]);

  const markEnded = React.useCallback((id: string) => {
    const source = registrations.current.get(id);
    if (source) source.intendedPlay = false;
    rebalance();
  }, [rebalance]);

  const unregister = React.useCallback((id: string) => {
    const source = registrations.current.get(id);
    if (source && source.mediaKind === 'audio') source.element.pause();
    registrations.current.delete(id);
    rebalance();
  }, [rebalance]);

  React.useEffect(() => {
    rebalance();
    const interval = window.setInterval(rebalance, 1000);
    return () => window.clearInterval(interval);
  }, [rebalance]);

  const value = React.useMemo(
    () => ({ config, requestPlayback, stopPlayback, markEnded, unregister, rebalance }),
    [config, requestPlayback, stopPlayback, markEnded, unregister, rebalance],
  );
  return <ScreenAudioContext.Provider value={value}>{children}</ScreenAudioContext.Provider>;
}

type CoordinatedMediaProps = {
  kind: MediaKind;
  props: MediaProps;
  role?: SourceRole;
  style?: React.CSSProperties;
  visual?: boolean;
  sourceId?: string;
  onEnded?: () => void;
  onCrossfadeStart?: () => void;
};

export function CoordinatedMedia({
  kind,
  props,
  role = 'foreground',
  style,
  visual = true,
  sourceId,
  onEnded,
  onCrossfadeStart,
}: CoordinatedMediaProps) {
  const context = React.useContext(ScreenAudioContext);
  const mediaRef = React.useRef<HTMLMediaElement | null>(null);
  const generatedId = React.useId();
  const idRef = React.useRef(sourceId || `media_${generatedId.replaceAll(':', '')}`);
  const [manualWanted, setManualWanted] = React.useState(false);
  const [blocked, setBlocked] = React.useState(false);
  const wasScheduleActive = React.useRef(false);
  const crossfadeSignaled = React.useRef(false);

  const url = readString(props.url);
  const startTime = Math.max(0, readNumber(props.startTime));
  const sourceVolume = clamp(readNumber(props.volume, 1));
  const priority = readNumber(props.priority, role === 'background' ? 10 : 50);
  const forceMuted = readBoolean(props.muted);
  const oneShot = readBoolean(props.oneShot);
  const autoplay = props.autoplay === undefined ? true : readBoolean(props.autoplay);
  const fadeInMs = Math.max(0, readNumber(props.fadeInMs));
  const fadeOutMs = Math.max(0, readNumber(props.fadeOutMs));
  const duckBackground = props.duckBackground === undefined ? true : readBoolean(props.duckBackground);
  const loop = readBoolean(props.loop);
  const trackName = readString(props.trackName, 'Audio Indicator');

  const scheduleEnabled = readBoolean(props.scheduleEnabled);
  const scheduleStart = readString(props.scheduleStart, '00:00');
  const scheduleEnd = readString(props.scheduleEnd, '23:59');
  const scheduleDaysKey = Array.isArray(props.scheduleDays)
    ? props.scheduleDays.join(',')
    : readString(props.scheduleDays, '0,1,2,3,4,5,6');
  const schedule = React.useMemo<MediaSchedule>(() => ({
    enabled: scheduleEnabled,
    startTime: scheduleStart,
    endTime: scheduleEnd,
    days: parseScheduleDays(scheduleDaysKey),
  }), [scheduleDaysKey, scheduleEnabled, scheduleEnd, scheduleStart]);

  const setStartPosition = React.useCallback(() => {
    const element = mediaRef.current;
    if (!element || !Number.isFinite(startTime)) return;
    try {
      if (element.duration && startTime >= element.duration) element.currentTime = 0;
      else element.currentTime = startTime;
    } catch {
      // Some browsers reject currentTime before metadata is available.
    }
  }, [startTime]);

  const begin = React.useCallback(() => {
    const element = mediaRef.current;
    if (!element || !url) return;
    setStartPosition();
    crossfadeSignaled.current = false;
    if (fadeInMs > 0) element.volume = 0;

    if (context) {
      context.requestPlayback({
        id: idRef.current,
        element,
        role,
        mediaKind: kind,
        priority,
        sourceVolume,
        forceMuted,
        duckBackground,
        intendedPlay: true,
        fadeInMs,
      });
      element.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    } else {
      element.muted = forceMuted;
      element.volume = sourceVolume;
      element.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    }
  }, [context, duckBackground, fadeInMs, forceMuted, kind, priority, role, setStartPosition, sourceVolume, url]);

  const stop = React.useCallback((reset = false) => {
    const element = mediaRef.current;
    if (!element) return;
    if (context) context.stopPlayback(idRef.current, reset);
    else {
      element.pause();
      if (reset) setStartPosition();
    }
  }, [context, setStartPosition]);

  React.useEffect(() => {
    const tick = () => {
      const active = isScheduleActive(schedule);
      const justEnteredWindow = active && !wasScheduleActive.current;
      const justExitedWindow = !active && wasScheduleActive.current;
      wasScheduleActive.current = active;

      if (justExitedWindow) {
        stop(false);
        return;
      }

      if (!active) return;
      if (oneShot && schedule.enabled && justEnteredWindow) {
        begin();
        return;
      }
      if (!schedule.enabled && (autoplay || manualWanted) && justEnteredWindow) begin();
      if (schedule.enabled && !oneShot && (autoplay || manualWanted) && justEnteredWindow) begin();
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [autoplay, begin, manualWanted, oneShot, schedule, stop]);

  React.useEffect(() => {
    const element = mediaRef.current;
    if (!element) return;
    const mediaId = idRef.current;

    const handleLoadedMetadata = () => setStartPosition();
    const handleEnded = () => {
      context?.markEnded(mediaId);
      onEnded?.();
    };
    const handleTimeUpdate = () => {
      if (!onCrossfadeStart || fadeOutMs <= 0 || !Number.isFinite(element.duration)) return;
      const remaining = element.duration - element.currentTime;
      if (remaining <= fadeOutMs / 1000 && !crossfadeSignaled.current) {
        crossfadeSignaled.current = true;
        onCrossfadeStart();
      }
      if (remaining <= fadeOutMs / 1000) {
        const target = readNumber(element.dataset.accelTargetVolume, element.volume);
        element.volume = clamp(target * Math.max(0, remaining / (fadeOutMs / 1000)));
      }
    };

    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('ended', handleEnded);
    element.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('ended', handleEnded);
      element.removeEventListener('timeupdate', handleTimeUpdate);
      context?.unregister(mediaId);
    };
  }, [context, fadeOutMs, onCrossfadeStart, onEnded, setStartPosition]);

  React.useEffect(() => {
    if (!context || !mediaRef.current) return;
    const element = mediaRef.current;
    context.requestPlayback({
      id: idRef.current,
      element,
      role,
      mediaKind: kind,
      priority,
      sourceVolume,
      forceMuted,
      duckBackground,
      intendedPlay: !element.paused,
      fadeInMs: 0,
    });
  }, [context, duckBackground, forceMuted, kind, priority, role, sourceVolume]);

  if (!url) {
    if (kind === 'audio' && visual) {
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>Configure audio URL</span>
        </div>
      );
    }
    return null;
  }

  if (kind === 'video') {
    return (
      <video
        ref={(node) => { mediaRef.current = node; }}
        src={url}
        preload="auto"
        loop={loop && !oneShot}
        muted={forceMuted}
        playsInline
        style={style}
      />
    );
  }

  return (
    <div
      style={visual ? style : { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
      onClick={visual ? () => {
        if (mediaRef.current?.paused) {
          setManualWanted(true);
          begin();
        } else {
          setManualWanted(false);
          stop(false);
        }
      } : undefined}
    >
      <audio
        ref={(node) => { mediaRef.current = node; }}
        src={url}
        preload="auto"
        loop={loop && !oneShot}
      />
      {visual && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
          <span style={{ fontSize: 28 }}>♫</span>
          <strong style={{ fontSize: 12 }}>{trackName}</strong>
          <span style={{ fontSize: 10, opacity: 0.6 }}>{blocked ? 'Audio blocked — tap to enable' : mediaRef.current?.paused ? 'Tap to play' : 'Playing'}</span>
        </div>
      )}
    </div>
  );
}

function makeBackgroundTrack(url: string): GlobalMediaTrack {
  return {
    id: 'background_music',
    title: 'Background Music',
    url,
    kind: 'audio',
    volume: 1,
    startTime: 0,
    priority: 5,
  };
}

function mediaPropsForTrack(track: GlobalMediaTrack, config: ScreenAudioConfig): MediaProps {
  return {
    url: track.url,
    volume: track.volume,
    startTime: track.startTime,
    priority: track.priority,
    autoplay: true,
    loop: false,
    oneShot: false,
    duckBackground: false,
    fadeInMs: config.fadeBetweenTracksMs,
    fadeOutMs: config.fadeBetweenTracksMs,
    scheduleEnabled: track.schedule?.enabled || false,
    scheduleStart: track.schedule?.startTime || '00:00',
    scheduleEnd: track.schedule?.endTime || '23:59',
    scheduleDays: (track.schedule?.days || [0, 1, 2, 3, 4, 5, 6]).join(','),
  };
}

export function GlobalMediaPlane({ screen }: { screen: Screen }) {
  const config = React.useMemo(() => normalizeAudioConfig(screen.audioConfig), [screen.audioConfig]);
  const allTracks = React.useMemo(() => {
    const tracks = [...config.playlist].filter((track) => Boolean(track.url));
    if (config.backgroundMusic && !tracks.some((track) => track.url === config.backgroundMusic)) {
      tracks.unshift(makeBackgroundTrack(config.backgroundMusic));
    }
    return tracks;
  }, [config.backgroundMusic, config.playlist]);

  const [currentId, setCurrentId] = React.useState<string | null>(allTracks[0]?.id || null);
  const [incomingId, setIncomingId] = React.useState<string | null>(null);
  const [, setClock] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeTracks = allTracks.filter((track) => isScheduleActive(track.schedule));
  const current = activeTracks.find((track) => track.id === currentId) || activeTracks[0];
  const incoming = activeTracks.find((track) => track.id === incomingId);

  React.useEffect(() => {
    if (!current && activeTracks[0]) setCurrentId(activeTracks[0].id);
    if (current && !activeTracks.some((track) => track.id === current.id)) setCurrentId(activeTracks[0]?.id || null);
  }, [activeTracks, current]);

  if (!current || !config.enabled || !isScheduleActive(config.schedule) || isQuietHours(config)) return null;

  const nextTrack = () => {
    const index = activeTracks.findIndex((track) => track.id === current.id);
    return activeTracks[(index + 1) % activeTracks.length];
  };

  const startCrossfade = () => {
    if (config.coordinationMode === 'exclusive' || activeTracks.length <= 1 || incomingId) return;
    const next = nextTrack();
    if (next && next.id !== current.id) setIncomingId(next.id);
  };

  const finishCurrent = () => {
    if (incomingId) {
      setCurrentId(incomingId);
      setIncomingId(null);
      return;
    }
    const next = nextTrack();
    if (next) setCurrentId(next.id);
  };

  return (
    <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      <CoordinatedMedia
        key={current.id}
        sourceId={`global_${current.id}`}
        kind={current.kind}
        role="background"
        visual={false}
        props={{ ...mediaPropsForTrack(current, config), loop: activeTracks.length === 1 }}
        onCrossfadeStart={activeTracks.length > 1 ? startCrossfade : undefined}
        onEnded={finishCurrent}
      />
      {incoming && (
        <CoordinatedMedia
          key={incoming.id}
          sourceId={`global_${incoming.id}`}
          kind={incoming.kind}
          role="background"
          visual={false}
          props={mediaPropsForTrack(incoming, config)}
        />
      )}
    </div>
  );
}

export function coordinationModeLabel(mode: AudioCoordinationMode) {
  if (mode === 'mix') return 'Mixer: allow simultaneous audio';
  if (mode === 'exclusive') return 'Exclusive: one audio source at a time';
  return 'Priority: foreground wins, background may duck';
}
