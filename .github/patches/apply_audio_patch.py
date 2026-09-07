from pathlib import Path

path = Path('accel_preview/src/App.tsx')
text = path.read_text()


def replace_once(old: str, new: str, label: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
"""import type { 
  Organization, Location, Screen, Slide, TileInstance, 
  MenuSection, MenuItem, Campaign, TileTemplate, TileTypeKey, DataBinding, RenderContext 
} from './types';
""",
"""import type { 
  Organization, Location, Screen, Slide, TileInstance, 
  MenuSection, MenuItem, Campaign, TileTemplate, TileTypeKey, DataBinding, RenderContext,
  GlobalMediaTrack, ScreenAudioConfig
} from './types';
import {
  ApplicationAudioProvider,
  CoordinatedMedia,
  GlobalMediaPlane,
  ScreenAudioProvider,
  coordinationModeLabel,
  normalizeAudioConfig,
  useApplicationAudio,
} from './lib/audio';
""",
'import audio helpers',
)

replace_once(
"""  video: { label: 'Video File', icon: Video, category: 'Core', defaultProps: { url: '', loop: true, muted: true, autoplay: true } },
  audio: { label: 'Audio', icon: Music, category: 'Core', defaultProps: { url: '', volume: 0.5, loop: true } },
""",
"""  video: { label: 'Video File', icon: Video, category: 'Core', defaultProps: {
    url: '', loop: true, muted: true, autoplay: true, startTime: 0, volume: 1,
    priority: 50, duckBackground: true, oneShot: false, fadeInMs: 250, fadeOutMs: 250,
    scheduleEnabled: false, scheduleStart: '00:00', scheduleEnd: '23:59', scheduleDays: '0,1,2,3,4,5,6'
  } },
  audio: { label: 'Audio Indicator', icon: Music, category: 'Core', defaultProps: {
    trackName: 'Background Jazz', url: '', volume: 0.5, loop: false, autoplay: true, startTime: 0,
    priority: 60, duckBackground: true, oneShot: false, fadeInMs: 250, fadeOutMs: 250,
    scheduleEnabled: false, scheduleStart: '00:00', scheduleEnd: '23:59', scheduleDays: '0,1,2,3,4,5,6'
  } },
""",
'upgrade media tile defaults',
)

replace_once(
"""function PlatformApp() {
  const [activeTab, setActiveTab] = useState<'screens'|'menu'|'campaigns'|'kpi'>('screens');
""",
"""function PlatformApp() {
  const applicationAudio = useApplicationAudio();
  const [activeTab, setActiveTab] = useState<'screens'|'menu'|'campaigns'|'kpi'>('screens');
""",
'add application audio state',
)

replace_once(
"""        <div className=\"flex items-center gap-3\">
          <button 
""",
"""        <div className=\"flex items-center gap-3\">
          <div className=\"flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700\" title=\"Application audio volume\">
            <button
              onClick={() => applicationAudio.setMuted(!applicationAudio.muted)}
              className={`p-1 rounded ${applicationAudio.muted ? 'text-red-400' : 'text-orange-400'}`}
              title={applicationAudio.muted ? 'Unmute application audio' : 'Mute application audio'}
            >
              <Music size={14} />
            </button>
            <input
              aria-label=\"Application volume\"
              type=\"range\"
              min=\"0\"
              max=\"1\"
              step=\"0.01\"
              value={applicationAudio.volume}
              onChange={(e) => applicationAudio.setVolume(Number(e.target.value))}
              className=\"w-20 accent-orange-500\"
            />
            <span className=\"text-[10px] font-mono text-neutral-400 w-8 text-right\">{Math.round(applicationAudio.volume * 100)}%</span>
          </div>
          <button 
""",
'add app volume control',
)

replace_once(
"""export default function AccelRestaurants_Platform() {
  // Simple Routing for Deployed Player (Hash-based for GitHub Pages compatibility)
  const isPlayer = window.location.hash.startsWith('#/s/');
  const playerScreenId = isPlayer ? window.location.hash.split('#/s/')[1] : null;

  if (isPlayer && playerScreenId) {
     return <StandalonePlayer screenId={playerScreenId} />;
  }

  return <PlatformApp />;
}
""",
"""function AppRouter() {
  // Simple Routing for Deployed Player (Hash-based for GitHub Pages compatibility)
  const isPlayer = window.location.hash.startsWith('#/s/');
  const playerScreenId = isPlayer ? window.location.hash.split('#/s/')[1] : null;

  if (isPlayer && playerScreenId) {
     return <StandalonePlayer screenId={playerScreenId} />;
  }

  return <PlatformApp />;
}

export default function AccelRestaurants_Platform() {
  return (
    <ApplicationAudioProvider>
      <AppRouter />
    </ApplicationAudioProvider>
  );
}
""",
'wrap application audio provider',
)

replace_once(
"""  return (
    <div className=\"fixed inset-0 z-100 bg-black flex items-center justify-center\">
      <div style={{ 
        width: currentSlide.width, 
        height: currentSlide.height, 
        transform: `scale(${scale})`, 
        backgroundColor: currentSlide.background,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)' 
      }}>
        {currentSlide.elements.sort((a,b) => a.zIndex - b.zIndex).map(el => (
          <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.zIndex, opacity: el.opacity }}>
            <TileRenderer type={el.type} props={el.props} dimensions={{w: el.width, h: el.height}} binding={el.binding} context={renderContext} />
          </div>
        ))}
      </div>
      <button onClick={onClose} className=\"absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur transition-colors\">
        <X size={24} />
      </button>
      <div className=\"absolute bottom-4 left-4 text-white/30 text-xs pointer-events-none\">
        Playing: {screen.name} • Slide {currentSlideIndex + 1}/{playlist.length}
      </div>
    </div>
  );
""",
"""  return (
    <ScreenAudioProvider screen={screen}>
      <div className=\"fixed inset-0 z-100 bg-black flex items-center justify-center\">
        {/* Persistent media plane: mounted once for the screen, independent of slide rotation. */}
        <GlobalMediaPlane screen={screen} />
        <div style={{ 
          width: currentSlide.width, 
          height: currentSlide.height, 
          transform: `scale(${scale})`, 
          backgroundColor: currentSlide.background,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)' 
        }}>
          {currentSlide.elements.sort((a,b) => a.zIndex - b.zIndex).map(el => (
            <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.zIndex, opacity: el.opacity }}>
              <TileRenderer type={el.type} props={el.props} dimensions={{w: el.width, h: el.height}} binding={el.binding} context={renderContext} />
            </div>
          ))}
        </div>
        <button onClick={onClose} className=\"absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur transition-colors\">
          <X size={24} />
        </button>
        <div className=\"absolute bottom-4 left-4 text-white/30 text-xs pointer-events-none\">
          Playing: {screen.name} • Slide {currentSlideIndex + 1}/{playlist.length}
        </div>
      </div>
    </ScreenAudioProvider>
  );
""",
'add persistent global media plane',
)

replace_once(
"""  const playingScreen = location?.screens.find(s => s.id === playingScreenId);

  if (!location) return <div>Loading...</div>;
""",
"""  const playingScreen = location?.screens.find(s => s.id === playingScreenId);
  const editingAudioConfig = normalizeAudioConfig(editingScreen?.audioConfig);

  const updateEditingAudio = (updates: Partial<ScreenAudioConfig>) => {
    if (!editingScreen) return;
    const nextAudioConfig = { ...editingAudioConfig, ...updates };
    onUpdateLocation({
      ...location,
      screens: location.screens.map((screen) => screen.id === editingScreen.id ? { ...screen, audioConfig: nextAudioConfig } : screen),
    });
  };

  const updateAudioSchedule = (key: 'schedule' | 'quietHours', updates: Partial<ScreenAudioConfig['schedule']>) => {
    updateEditingAudio({ [key]: { ...editingAudioConfig[key], ...updates } } as Partial<ScreenAudioConfig>);
  };

  const updatePlaylistTrack = (index: number, updates: Partial<GlobalMediaTrack>) => {
    const playlist = editingAudioConfig.playlist.map((track, trackIndex) => trackIndex === index ? { ...track, ...updates } : track);
    updateEditingAudio({ playlist });
  };

  const addPlaylistTrack = () => {
    updateEditingAudio({
      playlist: [...editingAudioConfig.playlist, {
        id: generateId(), title: 'New Track', url: '', kind: 'audio', volume: 1, startTime: 0, priority: 10,
        schedule: { enabled: false, startTime: '00:00', endTime: '23:59', days: [0,1,2,3,4,5,6] }
      }],
    });
  };

  const removePlaylistTrack = (index: number) => {
    updateEditingAudio({ playlist: editingAudioConfig.playlist.filter((_, trackIndex) => trackIndex !== index) });
  };

  if (!location) return <div>Loading...</div>;
""",
'add screen audio editing helpers',
)

replace_once(
"""            <div className=\"bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-[500px] shadow-2xl\" onClick={e => e.stopPropagation()}>
""",
"""            <div className=\"bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-[760px] max-h-[90vh] overflow-y-auto shadow-2xl\" onClick={e => e.stopPropagation()}>
""",
'expand screen settings modal',
)

replace_once(
"""                  )}
               </div>

               <div className=\"mt-6 flex justify-end\">
""",
"""                  )}

                  <div className=\"pt-5 mt-5 border-t border-neutral-800 space-y-4\">
                    <div className=\"flex items-center justify-between\">
                      <div>
                        <h4 className=\"font-bold text-sm flex items-center gap-2\"><Music size={16} className=\"text-orange-500\" /> Audio / Global Media Plane</h4>
                        <p className=\"text-[10px] text-neutral-500 mt-1\">Persistent audio survives slide changes. Slide media remains independently scheduled and coordinated.</p>
                      </div>
                      <label className=\"flex items-center gap-2 text-xs text-neutral-300\">
                        <input type=\"checkbox\" checked={editingAudioConfig.enabled} onChange={(e) => updateEditingAudio({ enabled: e.target.checked })} />
                        Audio enabled
                      </label>
                    </div>

                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <label className=\"text-xs font-bold text-neutral-500 uppercase block mb-1\">Master Volume</label>
                        <div className=\"flex items-center gap-2\">
                          <input type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" value={editingAudioConfig.masterVolume} onChange={(e) => updateEditingAudio({ masterVolume: Number(e.target.value) })} className=\"flex-1 accent-orange-500\" />
                          <span className=\"text-xs font-mono w-10 text-right\">{Math.round(editingAudioConfig.masterVolume * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <label className=\"text-xs font-bold text-neutral-500 uppercase block mb-1\">Coordination Mode</label>
                        <select value={editingAudioConfig.coordinationMode} onChange={(e) => updateEditingAudio({ coordinationMode: e.target.value as ScreenAudioConfig['coordinationMode'] })} className=\"w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-xs\">
                          <option value=\"mix\">Mixer — allow simultaneous audio</option>
                          <option value=\"priority\">Priority — foreground wins / background ducks</option>
                          <option value=\"exclusive\">Exclusive — one source at a time</option>
                        </select>
                        <div className=\"text-[9px] text-neutral-500 mt-1\">{coordinationModeLabel(editingAudioConfig.coordinationMode)}</div>
                      </div>
                    </div>

                    <div className=\"grid grid-cols-2 gap-4\">
                      <label className=\"flex items-center gap-2 text-xs text-neutral-300\">
                        <input type=\"checkbox\" checked={editingAudioConfig.allowVideoAudio} onChange={(e) => updateEditingAudio({ allowVideoAudio: e.target.checked })} />
                        Allow video audio
                      </label>
                      <label className=\"flex items-center gap-2 text-xs text-neutral-300\">
                        <input type=\"checkbox\" checked={editingAudioConfig.duckingEnabled} onChange={(e) => updateEditingAudio({ duckingEnabled: e.target.checked })} />
                        Duck background for foreground media
                      </label>
                    </div>

                    {editingAudioConfig.duckingEnabled && (
                      <div>
                        <label className=\"text-xs font-bold text-neutral-500 uppercase block mb-1\">Ducked Background Level</label>
                        <div className=\"flex items-center gap-2\">
                          <input type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" value={editingAudioConfig.duckLevel} onChange={(e) => updateEditingAudio({ duckLevel: Number(e.target.value) })} className=\"flex-1 accent-orange-500\" />
                          <span className=\"text-xs font-mono w-10 text-right\">{Math.round(editingAudioConfig.duckLevel * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className=\"text-xs font-bold text-neutral-500 uppercase block mb-1\">Background Music URL</label>
                      <input type=\"text\" value={editingAudioConfig.backgroundMusic} onChange={(e) => updateEditingAudio({ backgroundMusic: e.target.value })} className=\"w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-xs\" placeholder=\"https://.../dinner-jazz.mp3\" />
                    </div>

                    <div className=\"grid grid-cols-2 gap-4\">
                      <div>
                        <label className=\"text-xs font-bold text-neutral-500 uppercase block mb-1\">Fade Between Tracks (ms)</label>
                        <input type=\"number\" min=\"0\" value={editingAudioConfig.fadeBetweenTracksMs} onChange={(e) => updateEditingAudio({ fadeBetweenTracksMs: Number(e.target.value) })} className=\"w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white\" />
                      </div>
                      <div className=\"bg-neutral-950/60 border border-neutral-800 rounded p-3\">
                        <label className=\"flex items-center gap-2 text-xs text-neutral-300\">
                          <input type=\"checkbox\" checked={editingAudioConfig.schedule.enabled} onChange={(e) => updateAudioSchedule('schedule', { enabled: e.target.checked })} />
                          Screen audio schedule
                        </label>
                        <div className=\"grid grid-cols-2 gap-2 mt-2\">
                          <input type=\"time\" value={editingAudioConfig.schedule.startTime} onChange={(e) => updateAudioSchedule('schedule', { startTime: e.target.value })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" />
                          <input type=\"time\" value={editingAudioConfig.schedule.endTime} onChange={(e) => updateAudioSchedule('schedule', { endTime: e.target.value })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" />
                        </div>
                        <input type=\"text\" value={editingAudioConfig.schedule.days.join(',')} onChange={(e) => updateAudioSchedule('schedule', { days: e.target.value.split(',').map(Number).filter((day) => day >= 0 && day <= 6) })} className=\"mt-2 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" placeholder=\"Days: 0,1,2,3,4,5,6\" />
                      </div>
                    </div>

                    <div className=\"bg-neutral-950/60 border border-neutral-800 rounded p-3\">
                      <label className=\"flex items-center gap-2 text-xs text-neutral-300\">
                        <input type=\"checkbox\" checked={editingAudioConfig.quietHours.enabled} onChange={(e) => updateAudioSchedule('quietHours', { enabled: e.target.checked })} />
                        Quiet hours (scheduler override)
                      </label>
                      <div className=\"grid grid-cols-3 gap-2 mt-2\">
                        <input type=\"time\" value={editingAudioConfig.quietHours.startTime} onChange={(e) => updateAudioSchedule('quietHours', { startTime: e.target.value })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" />
                        <input type=\"time\" value={editingAudioConfig.quietHours.endTime} onChange={(e) => updateAudioSchedule('quietHours', { endTime: e.target.value })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" />
                        <input type=\"text\" value={editingAudioConfig.quietHours.days.join(',')} onChange={(e) => updateAudioSchedule('quietHours', { days: e.target.value.split(',').map(Number).filter((day) => day >= 0 && day <= 6) })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" placeholder=\"0,1,2,3,4,5,6\" />
                      </div>
                    </div>

                    <div className=\"space-y-2\">
                      <div className=\"flex items-center justify-between\">
                        <div>
                          <label className=\"text-xs font-bold text-neutral-500 uppercase block\">Playlist</label>
                          <p className=\"text-[9px] text-neutral-600\">Audio files or video files used as audio-only background tracks.</p>
                        </div>
                        <button onClick={addPlaylistTrack} className=\"px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-xs hover:border-orange-500\"><Plus size={12} className=\"inline mr-1\" />Track</button>
                      </div>
                      {editingAudioConfig.playlist.map((track, trackIndex) => (
                        <div key={track.id || trackIndex} className=\"bg-neutral-950 border border-neutral-800 rounded p-3 space-y-2\">
                          <div className=\"grid grid-cols-[90px_1fr_32px] gap-2\">
                            <select value={track.kind} onChange={(e) => updatePlaylistTrack(trackIndex, { kind: e.target.value as GlobalMediaTrack['kind'] })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\">
                              <option value=\"audio\">Audio</option>
                              <option value=\"video\">Video audio</option>
                            </select>
                            <input value={track.title} onChange={(e) => updatePlaylistTrack(trackIndex, { title: e.target.value })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" placeholder=\"Track name\" />
                            <button onClick={() => removePlaylistTrack(trackIndex)} className=\"text-red-500 hover:bg-red-950 rounded\"><Trash2 size={14} className=\"mx-auto\" /></button>
                          </div>
                          <input value={track.url} onChange={(e) => updatePlaylistTrack(trackIndex, { url: e.target.value })} className=\"w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" placeholder=\"https://... media URL\" />
                          <div className=\"grid grid-cols-3 gap-2\">
                            <label className=\"text-[9px] text-neutral-500\">Volume
                              <input type=\"number\" min=\"0\" max=\"1\" step=\"0.05\" value={track.volume} onChange={(e) => updatePlaylistTrack(trackIndex, { volume: Number(e.target.value) })} className=\"mt-1 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs text-white\" />
                            </label>
                            <label className=\"text-[9px] text-neutral-500\">Start Time (s)
                              <input type=\"number\" min=\"0\" value={track.startTime} onChange={(e) => updatePlaylistTrack(trackIndex, { startTime: Number(e.target.value) })} className=\"mt-1 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs text-white\" />
                            </label>
                            <label className=\"text-[9px] text-neutral-500\">Priority
                              <input type=\"number\" min=\"0\" value={track.priority} onChange={(e) => updatePlaylistTrack(trackIndex, { priority: Number(e.target.value) })} className=\"mt-1 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs text-white\" />
                            </label>
                          </div>
                          <div className=\"grid grid-cols-[110px_1fr_1fr] gap-2 items-center\">
                            <label className=\"flex items-center gap-2 text-[10px] text-neutral-400\">
                              <input type=\"checkbox\" checked={track.schedule?.enabled || false} onChange={(e) => updatePlaylistTrack(trackIndex, { schedule: { enabled: e.target.checked, startTime: track.schedule?.startTime || '00:00', endTime: track.schedule?.endTime || '23:59', days: track.schedule?.days || [0,1,2,3,4,5,6] } })} /> Scheduled
                            </label>
                            <input type=\"time\" value={track.schedule?.startTime || '00:00'} onChange={(e) => updatePlaylistTrack(trackIndex, { schedule: { enabled: track.schedule?.enabled || false, startTime: e.target.value, endTime: track.schedule?.endTime || '23:59', days: track.schedule?.days || [0,1,2,3,4,5,6] } })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" />
                            <input type=\"time\" value={track.schedule?.endTime || '23:59'} onChange={(e) => updatePlaylistTrack(trackIndex, { schedule: { enabled: track.schedule?.enabled || false, startTime: track.schedule?.startTime || '00:00', endTime: e.target.value, days: track.schedule?.days || [0,1,2,3,4,5,6] } })} className=\"bg-neutral-900 border border-neutral-700 rounded p-1 text-xs\" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className=\"mt-6 flex justify-end\">
""",
'add screen audio settings',
)

replace_once(
"""                    {key.includes('color') || key === 'bg' ? (
                      <div className=\"flex gap-2\">
                        <input
                          type=\"color\"
                          value={val as string}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              props: { ...selectedEl.props, [key]: e.target.value },
                            })
                          }
                          className=\"h-8 w-8 bg-transparent cursor-pointer\"
                        />
                        <input
                          type=\"text\"
                          value={val as string}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              props: { ...selectedEl.props, [key]: e.target.value },
                            })
                          }
                          className=\"flex-1 bg-neutral-950 border border-neutral-700 rounded p-1 text-xs\"
                        />
                      </div>
                    ) : (
                      <input
                        type={typeof val === 'number' ? 'number' : 'text'}
                        value={val as any}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            props: {
                              ...selectedEl.props,
                              [key]:
                                e.target.type === 'number'
                                  ? Number(e.target.value)
                                  : e.target.value,
                            },
                          })
                        }
                        className=\"w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs\"
                      />
                    )}
""",
"""                    {typeof val === 'boolean' ? (
                      <label className=\"flex items-center gap-2 text-xs text-neutral-300 bg-neutral-950 border border-neutral-700 rounded p-2\">
                        <input
                          type=\"checkbox\"
                          checked={val as boolean}
                          onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.checked } })}
                        />
                        {val ? 'Enabled' : 'Disabled'}
                      </label>
                    ) : key.includes('color') || key === 'bg' ? (
                      <div className=\"flex gap-2\">
                        <input
                          type=\"color\"
                          value={val as string}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              props: { ...selectedEl.props, [key]: e.target.value },
                            })
                          }
                          className=\"h-8 w-8 bg-transparent cursor-pointer\"
                        />
                        <input
                          type=\"text\"
                          value={val as string}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              props: { ...selectedEl.props, [key]: e.target.value },
                            })
                          }
                          className=\"flex-1 bg-neutral-950 border border-neutral-700 rounded p-1 text-xs\"
                        />
                      </div>
                    ) : key === 'scheduleStart' || key === 'scheduleEnd' ? (
                      <input
                        type=\"time\"
                        value={String(val)}
                        onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.value } })}
                        className=\"w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs\"
                      />
                    ) : key === 'volume' || key === 'duckLevel' ? (
                      <div className=\"flex items-center gap-2\">
                        <input
                          type=\"range\"
                          min=\"0\"
                          max=\"1\"
                          step=\"0.01\"
                          value={Number(val)}
                          onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: Number(e.target.value) } })}
                          className=\"flex-1 accent-orange-500\"
                        />
                        <span className=\"text-[10px] font-mono w-10 text-right\">{Math.round(Number(val) * 100)}%</span>
                      </div>
                    ) : (
                      <input
                        type={typeof val === 'number' ? 'number' : 'text'}
                        value={val as any}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            props: {
                              ...selectedEl.props,
                              [key]:
                                e.target.type === 'number'
                                  ? Number(e.target.value)
                                  : e.target.value,
                            },
                          })
                        }
                        className=\"w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs\"
                      />
                    )}
""",
'upgrade media property inputs',
)

replace_once(
"""    case 'video':
      if (!finalProps.url) return null;
      return (
        <video
          src={finalProps.url}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: containerStyle.borderRadius,
          }}
          loop={finalProps.loop}
          muted={finalProps.muted}
          autoPlay={finalProps.autoplay}
          playsInline
        />
      );

    case 'audio':
      return (
        <div
          style={{
            ...containerStyle,
            backgroundColor: finalProps.bg || '#111',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Music size={32} className=\"text-orange-500 mb-2 animate-bounce\" />
          <audio
            controls
            autoPlay={finalProps.autoplay}
            loop={finalProps.loop}
            style={{ width: '100%', height: 30 }}
          >
            {finalProps.url && <source src={finalProps.url} />}
          </audio>
        </div>
      );
""",
"""    case 'video':
      if (!finalProps.url) return null;
      return (
        <CoordinatedMedia
          kind=\"video\"
          props={finalProps}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: containerStyle.borderRadius,
          }}
        />
      );

    case 'audio':
      return (
        <CoordinatedMedia
          kind=\"audio\"
          props={finalProps}
          style={{
            ...containerStyle,
            backgroundColor: finalProps.bg || '#111',
            padding: 10,
            borderRadius: 8,
          }}
        />
      );
""",
'wire coordinated media tiles',
)

path.write_text(text)
print('Applied AccelRestaurants audio experience transformations successfully.')
