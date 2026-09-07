import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Layout, Monitor, Image as ImageIcon, Type, Video, 
  Save, Play, 
  Plus, Trash2, Settings, Layers, ChevronLeft, 
  Move,
  Clock, MapPin, Grid, DollarSign, Box, Utensils,
  QrCode, Sun, Star, MessageSquare,
  ListChecks, Calendar,
  TrendingUp, Globe, AlertCircle, Music,
  PieChart as PieIcon, BarChart as BarIcon, Activity, User, Mic, Cloud, 
  Link as LinkIcon, Edit3, ArrowUpRight, Rocket, Copy, X, Megaphone,
  Film, Frame, BatteryCharging, FileSpreadsheet, CloudLightning, Code, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { api } from './lib/api';
import type { 
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

/**
 * --- ACCEL RESTAURANTS™ PLATFORM (FINAL) ---
 * Complete Production-Level Platform
 * Version: 3.0.0-gold
 */

// --- 2. THE STRICT 46-TILE REGISTRY ---

const TILE_REGISTRY: Record<TileTypeKey, { label: string; icon: any; defaultProps: any; category: string }> = {
  // Core Media & Text
  text: { label: 'Text Block', icon: Type, category: 'Core', defaultProps: { content: 'Double click to edit', fontSize: 32, color: '#ffffff', textAlign: 'left', fontFamily: 'Inter', fontWeight: 'normal' } },
  image: { label: 'Image', icon: ImageIcon, category: 'Core', defaultProps: { url: 'https://placehold.co/400x300/222/fff?text=Image', fit: 'cover', radius: 8 } },
  video: { label: 'Video File', icon: Video, category: 'Core', defaultProps: {
    url: '', loop: true, muted: true, autoplay: true, startTime: 0, volume: 1,
    priority: 50, duckBackground: true, oneShot: false, fadeInMs: 250, fadeOutMs: 250,
    scheduleEnabled: false, scheduleStart: '00:00', scheduleEnd: '23:59', scheduleDays: '0,1,2,3,4,5,6'
  } },
  audio: { label: 'Audio Indicator', icon: Music, category: 'Core', defaultProps: {
    trackName: 'Background Jazz', url: '', volume: 0.5, loop: false, autoplay: true, startTime: 0,
    priority: 60, duckBackground: true, oneShot: false, fadeInMs: 250, fadeOutMs: 250,
    scheduleEnabled: false, scheduleStart: '00:00', scheduleEnd: '23:59', scheduleDays: '0,1,2,3,4,5,6'
  } },
  gif: { label: 'Animated GIF', icon: Film, category: 'Core', defaultProps: { url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif' } },
  
  // Shapes & Backgrounds
  shape: { label: 'Shape', icon: Box, category: 'Design', defaultProps: { bg: '#fbbf24', radius: 0, opacity: 1 } },
  gradient: { label: 'Gradient', icon: Frame, category: 'Design', defaultProps: { colors: '#1f2937,#fbbf24', direction: 'to right' } },
  scene: { label: 'Scene Slideshow', icon: ImageIcon, category: 'Design', defaultProps: { urls: [], interval: 5000, fade: true } },
  
  // Data & Charts
  bar: { label: 'Bar Chart', icon: BarIcon, category: 'Data', defaultProps: { data: '30,50,80,40,90', color: '#fbbf24' } },
  pie: { label: 'Pie Chart', icon: PieIcon, category: 'Data', defaultProps: { data: '60,40', colors: '#fbbf24,#374151' } },
  table: { label: 'Data Table', icon: Grid, category: 'Data', defaultProps: { csv: 'Item,Price\nBurger,12.00\nFries,4.00', headerColor: '#fbbf24' } },
  progress: { label: 'Progress Bar', icon: BatteryCharging, category: 'Data', defaultProps: { value: 75, max: 100, color: '#10b981' } },
  sheetcell: { label: 'Google Sheet Cell', icon: FileSpreadsheet, category: 'Data', defaultProps: { url: '', cell: 'A1' } },
  
  // Dynamic Feeds
  rss: { label: 'RSS Ticker', icon: Activity, category: 'Feeds', defaultProps: { url: '', speed: 50 } },
  marquee: { label: 'Marquee Text', icon: Move, category: 'Feeds', defaultProps: { text: 'Welcome to AccelRestaurants', speed: 10, bg: 'transparent' } },
  quote: { label: 'Random Quote', icon: MessageSquare, category: 'Feeds', defaultProps: { topic: 'food', interval: 60000 } },
  random_image: { label: 'Random Image', icon: ImageIcon, category: 'Feeds', defaultProps: { keyword: 'food', interval: 60000 } },
  
  // Time & Weather
  clock: { label: 'Digital Clock', icon: Clock, category: 'Time', defaultProps: { format: '12h', showSeconds: false, color: '#fff' } },
  date: { label: 'Current Date', icon: Calendar, category: 'Time', defaultProps: { format: 'MM/DD/YYYY', color: '#fff' } },
  timer: { label: 'Count Up', icon: Clock, category: 'Time', defaultProps: { start: '2024-01-01', label: 'Since Opening' } },
  countdown: { label: 'Countdown', icon: Clock, category: 'Time', defaultProps: { target: '2025-01-01', label: 'New Year' } },
  weather: { label: 'Simple Weather', icon: Sun, category: 'Weather', defaultProps: { city: 'New York', units: 'F' } },
  weather_detailed: { label: 'Detailed Weather', icon: Cloud, category: 'Weather', defaultProps: { city: 'New York' } },
  weather_icon: { label: 'Weather Icon', icon: CloudLightning, category: 'Weather', defaultProps: { city: 'New York' } },
  emojiWeather: { label: 'Emoji Weather', icon: Sun, category: 'Weather', defaultProps: { city: 'New York' } },
  
  // Embeds & Web
  html: { label: 'Raw HTML', icon: Code, category: 'Embed', defaultProps: { code: '<div style="color:red">Hello</div>' } },
  iframe: { label: 'Website Embed', icon: Globe, category: 'Embed', defaultProps: { url: 'https://example.com' } },
  youtube: { label: 'YouTube', icon: Video, category: 'Embed', defaultProps: { videoId: 'dQw4w9WgXcQ', autoplay: true } },
  vimeo: { label: 'Vimeo', icon: Video, category: 'Embed', defaultProps: { videoId: '' } },
  
  // Specialized & Interactive
  qrcode: { label: 'QR Generator', icon: QrCode, category: 'Tools', defaultProps: { data: 'https://accelanalysis.com', color: '#000000', bg: '#ffffff' } },
  crypto: { label: 'Crypto Price', icon: DollarSign, category: 'Finance', defaultProps: { symbol: 'BTC', currency: 'USD' } },
  stock: { label: 'Stock Ticker', icon: TrendingUp, category: 'Finance', defaultProps: { symbol: 'AAPL' } },
  status: { label: 'Status Light', icon: AlertCircle, category: 'Tools', defaultProps: { status: 'ok' } }, // ok, warn, alert
  icon: { label: 'Icon/Emoji', icon: Star, category: 'Design', defaultProps: { icon: 'star', size: 64, color: '#fbbf24' } },
  menu: { label: 'Menu Grid', icon: Utensils, category: 'Restaurant', defaultProps: { items: [{n:'Burger', p:'10'}, {n:'Fries', p:'5'}], columns: 1 } },
  list: { label: 'List View', icon: ListChecks, category: 'Design', defaultProps: { items: 'Item 1,Item 2,Item 3', bullet: '•' } },
  flipboard: { label: 'Flip Counter', icon: Type, category: 'Animation', defaultProps: { number: 12345 } },
  mic: { label: 'Audio Viz', icon: Mic, category: 'Tools', defaultProps: { sensitivity: 50 } },
  openai: { label: 'AI Text', icon: Box, category: 'AI', defaultProps: { prompt: 'Daily food joke' } },
  camera: { label: 'HLS Stream', icon: Video, category: 'Tools', defaultProps: { url: '' } },
  carousel: { label: 'Carousel', icon: Layers, category: 'Design', defaultProps: { items: [], speed: 3000 } },
  avatar: { label: 'Avatar', icon: User, category: 'Design', defaultProps: { url: '', border: '#fbbf24' } },
  '3dmodel': { label: '3D Model', icon: Box, category: 'Advanced', defaultProps: { url: '' } },
  lottie: { label: 'Lottie Anim', icon: Activity, category: 'Animation', defaultProps: { url: '' } },
  map: { label: 'Google Map', icon: MapPin, category: 'Tools', defaultProps: { location: 'New York' } },
  particles: { label: 'Particles', icon: Cloud, category: 'Animation', defaultProps: { type: 'snow' } },
  news: { label: 'News Feed', icon: Globe, category: 'Feeds', defaultProps: { url: '', speed: 50 } },
  social: { label: 'Social Feed', icon: Globe, category: 'Feeds', defaultProps: { url: '', speed: 50 } },
  button: { label: 'Button', icon: Star, category: 'Core', defaultProps: { label: 'Click me', bg: 'blue', onClick: () => {} } },
  chart: { label: 'Chart', icon: BarIcon, category: 'Data', defaultProps: { data: '30,50,80,40,90', color: '#fbbf24' } },
  calendar: { label: 'Calendar', icon: Calendar, category: 'Time', defaultProps: { date: new Date().toLocaleDateString() } },
  alert: { label: 'Alert', icon: AlertCircle, category: 'Tools', defaultProps: { message: 'Alert message' } },
  custom: { label: 'Custom', icon: Code, category: 'Advanced', defaultProps: { code: '<div>Hello</div>' } },
  link: { label: 'Link', icon: LinkIcon, category: 'Core', defaultProps: { url: '#', text: 'Link' } },
  gallery: { label: 'Image Gallery', icon: ImageIcon, category: 'Core', defaultProps: { urls: [], columns: 2 } },
};

// --- 3. MOCK DATA INITIALIZATION ---

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- 4. MAIN APPLICATION COMPONENT ---

function StandalonePlayer({ screenId }: { screenId: string }) {
  const [data, setData] = useState<{ screen: Screen, slides: Slide[], menuItems: MenuItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicScreen(screenId).then(d => {
       if (d) setData(d);
       else setError('Screen not found');
    });
  }, [screenId]);

  if (error) return <div className="text-white flex items-center justify-center h-screen bg-black">{error}</div>;
  if (!data) return <div className="text-white flex items-center justify-center h-screen bg-black">Loading Screen...</div>;

  const renderContext: RenderContext = { menuItems: data.menuItems, campaigns: [] };

  return (
    <Player 
      screen={data.screen} 
      slides={data.slides} 
      onClose={() => {}} 
      renderContext={renderContext} 
    />
  );
}

function PlatformApp() {
  const applicationAudio = useApplicationAudio();
  const [activeTab, setActiveTab] = useState<'screens'|'menu'|'campaigns'|'kpi'>('screens');
  
  // Data State
  const [org, setOrg] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [templates, setTemplates] = useState<TileTemplate[]>([]);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const activeLocation = locations.find(l => l.id === activeLocationId);
  const activeSlide = slides.find(s => s.id === editingSlideId);

  // --- Global Context for Renderer ---
  const renderContext = useMemo(() => ({ menuItems, campaigns }), [menuItems, campaigns]);

  // --- Initial Load ---
  useEffect(() => {
    const init = async () => {
      const orgs = await api.getOrganizations();
      if (orgs.length > 0) {
        const o = orgs[0];
        setOrg(o);
        const [locs, sls, men, tmpls, camps] = await Promise.all([
          api.getLocations(o.id),
          api.getSlides(o.id),
          api.getMenu(o.id),
          api.getTemplates(o.id),
          api.getCampaigns(o.id)
        ]);
        setLocations(locs);
        setSlides(sls);
        setMenuSections(men.sections);
        setMenuItems(men.items);
        setTemplates(tmpls);
        setCampaigns(camps);
        if (locs.length > 0) setActiveLocationId(locs[0].id);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // --- Handlers ---
  
  const handleUpdateSlide = async (updated: Slide) => {
      // Optimistic
      setSlides(prev => prev.map(s => s.id === updated.id ? updated : s));
      // API
      await api.updateSlide(updated);
  };

  const handleCreateSlide = async () => {
      if (!org) return;
      const newSlideStub: Partial<Slide> = { name: 'New Slide', background: '#111827', width: 1920, height: 1080, elements: [] };
      const created = await api.createSlide(org.id, newSlideStub);
      if (created) {
          setSlides(prev => [...prev, created]);
          setEditingSlideId(created.id);
      }
  };

  const handleUpdateLocation = async (updatedLoc: Location) => {
      // Optimistic
      setLocations(prev => prev.map(l => l.id === updatedLoc.id ? updatedLoc : l));
      
      for (const s of updatedLoc.screens) {
          await api.updateScreen(s);
      }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">Loading Platform...</div>;
  if (!org) return <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">No Organization Found. Please run database seed.</div>;

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-orange-400">
            <Layout size={24} />
            <div className="leading-tight">
              <h1 className="font-bold text-lg tracking-tight text-white">AccelRestaurants™</h1>
              <p className="text-[10px] font-medium tracking-wider text-neutral-400">{org.name}</p>
            </div>
          </div>
          <div className="h-6 w-px bg-neutral-800 mx-2" />
          <nav className="flex gap-1">
            {[
              { id: 'screens', label: 'Screens', icon: Monitor },
              { id: 'menu', label: 'Menu Data', icon: Database },
              { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
              { id: 'kpi', label: 'Insights', icon: Activity }
            ].map(nav => (
              <button 
                key={nav.id}
                onClick={() => setActiveTab(nav.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === nav.id ? 'bg-neutral-800 text-orange-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              >
                <nav.icon size={16} /> {nav.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700" title="Application audio volume">
            <button
              onClick={() => applicationAudio.setMuted(!applicationAudio.muted)}
              className={`p-1 rounded ${applicationAudio.muted ? 'text-red-400' : 'text-orange-400'}`}
              title={applicationAudio.muted ? 'Unmute application audio' : 'Mute application audio'}
            >
              <Music size={14} />
            </button>
            <input
              aria-label="Application volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={applicationAudio.volume}
              onChange={(e) => applicationAudio.setVolume(Number(e.target.value))}
              className="w-20 accent-orange-500"
            />
            <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">{Math.round(applicationAudio.volume * 100)}%</span>
          </div>
          <button 
            onClick={async () => {
              const name = prompt("Enter new location name:");
              if (name) {
                const newLoc = await api.createLocation(org.id, name);
                if (newLoc) {
                    setLocations([...locations, newLoc]);
                    setActiveLocationId(newLoc.id);
                }
              }
            }}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Plus size={14} /> Loc
          </button>
          <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700">
            <MapPin size={14} className="text-orange-500" />
            <select 
              value={activeLocationId || ''} 
              onChange={(e) => setActiveLocationId(e.target.value)} 
              className="bg-transparent text-sm outline-none text-neutral-200 min-w-[150px]"
            >
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'screens' && (
          editingSlideId && activeSlide ? (
            <SlideEditor 
              slide={activeSlide} 
              onUpdate={handleUpdateSlide} 
              onClose={() => setEditingSlideId(null)}
              templates={templates}
              onSaveTemplate={async (t) => {
                  await api.createTemplate(t);
                  setTemplates(prev => [...prev, t]);
              }}
              menuItems={menuItems}
              renderContext={renderContext}
              campaigns={campaigns}
            />
          ) : (
            activeLocation ? (
                <Dashboard 
                location={activeLocation} 
                slides={slides} 
                onEditSlide={setEditingSlideId}
                onCreateSlide={handleCreateSlide}
                onUpdateLocation={handleUpdateLocation}
                renderContext={renderContext}
                />
            ) : <div className="p-8">No locations found. Create one to start.</div>
          )
        )}
        
        {activeTab === 'menu' && (
            <MenuModule 
                sections={menuSections} 
                items={menuItems} 
                onUpdateSections={async (s) => {
                    setMenuSections(s);
                    for(const sec of s) {
                        if(sec.id.length > 8) await api.updateMenuSection(sec); 
                    }
                }} 
                onUpdateItems={async (items) => {
                    setMenuItems(items);
                    for(const i of items) {
                         await api.updateMenuItem(i);
                    }
                }} 
            />
        )}
        {activeTab === 'campaigns' && org && (
          <CampaignsModule
            campaigns={campaigns}
            onUpdateCampaigns={async (newCampaigns) => {
               setCampaigns(newCampaigns);
               // Simple strategy: check which one changed. For now we assume the caller passes the whole list with one updated/added item
               // In a real app we'd pass specific action.
               // We can just iterate or rely on the fact that we edit one at a time.
            }}
            onSave={async (c) => {
               if (campaigns.some(existing => existing.id === c.id)) {
                 await api.updateCampaign(c);
                 setCampaigns(prev => prev.map(x => x.id === c.id ? c : x));
               } else {
                 const created = await api.createCampaign(org.id, c);
                 if (created) setCampaigns(prev => [...prev, created]);
               }
            }}
          />
        )}
        {activeTab === 'kpi' && <KPIModule />}
      </main>
    </div>
  );
}

function AppRouter() {
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

// --- 5. MODULE: MENU DATA ---

function MenuModule({ sections, items, onUpdateSections, onUpdateItems }: { 
  sections: MenuSection[], items: MenuItem[], 
  onUpdateSections: (s: MenuSection[]) => void, onUpdateItems: (i: MenuItem[]) => void 
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleUpdateItem = (id: string, updates: Partial<MenuItem>) => {
    onUpdateItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleAddItem = (sectionId: string) => {
    const newItem: MenuItem = { id: generateId(), sectionId, name: 'New Item', price: '0.00', description: '', imageUrl: '' };
    onUpdateItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  return (
    <div className="flex h-full bg-neutral-950">
      {/* Left: Menu Tree */}
      <div className="w-80 border-r border-neutral-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Utensils className="text-orange-500" /> Menu Management</h2>
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{section.name}</h3>
                <button onClick={() => handleAddItem(section.id)} className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-orange-500"><Plus size={14} /></button>
              </div>
              <div className="space-y-1">
                {items.filter(i => i.sectionId === section.id).map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-2 rounded cursor-pointer flex justify-between items-center text-sm border border-transparent ${selectedItemId === item.id ? 'bg-neutral-800 border-orange-500/50 text-white' : 'hover:bg-neutral-900 text-neutral-300'}`}
                  >
                    <span>{item.name}</span>
                    <span className="text-neutral-500 text-xs">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onUpdateSections([...sections, { id: generateId(), name: 'New Section', order: sections.length }])} className="mt-6 w-full py-2 border border-dashed border-neutral-700 rounded text-neutral-500 text-sm hover:border-orange-500 hover:text-orange-500">
           + Add Section
        </button>
      </div>

      {/* Right: Item Editor */}
      <div className="flex-1 p-8 bg-neutral-900/50">
        {selectedItem ? (
          <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
             <h3 className="text-xl font-bold mb-6 pb-4 border-b border-neutral-800 flex items-center gap-2">
                <Edit3 size={20} className="text-orange-500" /> Edit Item
             </h3>
             <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Item Name</label>
                  <input type="text" value={selectedItem.name} onChange={(e) => handleUpdateItem(selectedItem.id, { name: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Price ($)</label>
                  <input type="text" value={selectedItem.price} onChange={(e) => handleUpdateItem(selectedItem.id, { price: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Calories</label>
                  <input type="text" value={selectedItem.calories || ''} onChange={(e) => handleUpdateItem(selectedItem.id, { calories: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-orange-500 outline-none" placeholder="e.g. 500 cal" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Description</label>
                  <textarea rows={3} value={selectedItem.description} onChange={(e) => handleUpdateItem(selectedItem.id, { description: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-orange-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Image URL</label>
                  <div className="flex gap-4">
                     <div className="w-20 h-20 bg-neutral-800 rounded flex items-center justify-center shrink-0 overflow-hidden border border-neutral-700">
                        {selectedItem.imageUrl ? <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" /> : <ImageIcon className="text-neutral-600" />}
                     </div>
                     <input type="text" value={selectedItem.imageUrl} onChange={(e) => handleUpdateItem(selectedItem.id, { imageUrl: e.target.value })} className="flex-1 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-orange-500 outline-none h-12 self-start" placeholder="https://..." />
                  </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
            <Utensils size={48} className="mb-4 opacity-20" />
            <p>Select a menu item to edit details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 6. MODULE: CAMPAIGNS ---

function CampaignsModule({ campaigns, onSave }: {
  campaigns: Campaign[],
  onUpdateCampaigns: (c: Campaign[]) => void,
  onSave: (c: Campaign) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = campaigns.find(c => c.id === selectedId);

  const handleAdd = () => {
    const newCamp: Campaign = {
      id: generateId(),
      name: 'New Campaign',
      offerCode: 'SUMMER20',
      status: 'Scheduled',
      radiusMiles: 3.0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString()
    };
    onSave(newCamp); // Optimistic handled by parent? No, parent expects onSave to trigger update
    setSelectedId(newCamp.id);
  };

  const handleChange = (changes: Partial<Campaign>) => {
    if (!selected) return;
    const updated = { ...selected, ...changes };
    onSave(updated); // In real app, might debounce this
  };

  return (
    <div className="flex h-full bg-neutral-950">
      <div className="w-80 border-r border-neutral-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="text-purple-500" /> Campaigns</h2>
        <div className="space-y-2">
          {campaigns.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedId(c.id)}
              className={`p-3 rounded cursor-pointer border ${selectedId === c.id ? 'bg-neutral-800 border-purple-500/50' : 'border-neutral-800 hover:bg-neutral-900'} transition-all`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm text-white">{c.name}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  c.status === 'Active' ? 'bg-green-900 text-green-400' :
                  c.status === 'Ended' ? 'bg-red-900 text-red-400' : 'bg-neutral-700 text-neutral-400'
                }`}>{c.status}</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">{c.offerCode}</div>
            </div>
          ))}
        </div>
        <button onClick={handleAdd} className="mt-6 w-full py-2 border border-dashed border-neutral-700 rounded text-neutral-500 text-sm hover:border-purple-500 hover:text-purple-500">
           + New Campaign
        </button>
      </div>
      
      <div className="flex-1 p-8 bg-neutral-900/50">
        {selected ? (
           <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-neutral-800 flex items-center gap-2">
                 <Edit3 size={20} className="text-purple-500" /> Edit Campaign
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Campaign Name</label>
                  <input type="text" value={selected.name} onChange={(e) => handleChange({ name: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Offer Code</label>
                  <input type="text" value={selected.offerCode} onChange={(e) => handleChange({ offerCode: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-purple-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Status</label>
                  <select value={selected.status} onChange={(e) => handleChange({ status: e.target.value as any })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-purple-500 outline-none">
                     <option value="Scheduled">Scheduled</option>
                     <option value="Active">Active</option>
                     <option value="Ended">Ended</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Start Date</label>
                  <input type="date" value={selected.startDate?.split('T')[0]} onChange={(e) => handleChange({ startDate: new Date(e.target.value).toISOString() })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">End Date</label>
                  <input type="date" value={selected.endDate?.split('T')[0]} onChange={(e) => handleChange({ endDate: new Date(e.target.value).toISOString() })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-purple-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase text-neutral-500 font-bold block mb-1">Geo-Fence Radius (Miles)</label>
                  <input type="range" min="0.5" max="50" step="0.5" value={selected.radiusMiles} onChange={(e) => handleChange({ radiusMiles: parseFloat(e.target.value) })} className="w-full accent-purple-500 mb-2" />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>0.5 mi</span>
                    <span className="text-white font-bold">{selected.radiusMiles} miles</span>
                    <span>50 mi</span>
                  </div>
                </div>
              </div>
           </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
             <Megaphone size={48} className="mb-4 opacity-20" />
             <p>Select a campaign to manage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 6. MODULE: INSIGHTS (KPI) ---

function KPIModule() {
  const salesData = [
    { time: '8am', sales: 400 }, { time: '10am', sales: 800 },
    { time: '12pm', sales: 2400 }, { time: '2pm', sales: 1800 },
    { time: '4pm', sales: 1200 }, { time: '6pm', sales: 3200 },
    { time: '8pm', sales: 2800 }, { time: '10pm', sales: 1500 },
  ];
  
  return (
    <div className="h-full bg-neutral-950 p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Activity className="text-orange-500" /> Performance Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {[{ l: 'Total Revenue', v: '$12,450', c: 'text-white' }, { l: 'Avg Ticket', v: '$24.50', c: 'text-white' }, { l: 'Active Screens', v: '8/8', c: 'text-green-500' }, { l: 'QR Scans', v: '432', c: 'text-orange-500' }].map((k, i) => (
           <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="text-sm text-neutral-500 uppercase font-bold tracking-wider mb-2">{k.l}</div>
              <div className={`text-3xl font-bold ${k.c}`}>{k.v}</div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col">
          <h3 className="text-sm font-bold text-neutral-400 uppercase mb-6">Sales by Daypart</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} itemStyle={{color: '#fbbf24'}} />
                <Area type="monotone" dataKey="sales" stroke="#fbbf24" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col">
          <h3 className="text-sm font-bold text-neutral-400 uppercase mb-6">Campaign Redemptions</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#666" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#999" fontSize={12} width={100} />
                <Tooltip cursor={{fill: '#333'}} contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                <Bar dataKey="redemptions" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 7. DASHBOARD & SLIDE EDITOR (Existing from Part 1 with updates) ---

function Player({ screen, slides, onClose, renderContext }: { 
  screen: Screen, 
  slides: Slide[], 
  onClose: () => void, 
  renderContext: RenderContext 
}) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scale, setScale] = useState(1);

  const playlist = useMemo(() => {
    if (screen.algorithm === 'custom' && screen.customSequence) {
      return screen.customSequence.map(id => slides.find(s => s.id === id)).filter((s): s is Slide => s !== undefined);
    }
    return screen.slides.map(id => slides.find(s => s.id === id)).filter((s): s is Slide => s !== undefined);
  }, [screen, slides]);

  const currentSlide = playlist[currentSlideIndex];

  useEffect(() => {
    if (playlist.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => {
        if (screen.algorithm === 'random') {
          return Math.floor(Math.random() * playlist.length);
        }
        return (prev + 1) % playlist.length;
      });
    }, screen.rotationMs || 10000);
    return () => clearInterval(interval);
  }, [playlist, screen.rotationMs, screen.algorithm]);

  useEffect(() => {
    const handleResize = () => {
      if (!currentSlide) return;
      const scaleX = window.innerWidth / currentSlide.width;
      const scaleY = window.innerHeight / currentSlide.height;
      setScale(Math.min(scaleX, scaleY));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [currentSlide]);

  if (!currentSlide) return <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-100">No slides to display <button onClick={onClose} className="ml-4 underline">Close</button></div>;

  return (
    <ScreenAudioProvider screen={screen}>
      <div className="fixed inset-0 z-100 bg-black flex items-center justify-center">
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
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur transition-colors">
          <X size={24} />
        </button>
        <div className="absolute bottom-4 left-4 text-white/30 text-xs pointer-events-none">
          Playing: {screen.name} • Slide {currentSlideIndex + 1}/{playlist.length}
        </div>
      </div>
    </ScreenAudioProvider>
  );
}

function Dashboard({ location, slides, onEditSlide, onCreateSlide, onUpdateLocation, renderContext }: { 
  location: Location, slides: Slide[], onEditSlide: (id: string) => void, onCreateSlide: () => void, onUpdateLocation: (l: Location) => void, renderContext: RenderContext 
}) {
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [deployingScreenId, setDeployingScreenId] = useState<string | null>(null);
  const [playingScreenId, setPlayingScreenId] = useState<string | null>(null);
  const editingScreen = location?.screens.find(s => s.id === editingScreenId);
  const deployingScreen = location?.screens.find(s => s.id === deployingScreenId);
  const playingScreen = location?.screens.find(s => s.id === playingScreenId);
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

  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    e.dataTransfer.setData('slideId', slideId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnScreen = (e: React.DragEvent, screenId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const slideId = e.dataTransfer.getData('slideId');
    if (!slideId) return;

    const updatedScreens = location.screens.map(screen => {
      if (screen.id === screenId) {
        return { ...screen, slides: [...screen.slides, slideId] };
      }
      return screen;
    });

    onUpdateLocation({ ...location, screens: updatedScreens });
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const slideId = e.dataTransfer.getData('slideId');
    if (!slideId) return;

    const newScreen: Screen = {
      id: generateId(),
      locationId: location.id,
      name: `Menu Board ${location.screens.length + 1}`,
      rotationMs: 10000,
      slides: [slideId]
    };

    onUpdateLocation({ ...location, screens: [...location.screens, newScreen] });
  };
  
  const handleScreenSlideDragStart = (e: React.DragEvent, screenId: string, index: number) => {
    e.dataTransfer.setData('type', 'reorder-slide');
    e.dataTransfer.setData('screenId', screenId);
    e.dataTransfer.setData('index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleScreenSlideDrop = (e: React.DragEvent, targetScreenId: string, targetIndex: number) => {
    const type = e.dataTransfer.getData('type');
    if (type === 'reorder-slide') {
      e.preventDefault();
      e.stopPropagation();
      
      const sourceScreenId = e.dataTransfer.getData('screenId');
      const sourceIndex = parseInt(e.dataTransfer.getData('index'));

      if (sourceScreenId !== targetScreenId) return; 
      if (sourceIndex === targetIndex) return;

      const screen = location.screens.find(s => s.id === targetScreenId);
      if (!screen) return;

      const newSlides = [...screen.slides];
      const [movedSlide] = newSlides.splice(sourceIndex, 1);
      newSlides.splice(targetIndex, 0, movedSlide);

      const updatedScreens = location.screens.map(s => {
        if (s.id === targetScreenId) {
          return { ...s, slides: newSlides };
        }
        return s;
      });

      onUpdateLocation({ ...location, screens: updatedScreens });
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-neutral-400 text-xs uppercase tracking-wider">Slide Library</h3>
          <button onClick={onCreateSlide} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {slides.map(slide => (
            <div 
              key={slide.id} 
              draggable="true"
              onDragStart={(e) => handleDragStart(e, slide.id)}
              onClick={() => onEditSlide(slide.id)} 
              className="p-3 bg-neutral-800 rounded border border-neutral-700 hover:border-orange-500 cursor-pointer group transition-all active:cursor-grabbing"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm truncate">{slide.name}</span>
                <Settings size={14} className="opacity-0 group-hover:opacity-100 text-neutral-500" />
              </div>
              <div className="aspect-video w-full bg-neutral-900 rounded overflow-hidden relative" style={{ backgroundColor: slide.background }}>
                 <div className="absolute inset-0 flex items-center justify-center">
                    {/* Tiny preview of first 3 elements */}
                    {slide.elements.slice(0,3).map((el, i) => (
                      <div key={i} className="absolute w-2 h-2 bg-neutral-700 rounded-full" style={{left: `${(el.x/(slide.width||800))*100}%`, top: `${(el.y/(slide.height||450))*100}%`}} />
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div 
        className="flex-1 bg-neutral-950 p-8 overflow-y-auto transition-colors"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-neutral-900'); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-neutral-900'); }}
        onDrop={(e) => { e.currentTarget.classList.remove('bg-neutral-900'); handleDropOnCanvas(e); }}
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Monitor className="text-orange-500" /> {location.name} Screens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {location.screens.map(screen => (
            <div 
              key={screen.id} 
              className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg transition-all"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-orange-500'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-orange-500'); }}
              onDrop={(e) => { e.currentTarget.classList.remove('border-orange-500'); handleDropOnScreen(e, screen.id); }}
            >
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
                <div className="flex items-center gap-2"><Monitor size={16} className="text-neutral-400" /><span className="font-medium">{screen.name}</span></div>
                <div className="flex gap-1">
                  <button onClick={() => setDeployingScreenId(screen.id)} className="p-1.5 hover:bg-purple-900/30 text-purple-500 rounded" title="Deploy"><Rocket size={14} /></button>
                  <button onClick={() => setEditingScreenId(screen.id)} className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded"><Settings size={14} /></button>
                  <button onClick={() => setPlayingScreenId(screen.id)} className="p-1.5 hover:bg-green-900/30 text-green-500 rounded"><Play size={14} /></button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {screen.slides.map((sId, idx) => {
                    const s = slides.find(sl => sl.id === sId);
                    return (
                      <div 
                        key={idx} 
                        draggable
                        onDragStart={(e) => handleScreenSlideDragStart(e, screen.id, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleScreenSlideDrop(e, screen.id, idx)}
                        onClick={() => { if(s) onEditSlide(s.id); }}
                        className="group flex items-center gap-2 bg-neutral-800 p-2 rounded border border-neutral-700/50 cursor-pointer hover:bg-neutral-700 hover:border-orange-500/50 transition-colors"
                      >
                        <div className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px]">{idx+1}</div>
                        <span className="text-sm truncate flex-1">{s?.name || 'Unknown Slide'}</span>
                        <div className="opacity-0 group-hover:opacity-100 text-neutral-500"><Edit3 size={10}/></div>
                      </div>
                    )
                  })}
                  {screen.slides.length === 0 && <div className="text-sm text-neutral-600 italic">No slides assigned</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingScreen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setEditingScreenId(null)}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-[760px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="text-orange-500"/> Screen Settings: {editingScreen.name}</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Rotation Interval (ms)</label>
                     <input type="number" value={editingScreen.rotationMs} onChange={e => {
                        const val = Number(e.target.value);
                        onUpdateLocation({...location, screens: location.screens.map(s => s.id === editingScreen.id ? {...s, rotationMs: val} : s)});
                     }} className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white" />
                  </div>
                  
                  <div>
                     <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Transition Effect</label>
                     <select value={editingScreen.transition || 'none'} onChange={e => {
                        onUpdateLocation({...location, screens: location.screens.map(s => s.id === editingScreen.id ? {...s, transition: e.target.value as any} : s)});
                     }} className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white">
                        <option value="none">None</option>
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                     </select>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Display Algorithm</label>
                     <select value={editingScreen.algorithm || 'loop'} onChange={e => {
                        onUpdateLocation({...location, screens: location.screens.map(s => s.id === editingScreen.id ? {...s, algorithm: e.target.value as any} : s)});
                     }} className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white">
                        <option value="loop">Standard Loop</option>
                        <option value="random">Random Shuffle</option>
                        <option value="custom">Custom Sequence</option>
                     </select>
                  </div>

                  {editingScreen.algorithm === 'custom' && (
                     <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Playlist Sequence (A, B...)</label>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800 text-xs font-mono">
                           <input type="text" value={(editingScreen.customSequence || []).join(', ')} onChange={(e) => {
                              const seq = e.target.value.split(',').map(s => s.trim());
                              onUpdateLocation({...location, screens: location.screens.map(s => s.id === editingScreen.id ? {...s, customSequence: seq} : s)});
                           }} className="w-full bg-transparent outline-none text-white" placeholder="slide_01, slide_02..." />
                        </div>
                        <div className="text-[9px] text-neutral-500 mt-1">Enter Slide IDs separated by comma.</div>
                     </div>
                  )}

                  <div className="pt-5 mt-5 border-t border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm flex items-center gap-2"><Music size={16} className="text-orange-500" /> Audio / Global Media Plane</h4>
                        <p className="text-[10px] text-neutral-500 mt-1">Persistent audio survives slide changes. Slide media remains independently scheduled and coordinated.</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-neutral-300">
                        <input type="checkbox" checked={editingAudioConfig.enabled} onChange={(e) => updateEditingAudio({ enabled: e.target.checked })} />
                        Audio enabled
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Master Volume</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="1" step="0.01" value={editingAudioConfig.masterVolume} onChange={(e) => updateEditingAudio({ masterVolume: Number(e.target.value) })} className="flex-1 accent-orange-500" />
                          <span className="text-xs font-mono w-10 text-right">{Math.round(editingAudioConfig.masterVolume * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Coordination Mode</label>
                        <select value={editingAudioConfig.coordinationMode} onChange={(e) => updateEditingAudio({ coordinationMode: e.target.value as ScreenAudioConfig['coordinationMode'] })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-xs">
                          <option value="mix">Mixer — allow simultaneous audio</option>
                          <option value="priority">Priority — foreground wins / background ducks</option>
                          <option value="exclusive">Exclusive — one source at a time</option>
                        </select>
                        <div className="text-[9px] text-neutral-500 mt-1">{coordinationModeLabel(editingAudioConfig.coordinationMode)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-xs text-neutral-300">
                        <input type="checkbox" checked={editingAudioConfig.allowVideoAudio} onChange={(e) => updateEditingAudio({ allowVideoAudio: e.target.checked })} />
                        Allow video audio
                      </label>
                      <label className="flex items-center gap-2 text-xs text-neutral-300">
                        <input type="checkbox" checked={editingAudioConfig.duckingEnabled} onChange={(e) => updateEditingAudio({ duckingEnabled: e.target.checked })} />
                        Duck background for foreground media
                      </label>
                    </div>

                    {editingAudioConfig.duckingEnabled && (
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Ducked Background Level</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="1" step="0.01" value={editingAudioConfig.duckLevel} onChange={(e) => updateEditingAudio({ duckLevel: Number(e.target.value) })} className="flex-1 accent-orange-500" />
                          <span className="text-xs font-mono w-10 text-right">{Math.round(editingAudioConfig.duckLevel * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Background Music URL</label>
                      <input type="text" value={editingAudioConfig.backgroundMusic} onChange={(e) => updateEditingAudio({ backgroundMusic: e.target.value })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white text-xs" placeholder="https://.../dinner-jazz.mp3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1">Fade Between Tracks (ms)</label>
                        <input type="number" min="0" value={editingAudioConfig.fadeBetweenTracksMs} onChange={(e) => updateEditingAudio({ fadeBetweenTracksMs: Number(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white" />
                      </div>
                      <div className="bg-neutral-950/60 border border-neutral-800 rounded p-3">
                        <label className="flex items-center gap-2 text-xs text-neutral-300">
                          <input type="checkbox" checked={editingAudioConfig.schedule.enabled} onChange={(e) => updateAudioSchedule('schedule', { enabled: e.target.checked })} />
                          Screen audio schedule
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <input type="time" value={editingAudioConfig.schedule.startTime} onChange={(e) => updateAudioSchedule('schedule', { startTime: e.target.value })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" />
                          <input type="time" value={editingAudioConfig.schedule.endTime} onChange={(e) => updateAudioSchedule('schedule', { endTime: e.target.value })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" />
                        </div>
                        <input type="text" value={editingAudioConfig.schedule.days.join(',')} onChange={(e) => updateAudioSchedule('schedule', { days: e.target.value.split(',').map(Number).filter((day) => day >= 0 && day <= 6) })} className="mt-2 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" placeholder="Days: 0,1,2,3,4,5,6" />
                      </div>
                    </div>

                    <div className="bg-neutral-950/60 border border-neutral-800 rounded p-3">
                      <label className="flex items-center gap-2 text-xs text-neutral-300">
                        <input type="checkbox" checked={editingAudioConfig.quietHours.enabled} onChange={(e) => updateAudioSchedule('quietHours', { enabled: e.target.checked })} />
                        Quiet hours (scheduler override)
                      </label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <input type="time" value={editingAudioConfig.quietHours.startTime} onChange={(e) => updateAudioSchedule('quietHours', { startTime: e.target.value })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" />
                        <input type="time" value={editingAudioConfig.quietHours.endTime} onChange={(e) => updateAudioSchedule('quietHours', { endTime: e.target.value })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" />
                        <input type="text" value={editingAudioConfig.quietHours.days.join(',')} onChange={(e) => updateAudioSchedule('quietHours', { days: e.target.value.split(',').map(Number).filter((day) => day >= 0 && day <= 6) })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" placeholder="0,1,2,3,4,5,6" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-neutral-500 uppercase block">Playlist</label>
                          <p className="text-[9px] text-neutral-600">Audio files or video files used as audio-only background tracks.</p>
                        </div>
                        <button onClick={addPlaylistTrack} className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-xs hover:border-orange-500"><Plus size={12} className="inline mr-1" />Track</button>
                      </div>
                      {editingAudioConfig.playlist.map((track, trackIndex) => (
                        <div key={track.id || trackIndex} className="bg-neutral-950 border border-neutral-800 rounded p-3 space-y-2">
                          <div className="grid grid-cols-[90px_1fr_32px] gap-2">
                            <select value={track.kind} onChange={(e) => updatePlaylistTrack(trackIndex, { kind: e.target.value as GlobalMediaTrack['kind'] })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs">
                              <option value="audio">Audio</option>
                              <option value="video">Video audio</option>
                            </select>
                            <input value={track.title} onChange={(e) => updatePlaylistTrack(trackIndex, { title: e.target.value })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" placeholder="Track name" />
                            <button onClick={() => removePlaylistTrack(trackIndex)} className="text-red-500 hover:bg-red-950 rounded"><Trash2 size={14} className="mx-auto" /></button>
                          </div>
                          <input value={track.url} onChange={(e) => updatePlaylistTrack(trackIndex, { url: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" placeholder="https://... media URL" />
                          <div className="grid grid-cols-3 gap-2">
                            <label className="text-[9px] text-neutral-500">Volume
                              <input type="number" min="0" max="1" step="0.05" value={track.volume} onChange={(e) => updatePlaylistTrack(trackIndex, { volume: Number(e.target.value) })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs text-white" />
                            </label>
                            <label className="text-[9px] text-neutral-500">Start Time (s)
                              <input type="number" min="0" value={track.startTime} onChange={(e) => updatePlaylistTrack(trackIndex, { startTime: Number(e.target.value) })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs text-white" />
                            </label>
                            <label className="text-[9px] text-neutral-500">Priority
                              <input type="number" min="0" value={track.priority} onChange={(e) => updatePlaylistTrack(trackIndex, { priority: Number(e.target.value) })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs text-white" />
                            </label>
                          </div>
                          <div className="grid grid-cols-[110px_1fr_1fr] gap-2 items-center">
                            <label className="flex items-center gap-2 text-[10px] text-neutral-400">
                              <input type="checkbox" checked={track.schedule?.enabled || false} onChange={(e) => updatePlaylistTrack(trackIndex, { schedule: { enabled: e.target.checked, startTime: track.schedule?.startTime || '00:00', endTime: track.schedule?.endTime || '23:59', days: track.schedule?.days || [0,1,2,3,4,5,6] } })} /> Scheduled
                            </label>
                            <input type="time" value={track.schedule?.startTime || '00:00'} onChange={(e) => updatePlaylistTrack(trackIndex, { schedule: { enabled: track.schedule?.enabled || false, startTime: e.target.value, endTime: track.schedule?.endTime || '23:59', days: track.schedule?.days || [0,1,2,3,4,5,6] } })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" />
                            <input type="time" value={track.schedule?.endTime || '23:59'} onChange={(e) => updatePlaylistTrack(trackIndex, { schedule: { enabled: track.schedule?.enabled || false, startTime: track.schedule?.startTime || '00:00', endTime: e.target.value, days: track.schedule?.days || [0,1,2,3,4,5,6] } })} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="mt-6 flex justify-end">
                  <button onClick={() => setEditingScreenId(null)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-bold text-white">Done</button>
               </div>
            </div>
         </div>
      )}

      {deployingScreen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setDeployingScreenId(null)}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Rocket className="text-purple-500"/> Deploy Screen</h3>
               <p className="text-sm text-neutral-400 mb-4">This screen is live at the following unique URL:</p>
               
               <div className="p-3 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between gap-2 mb-4">
                  <code className="text-xs text-green-500 font-mono truncate">{window.location.origin}{window.location.pathname}#/s/{deployingScreen.id}</code>
                  <button className="text-neutral-500 hover:text-white" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/s/${deployingScreen.id}`)} title="Copy URL"><Copy size={14}/></button>
               </div>
               
               <div className="flex justify-end">
                  <button onClick={() => setDeployingScreenId(null)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-bold text-white">Close</button>
               </div>
            </div>
         </div>
      )}

      {playingScreen && (
        <Player 
          screen={playingScreen} 
          slides={slides} 
          onClose={() => setPlayingScreenId(null)} 
          renderContext={renderContext} 
        />
      )}
    </div>
  );
}

function SlideEditor({ slide, onUpdate, onClose, templates, onSaveTemplate, menuItems, campaigns, renderContext }: { 
  slide: Slide, onUpdate: (s: Slide) => void, onClose: () => void, templates: TileTemplate[], 
  onSaveTemplate: (t: TileTemplate) => void, menuItems: MenuItem[], campaigns: Campaign[], renderContext: RenderContext 
}) {
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ isDragging: boolean, elId: string | null, startX: number, startY: number, initialEl: TileInstance | null, mode: 'move' | 'resize' }>({ isDragging: false, elId: null, startX: 0, startY: 0, initialEl: null, mode: 'move' });
  const [paletteTab, setPaletteTab] = useState<'base'|'templates'>('base');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedEl = slide.elements.find(e => e.id === selectedElId);

  const handleAddTile = (key: TileTypeKey, template?: TileTemplate) => {
    const registryDef = TILE_REGISTRY[key];
    const newEl: TileInstance = {
      id: generateId(), type: key, x: 50, y: 50, width: template?.defaultDimensions?.w || 200, height: template?.defaultDimensions?.h || 150, zIndex: slide.elements.length + 1, opacity: 1,
      props: template ? { ...registryDef.defaultProps, ...template.defaultProps } : { ...registryDef.defaultProps }, binding: { source: 'none' }
    };
    onUpdate({ ...slide, elements: [...slide.elements, newEl] });
    setSelectedElId(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<TileInstance>) => {
    onUpdate({ ...slide, elements: slide.elements.map(e => e.id === id ? { ...e, ...updates } : e) });
  };

  const handleMouseDown = (e: React.MouseEvent, elId: string, mode: 'move' | 'resize') => {
    e.stopPropagation();
    const el = slide.elements.find(e => e.id === elId);
    if (!el) return;
    setSelectedElId(elId);
    setDragState({ isDragging: true, elId, startX: e.clientX, startY: e.clientY, initialEl: { ...el }, mode });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.elId || !dragState.initialEl) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (dragState.mode === 'move') {
      updateElement(dragState.elId, { x: dragState.initialEl.x + dx, y: dragState.initialEl.y + dy });
    } else {
      updateElement(dragState.elId, { width: Math.max(20, dragState.initialEl.width + dx), height: Math.max(20, dragState.initialEl.height + dy) });
    }
  };

  const handleCreateTemplate = () => {
    if (!selectedEl) return;
    const name = prompt("Template Name:", "My Template");
    if (!name) return;
    onSaveTemplate({ 
      id: generateId(), orgId: 'org_01', type: selectedEl.type, name, tags: ['custom'], 
      defaultProps: { ...selectedEl.props }, defaultDimensions: { w: selectedEl.width, h: selectedEl.height } 
    });
  };

  return (
    <div className="flex h-full bg-neutral-950" onMouseMove={handleMouseMove} onMouseUp={() => setDragState({ ...dragState, isDragging: false })}>
      <div className="w-72 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="flex items-center gap-2 p-2 border-b border-neutral-800">
           <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded text-neutral-400"><ChevronLeft size={16} /></button>
           <span className="font-semibold text-sm">Editor</span>
        </div>
        <div className="flex border-b border-neutral-800">
          <button onClick={() => setPaletteTab('base')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${paletteTab === 'base' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-neutral-500'}`}>Base Tiles</button>
          <button onClick={() => setPaletteTab('templates')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${paletteTab === 'templates' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-neutral-500'}`}>Templates</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {paletteTab === 'base' ? (
             <div className="space-y-6">
                {['Core', 'Design', 'Data', 'Feeds', 'Restaurant', 'Embed'].map(cat => (
                  <div key={cat}>
                    <h4 className="text-[10px] font-bold uppercase text-orange-500 mb-2">{cat}</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {Object.entries(TILE_REGISTRY).filter(([_, def]) => def.category === cat).map(([key, def]) => (
                         <button key={key} onClick={() => handleAddTile(key as TileTypeKey)} className="flex flex-col items-center justify-center p-2 rounded bg-neutral-800 border border-neutral-700 hover:border-orange-500 transition-all group">
                            <def.icon size={20} className="text-neutral-400 group-hover:text-white mb-1" />
                            <span className="text-[9px] text-neutral-500 group-hover:text-neutral-300 truncate w-full text-center">{def.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                ))}
             </div>
          ) : (
             <div className="space-y-2">
               {templates.map(tpl => (
                 <div key={tpl.id} onClick={() => handleAddTile(tpl.type, tpl)} className="p-3 bg-neutral-800 border border-neutral-700 hover:border-orange-500 rounded cursor-pointer flex items-center gap-2">
                    <Star size={12} className="text-orange-500" />
                    <span className="text-sm font-medium">{tpl.name}</span>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 relative bg-neutral-950 flex flex-col">
        <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900">
          <input type="text" value={slide.name} onChange={(e) => onUpdate({ ...slide, name: e.target.value })} className="bg-transparent text-sm font-medium outline-none text-white focus:text-orange-400" />
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="uppercase font-bold text-[9px]">Size:</span>
            <input type="number" value={slide.width || 800} onChange={(e) => onUpdate({ ...slide, width: Number(e.target.value) })} className="bg-neutral-800 border border-neutral-700 rounded w-12 text-center text-white" />
            <span>x</span>
            <input type="number" value={slide.height || 450} onChange={(e) => onUpdate({ ...slide, height: Number(e.target.value) })} className="bg-neutral-800 border border-neutral-700 rounded w-12 text-center text-white" />
            <span className="ml-1">px</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center justify-center" onClick={() => setSelectedElId(null)}>
          <div
            ref={canvasRef}
            className="relative shadow-2xl bg-neutral-900 overflow-hidden"
            style={{
              width: `${slide.width || 800}px`,
              height: `${slide.height || 450}px`,
              backgroundColor: slide.background,
              backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {slide.elements
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                <div
                  key={el.id}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    zIndex: el.zIndex,
                    opacity: el.opacity,
                    border:
                      selectedElId === el.id ? '1px solid #fbbf24' : '1px solid transparent',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, el.id, 'move')}
                  className="group"
                >
                  <TileRenderer
                    type={el.type}
                    props={el.props}
                    dimensions={{ w: el.width, h: el.height }}
                    binding={el.binding}
                    context={renderContext}
                  />
                  {selectedElId === el.id && (
                    <>
                      <div className="absolute -top-3 -left-1 bg-orange-500 text-black text-[9px] font-bold">
                        {TILE_REGISTRY[el.type].label}
                      </div>
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-orange-500 cursor-nwse-resize flex items-center justify-center"
                        onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}
                      >
                        <Move size={10} className="text-black" />
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h3 className="font-semibold text-sm">Properties</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedEl ? (
            <>
              {/* Data Binding Section */}
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-800">
                <h4 className="text-[10px] font-bold text-orange-500 uppercase mb-2 flex items-center gap-1">
                  <LinkIcon size={10} /> Connect Data
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2 text-xs mb-2">
                    <button
                      onClick={() => updateElement(selectedEl.id, { binding: { source: 'none' } })}
                      className={`flex-1 py-1 rounded border ${
                        selectedEl.binding?.source === 'none'
                          ? 'bg-neutral-700 border-white text-white'
                          : 'border-neutral-700 text-neutral-500'
                      }`}
                    >
                      Static
                    </button>
                    <button
                      onClick={() => updateElement(selectedEl.id, { binding: { source: 'menu' } })}
                      className={`flex-1 py-1 rounded border ${
                        selectedEl.binding?.source === 'menu'
                          ? 'bg-orange-900/30 border-orange-500 text-orange-400'
                          : 'border-neutral-700 text-neutral-500'
                      }`}
                    >
                      Menu Item
                    </button>
                    <button
                      onClick={() => updateElement(selectedEl.id, { binding: { source: 'campaign' } })}
                      className={`flex-1 py-1 rounded border ${
                        selectedEl.binding?.source === 'campaign'
                          ? 'bg-purple-900/30 border-purple-500 text-purple-400'
                          : 'border-neutral-700 text-neutral-500'
                      }`}
                    >
                      Campaign
                    </button>
                  </div>
                  {selectedEl.binding?.source === 'menu' && (
                    <>
                      <select
                        value={selectedEl.binding.itemId || ''}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            binding: {
                              source: 'menu',
                              field: selectedEl.binding?.field,
                              itemId: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs mb-2"
                      >
                        <option value="">Select Item...</option>
                        {menuItems.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedEl.binding.field || ''}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            binding: {
                              source: 'menu',
                              itemId: selectedEl.binding?.itemId,
                              field: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs"
                      >
                        <option value="">Select Field...</option>
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="description">Description</option>
                        <option value="calories">Calories</option>
                        <option value="imageUrl">Image URL</option>
                      </select>
                      <div className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                        <ArrowUpRight size={10} /> Live Bound
                      </div>
                    </>
                  )}
                  {selectedEl.binding?.source === 'campaign' && (
                    <>
                      <select
                        value={selectedEl.binding.itemId || ''}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            binding: {
                              source: 'campaign',
                              field: selectedEl.binding?.field,
                              itemId: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs mb-2"
                      >
                        <option value="">Select Campaign...</option>
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedEl.binding.field || ''}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            binding: {
                              source: 'campaign',
                              itemId: selectedEl.binding?.itemId,
                              field: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs"
                      >
                        <option value="">Select Field...</option>
                        <option value="name">Name</option>
                        <option value="offerCode">Offer Code</option>
                        <option value="status">Status</option>
                        <option value="startDate">Start Date</option>
                        <option value="endDate">End Date</option>
                      </select>
                      <div className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                        <ArrowUpRight size={10} /> Live Bound
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Standard Props */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase">Style & Layout</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['x', 'y', 'width', 'height', 'opacity', 'zIndex'].map((prop) => (
                    <div key={prop}>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{prop}</label>
                      <input
                        type="number"
                        value={Math.round((selectedEl as any)[prop])}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            [prop]: Number(e.target.value),
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
                {Object.entries(selectedEl.props).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-[9px] text-neutral-500 uppercase block mb-1">{key}</label>
                    {typeof val === 'boolean' ? (
                      <label className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-950 border border-neutral-700 rounded p-2">
                        <input
                          type="checkbox"
                          checked={val as boolean}
                          onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.checked } })}
                        />
                        {val ? 'Enabled' : 'Disabled'}
                      </label>
                    ) : key.includes('color') || key === 'bg' ? (
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={val as string}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              props: { ...selectedEl.props, [key]: e.target.value },
                            })
                          }
                          className="h-8 w-8 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={val as string}
                          onChange={(e) =>
                            updateElement(selectedEl.id, {
                              props: { ...selectedEl.props, [key]: e.target.value },
                            })
                          }
                          className="flex-1 bg-neutral-950 border border-neutral-700 rounded p-1 text-xs"
                        />
                      </div>
                    ) : key === 'scheduleStart' || key === 'scheduleEnd' ? (
                      <input
                        type="time"
                        value={String(val)}
                        onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.value } })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs"
                      />
                    ) : key === 'volume' || key === 'duckLevel' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={Number(val)}
                          onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: Number(e.target.value) } })}
                          className="flex-1 accent-orange-500"
                        />
                        <span className="text-[10px] font-mono w-10 text-right">{Math.round(Number(val) * 100)}%</span>
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
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-col gap-2">
                <button
                  onClick={handleCreateTemplate}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Save as Template
                </button>
                <button
                  onClick={() =>
                    onUpdate({
                      ...slide,
                      elements: slide.elements.filter((e) => e.id !== selectedEl.id),
                    })
                  }
                  className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete Tile
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-neutral-500 text-sm mt-10">
              Select an element to edit properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function fetchSheetCellValue(url: string, cell: string): Promise<string | null> {
  try {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(','));
    const { row, col } = parseCellRef(cell || 'A1');
    const value = rows[row]?.[col] ?? null;
    return value;
  } catch (err) {
    console.error('Failed to fetch sheet cell', err);
    return null;
  }
}

function parseCellRef(cell: string): { row: number; col: number } {
  const match = cell.match(/([A-Za-z]+)(\d+)/);
  if (!match) return { row: 0, col: 0 };
  const [, colLetters, rowStr] = match;
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col *= 26;
    col += colLetters.charCodeAt(i) - 64; // A -> 1
  }
  return { row: parseInt(rowStr, 10) - 1, col: col - 1 };
}

function SheetCellTile({ url, cell }: { url: string; cell: string }) {
  const [value, setValue] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSheetCellValue(url, cell)
      .then((val) => {
        if (cancelled) return;
        setValue(val);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, cell]);

  if (!url) {
    return <div className="text-xs text-neutral-400">Configure Google Sheet URL</div>;
  }

  if (loading) {
    return <div className="text-xs text-neutral-400">Loading cell {cell || 'A1'}...</div>;
  }

  if (error) {
    return <div className="text-xs text-red-400">Error loading cell</div>;
  }

  return <div className="text-sm font-semibold">{value ?? '(empty)'}</div>;
}

// --- 10. TILE RENDERER (Updated with Binding Logic) ---

function ClockTile({ props, style, type }: { props: any; style: React.CSSProperties; type: TileTypeKey }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (type === 'countdown') {
    const target = new Date(props.target || new Date().getFullYear() + 1 + '-01-01');
    const diff = target.getTime() - time.getTime();

    if (diff <= 0) {
      return (
        <div style={style}>
          <div className="text-2xl font-bold">00:00:00</div>
          <div className="text-xs uppercase">{props.label || 'Expired'}</div>
        </div>
      );
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return (
      <div style={style}>
        <div className="flex gap-4 text-center">
          {days > 0 && (
            <div>
              <div className="text-2xl font-bold">{days}</div>
              <div className="text-[9px] uppercase opacity-50">Days</div>
            </div>
          )}
          <div>
            <div className="text-2xl font-bold">{String(hours).padStart(2, '0')}</div>
            <div className="text-[9px] uppercase opacity-50">Hrs</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{String(minutes).padStart(2, '0')}</div>
            <div className="text-[9px] uppercase opacity-50">Min</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{String(seconds).padStart(2, '0')}</div>
            <div className="text-[9px] uppercase opacity-50">Sec</div>
          </div>
        </div>
        {props.label && (
          <div className="mt-2 text-xs font-bold uppercase tracking-widest text-orange-500">{props.label}</div>
        )}
      </div>
    );
  }

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: props.showSeconds ? '2-digit' : undefined,
    hour12: props.format === '12h',
  });

  return (
    <div style={style}>
      <div className="font-mono font-bold" style={{ fontSize: '1.5em' }}>
        {timeStr}
      </div>
      {(type === 'date' || props.showDate) && (
        <div className="text-xs mt-1">{time.toLocaleDateString()}</div>
      )}
    </div>
  );
}

function TileRenderer({ type, props, dimensions, binding, context }: {
  type: TileTypeKey;
  props: Record<string, any>;
  dimensions: { w: number; h: number };
  binding?: DataBinding;
  context?: RenderContext;
}) {
  // BINDING RESOLUTION LOGIC
  let finalProps = { ...props };
  console.log(`Debug: Rendering tile of type ${type} with final props:`, JSON.stringify(finalProps));

  if (binding && binding.source === 'menu' && binding.itemId && binding.field && context?.menuItems) {
    const item = context.menuItems.find((i) => i.id === binding.itemId);
    if (item) {
      const fieldKey = binding.field as keyof MenuItem;
      const val = item[fieldKey];
      if (type === 'text') finalProps.content = fieldKey === 'price' ? `$${String(val)}` : String(val);
      if (type === 'image') finalProps.url = String(val);
    }
  }

  if (binding && binding.source === 'campaign' && binding.itemId && binding.field && context?.campaigns) {
    const campaign = context.campaigns.find((c) => c.id === binding.itemId);
    if (campaign) {
      const fieldKey = binding.field as keyof Campaign;
      const val = campaign[fieldKey];
      if (type === 'text') finalProps.content = String(val);
    }
  }

  // Common Styles
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: finalProps.color || '#fff',
    fontSize: finalProps.fontSize ? `${finalProps.fontSize}px` : '16px',
    textAlign: finalProps.textAlign as any,
    fontFamily: finalProps.fontFamily || 'Inter',
    fontWeight: finalProps.fontWeight || 'normal',
    backgroundColor: finalProps.bg || 'transparent',
    borderRadius: finalProps.radius ? `${finalProps.radius}px` : 0,
  };

  const parseChartData = (str: string) => {
    if (!str) return [] as { name: string; value: number }[];
    return str.split(',').map((v, i) => ({ name: `D${i}`, value: parseInt(v.trim(), 10) }));
  };

  switch (type) {
    case 'text':
      return (
        <div style={{ ...containerStyle, display: 'block', whiteSpace: 'pre-wrap' }}>
          {finalProps.content}
        </div>
      );

    case 'image':
    case 'gif':
    case 'random_image':
    case 'avatar': {
      if (!finalProps.url) {
        return (
          <div
            style={{ ...containerStyle, backgroundColor: finalProps.bg || '#262626' }}
          >
            <ImageIcon className="text-neutral-600" />
          </div>
        );
      }
      return (
        <img
          src={finalProps.url}
          alt=""
          style={{ ...containerStyle, objectFit: finalProps.fit || 'cover' }}
        />
      );
    }

    case 'video':
      if (!finalProps.url) return null;
      return (
        <CoordinatedMedia
          kind="video"
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
          kind="audio"
          props={finalProps}
          style={{
            ...containerStyle,
            backgroundColor: finalProps.bg || '#111',
            padding: 10,
            borderRadius: 8,
          }}
        />
      );

    case 'map':
      return (
        <div style={{ ...containerStyle, position: 'relative' }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder={0}
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              finalProps.location || 'New York',
            )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
            title="Google Map"
          />
        </div>
      );

    case 'youtube':
      return (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${finalProps.videoId}?autoplay=$
            {finalProps.autoplay ? 1 : 0
          }&mute=1&controls=0&loop=1&playlist=${finalProps.videoId}`}
          title="YouTube video player"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ borderRadius: containerStyle.borderRadius as any, pointerEvents: 'none' }}
        />
      );

    case 'vimeo':
      if (!finalProps.videoId) return null;
      return (
        <iframe
          src={`https://player.vimeo.com/video/${finalProps.videoId}?autoplay=1&loop=1&background=1`}
          width="100%"
          height="100%"
          frameBorder={0}
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Vimeo video player"
          style={{ borderRadius: containerStyle.borderRadius as any, pointerEvents: 'none' }}
        />
      );

    case 'shape':
      return <div style={containerStyle} />;

    case 'gradient':
      return (
        <div
          style={{
            ...containerStyle,
            background: `linear-gradient(${finalProps.direction || 'to right'}, ${
              finalProps.colors
            })`,
          }}
        />
      );

    case 'icon':
      return (
        <div style={containerStyle}>
          <Star size={finalProps.size || 64} color={finalProps.color} />
        </div>
      );

    case 'clock':
    case 'date':
    case 'timer':
    case 'countdown':
      return <ClockTile props={finalProps} style={containerStyle} type={type} />;

    case 'rss':
      return (
        <div
          style={{
            ...containerStyle,
            justifyContent: 'flex-start',
            padding: 10,
          }}
        >
          <div className="text-xs font-bold text-orange-500 mb-1 flex items-center gap-1">
            <Activity size={12} /> RSS Feed
          </div>
          <div className="text-sm">
            {finalProps.url ? 'Latest news from feed...' : 'Configure RSS URL'}
          </div>
        </div>
      );

    case 'quote':
      return (
        <div
          style={{
            ...containerStyle,
            padding: 20,
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          <MessageSquare size={24} className="text-neutral-600 mb-2 mx-auto" />
          {""}
          {finalProps.topic === 'food'
            ? 'People who love to eat are always the best people.'
            : 'The only way to do great work is to love what you do.'}
        </div>
      );

    case 'stock':
    case 'crypto': {
      const isCrypto = type === 'crypto';
      const isUp = true; // Keep deterministic in preview to satisfy React purity
      return (
        <div style={containerStyle}>
          <div className="text-xs font-bold text-neutral-500 mb-1 uppercase tracking-widest">
            {finalProps.symbol}
          </div>
          <div
            className={`text-2xl font-bold ${
              isUp ? 'text-green-500' : 'text-red-500'
            } flex items-center gap-2`}
          >
            {isCrypto ? '$42,150.00' : '185.92'}
            <TrendingUp size={20} className={isUp ? '' : 'rotate-180'} />
          </div>
          <div className="text-[10px] text-neutral-600 mt-1">+1.2% Today</div>
        </div>
      );
    }

    case 'list': {
      const listItems = (finalProps.items || '').split(',');
      return (
        <div
          style={{
            ...containerStyle,
            alignItems: 'flex-start',
            padding: 10,
            overflow: 'auto',
          }}
        >
          {listItems.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-orange-500 font-bold">
                {finalProps.bullet || '•'}
              </span>
              <span>{item.trim()}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'table': {
      const rows = (finalProps.csv || '').split('\n').map((r: string) => r.split(','));
      return (
        <div
          style={{
            ...containerStyle,
            overflow: 'auto',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {rows[0]?.map((h: string, i: number) => (
                  <th
                    key={i}
                    className="p-2 border-b border-white/20 text-xs uppercase"
                    style={{ color: finalProps.headerColor }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row: string[], i: number) => (
                <tr key={i} className="border-b border-white/5">
                  {row.map((c: string, j: number) => (
                    <td key={j} className="p-2 text-sm">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'status': {
      const statusColor =
        finalProps.status === 'ok'
          ? '#22c55e'
          : finalProps.status === 'warn'
          ? '#f59e0b'
          : '#ef4444';
      return (
        <div style={containerStyle}>
          <div
            style={{
              width: dimensions.h * 0.5,
              height: dimensions.h * 0.5,
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 ${dimensions.h * 0.3}px ${statusColor}`,
            }}
          />
          <div className="mt-2 font-bold uppercase tracking-widest text-xs">
            {finalProps.status}
          </div>
        </div>
      );
    }

    case 'weather':
    case 'weather_detailed':
    case 'weather_icon':
    case 'emojiWeather':
      return (
        <div style={containerStyle} className="flex flex-col">
          <Sun size={dimensions.h * 0.4} />
          <span className="font-bold mt-2">
            72°{finalProps.units || 'F'}
          </span>
          <span className="text-xs">{finalProps.city || 'New York'}</span>
        </div>
      );

    case 'menu':
      return (
        <div
          style={{
            ...containerStyle,
            display: 'grid',
            gridTemplateColumns: `repeat(${finalProps.columns || 1}, 1fr)`,
            gap: '8px',
            padding: '8px',
            alignItems: 'start',
            justifyContent: 'start',
            overflow: 'auto',
          }}
        >
          {(finalProps.items || []).map((item: any, i: number) => (
            <div
              key={i}
              className="flex justify-between border-b border-white/10 pb-1"
            >
              <span className="font-bold">{item.n}</span>
              <span className="text-orange-400">${item.p}</span>
            </div>
          ))}
        </div>
      );

    case 'bar':
    case 'chart':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={parseChartData(finalProps.data)}>
            <Bar dataKey="value" fill={finalProps.color || '#fbbf24'} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pie': {
      const pieData = parseChartData(finalProps.data);
      const colors = (finalProps.colors || '#fbbf24,#374151').split(',');
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(dimensions.w, dimensions.h) / 2.5}
              fill="#8884d8"
              stroke="none"
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length] || '#ccc'}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case 'progress':
      return (
        <div style={{ ...containerStyle, padding: 20 }}>
          <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
            <div
              style={{
                width: `${(finalProps.value / finalProps.max) * 100}%`,
                height: '100%',
                backgroundColor: finalProps.color || '#10b981',
              }}
            />
          </div>
          <div className="mt-2 font-bold">{finalProps.value}%</div>
        </div>
      );

    case 'qrcode':
      return (
        <div
          style={{
            ...containerStyle,
            backgroundColor: finalProps.bg || '#fff',
            padding: 8,
          }}
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
              finalProps.data || 'https://accelanalysis.com',
            )}&color=${(finalProps.color || '#000').replace('#', '')}`}
            alt="QR"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      );

    case 'html':
      return (
        <div
          style={containerStyle}
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: finalProps.code || '' }}
        />
      );

    case 'iframe':
      if (!finalProps.url) return <div style={containerStyle} className="bg-neutral-900" />;
      return (
        <iframe
          src={finalProps.url}
          title="Embedded Content"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: containerStyle.borderRadius as any,
          }}
        />
      );

    case 'marquee':
      return (
        <div
          style={{
            ...containerStyle,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            justifyContent: 'center',
          }}
        >
          <div
            className="animate-marquee"
            style={{
              display: 'inline-block',
              animation: `marquee ${200 / (finalProps.speed || 10)}s linear infinite`,
              paddingLeft: '100%',
            }}
          >
            {finalProps.text}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
        </div>
      );

    case 'carousel':
    case 'scene':
      return (
        <div style={{ ...containerStyle, backgroundColor: '#000' }}>
          <img
            src={
              finalProps.urls?.[0] ||
              'https://placehold.co/800x450/111/444?text=Slideshow'
            }
            alt="Slideshow"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
            }}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
        </div>
      );

    case 'mic':
      return (
        <div
          style={{
            ...containerStyle,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 2,
            padding: 20,
          }}
        >
          {[0.4, 0.7, 0.3, 0.8, 0.5, 0.9, 0.6, 0.4].map((h, i) => (
            <div
              key={i}
              style={{
                width: '10%',
                height: `${h * 100}%`,
                backgroundColor: finalProps.color || '#fbbf24',
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      );

    case 'camera':
      return (
        <div style={{ ...containerStyle, backgroundColor: '#000' }}>
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
            LIVE
          </div>
          <ImageIcon className="text-neutral-700" size={48} />
          <div className="text-neutral-600 text-xs mt-2">Camera Feed Offline</div>
        </div>
      );

    case 'openai':
      return (
        <div
          style={{
            ...containerStyle,
            padding: 20,
            alignItems: 'flex-start',
            textAlign: 'left',
          }}
        >
          <div className="text-[10px] uppercase font-bold text-purple-400 mb-2 flex items-center gap-1">
            <Box size={10} /> AI Generated
          </div>
          <div className="text-sm opacity-90">
            {finalProps.prompt
              ? `Result for "${finalProps.prompt}"...`
              : 'Enter a prompt'}
          </div>
        </div>
      );

    case 'flipboard':
      return (
        <div
          style={{
            ...containerStyle,
            backgroundColor: '#111',
            perspective: 1000,
          }}
        >
          <div className="bg-neutral-800 px-4 py-2 rounded border-b-2 border-black text-4xl font-bold font-mono tracking-widest shadow-xl">
            {finalProps.number || '00'}
          </div>
        </div>
      );

    case 'sheetcell':
      return (
        <div
          style={{
            ...containerStyle,
            border: '1px solid #10b981',
            backgroundColor: '#064e3b',
            color: '#fff',
          }}
        >
          <div className="absolute top-0 left-0 bg-[#10b981] text-[8px] text-black px-1 font-bold">
            {finalProps.cell || 'A1'}
          </div>
          <SheetCellTile url={finalProps.url || ''} cell={finalProps.cell || 'A1'} />
        </div>
      );

    case 'lottie':
    case 'particles':
    case '3dmodel':
      return (
        <div
          style={{
            ...containerStyle,
            border: '1px dashed #555',
            background:
              'repeating-linear-gradient(45deg, #111, #111 10px, #222 10px, #222 20px)',
          }}
        >
          <Box className="text-neutral-500 animate-spin" size={32} />
          <div className="text-[10px] text-neutral-500 mt-2 font-bold uppercase">
            {type} Placeholder
          </div>
        </div>
      );

    case 'button':
      return (
        <button
          style={{
            ...containerStyle,
            backgroundColor: finalProps.bg || 'blue',
            color: 'white',
          }}
          className="px-4 py-2 rounded cursor-pointer"
          onClick={finalProps.onClick || (() => {})}
        >
          {finalProps.label || 'Click me'}
        </button>
      );

    case 'calendar':
      return (
        <div style={containerStyle}>
          <div className="text-xs uppercase opacity-60 mb-1">Calendar</div>
          <div className="text-lg font-bold">
            {finalProps.date || new Date().toLocaleDateString()}
          </div>
        </div>
      );

    case 'alert':
      return (
        <div
          style={{ ...containerStyle, backgroundColor: '#b91c1c', color: 'white' }}
          className="p-4 rounded"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} />
            <span className="font-bold text-sm">Alert</span>
          </div>
          <div className="text-xs opacity-90">
            {finalProps.message || 'Alert message'}
          </div>
        </div>
      );

    case 'link':
      return (
        <a
          href={finalProps.url || '#'}
          style={{ ...containerStyle, color: '#3b82f6', textDecoration: 'underline' }}
          className="flex items-center justify-center"
        >
          {finalProps.text || 'Link'}
        </a>
      );

    case 'custom':
      return (
        <div style={containerStyle} className="text-[10px] break-all px-2">
          {JSON.stringify(finalProps)}
        </div>
      );

    case 'gallery': {
      const urls: string[] = finalProps.urls || [];
      return (
        <div
          style={{
            ...containerStyle,
            display: 'grid',
            gridTemplateColumns: `repeat(${finalProps.columns || 2}, 1fr)`,
            gap: 4,
            padding: 4,
          }}
          className="overflow-auto w-full h-full"
        >
          {urls.length === 0
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-full h-24 bg-neutral-700 flex items-center justify-center text-xs text-neutral-300"
                >
                  Image {i}
                </div>
              ))
            : urls.map((u, i) => (
                <img
                  key={i}
                  src={u}
                  alt="Gallery"
                  className="w-full h-24 object-cover rounded"
                />
              ))}
        </div>
      );
    }

    case 'news':
      return (
        <div
          style={{
            ...containerStyle,
            alignItems: 'flex-start',
            padding: 12,
            overflow: 'auto',
          }}
        >
          <div className="text-[10px] uppercase font-bold text-orange-500 mb-2 flex items-center gap-1">
            <Globe size={12} /> News
          </div>
          <ul className="space-y-1 text-xs text-left">
            <li>Restaurant group opens 3 new locations.</li>
            <li>Limited-time breakfast menu launches Monday.</li>
            <li>Mobile ordering volume hits new record.</li>
          </ul>
        </div>
      );

    case 'social':
      return (
        <div
          style={{
            ...containerStyle,
            alignItems: 'flex-start',
            padding: 12,
            overflow: 'auto',
          }}
        >
          <div className="text-[10px] uppercase font-bold text-sky-400 mb-2 flex items-center gap-1">
            <Globe size={12} /> Social Feed
          </div>
          <div className="space-y-1 text-xs">
            <div>@accelrestaurants: "New lunch combos now live!"</div>
            <div>@foodie123: "Best burger in town. 🔥"</div>
            <div>@deliveryapp: "Free delivery this weekend."</div>
          </div>
        </div>
      );

    default: {
      const def = TILE_REGISTRY[type as TileTypeKey];
      return (
        <div
          style={{ ...containerStyle, border: '1px dashed #555' }}
          className="relative group"
        >
          {def?.icon && <def.icon size={24} className="opacity-50 mb-2" />}
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
            {def?.label || type}
          </span>
          <span className="text-[9px] opacity-40 mt-1 max-w-[90%] truncate text-center">
            {JSON.stringify(finalProps).slice(0, 30)}...
          </span>
        </div>
      );
    }
  }
}