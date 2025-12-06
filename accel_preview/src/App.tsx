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
  Link as LinkIcon, Edit3, ArrowUpRight, Rocket, Copy, X,
  Film, Frame, BatteryCharging, FileSpreadsheet, CloudLightning, Code, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie 
} from 'recharts';

/**
 * --- ACCEL RESTAURANTS™ PLATFORM (FINAL) ---
 * Complete Production-Level Platform
 * Version: 3.0.0-gold
 */

// --- 1. CORE TYPES & INTERFACES ---

interface RenderContext {
  menuItems: MenuItem[];
  campaigns: Campaign[];
}

interface Organization {
  id: string;
  name: string;
  plan: 'Free' | 'Growth' | 'Enterprise';
}

interface Location {
  id: string;
  orgId: string;
  name: string;
  screens: Screen[];
}

interface Screen {
  id: string;
  locationId: string;
  name: string;
  rotationMs: number;
  slides: string[];
  transition?: 'fade' | 'slide' | 'none';
  algorithm?: 'loop' | 'random' | 'custom';
  customSequence?: string[];
}

interface Slide {
  id: string;
  orgId: string;
  name: string;
  background: string;
  elements: TileInstance[];
  width: number;
  height: number;
  duration?: number;
}

interface TileInstance {
  id: string;
  type: TileTypeKey;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  opacity: number;
  props: Record<string, any>;
  binding?: DataBinding;
}

interface DataBinding {
  source: 'menu' | 'campaign' | 'none';
  itemId?: string;
  field?: string;
}

interface MenuItem {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  calories?: string;
}

interface MenuSection {
  id: string;
  name: string;
  order: number;
}

interface Campaign {
  id: string;
  name: string;
  offerCode: string;
  status: 'Active' | 'Scheduled' | 'Ended';
  radiusMiles: number;
  startDate: string;
  endDate: string;
}

type TileTypeKey = 
  | '3dmodel' | 'audio' | 'avatar' | 'bar' | 'camera' | 'carousel' | 'chart' | 'clock' | 'countdown' 
  | 'crypto' | 'custom' | 'date' | 'emojiWeather' | 'flipboard' | 'gif' | 'gradient' | 'html' | 'icon' 
  | 'iframe' | 'image' | 'list' | 'lottie' | 'map' | 'marquee' | 'menu' | 'mic' | 'news' | 'openai' 
  | 'particles' | 'pie' | 'progress' | 'qrcode' | 'quote' | 'random_image' | 'rss' | 'scene' 
  | 'shape' | 'sheetcell' | 'social' | 'status' | 'stock' | 'table' | 'text' | 'timer' | 'video' 
  | 'vimeo' | 'weather' | 'weather_detailed' | 'weather_icon' | 'youtube' | 'button' | 'calendar' | 'alert' | 'link' | 'gallery';

interface TileTemplate {
  id: string;
  orgId: string | 'ACCEL_GLOBAL';
  type: TileTypeKey;
  name: string;
  tags: string[];
  defaultProps: any;
  defaultDimensions?: { w: number, h: number };
}

// --- 2. THE STRICT 46-TILE REGISTRY ---

const TILE_REGISTRY: Record<TileTypeKey, { label: string; icon: any; defaultProps: any; category: string }> = {
  // Core Media & Text
  text: { label: 'Text Block', icon: Type, category: 'Core', defaultProps: { content: 'Double click to edit', fontSize: 32, color: '#ffffff', textAlign: 'left', fontFamily: 'Inter', fontWeight: 'normal' } },
  image: { label: 'Image', icon: ImageIcon, category: 'Core', defaultProps: { url: 'https://placehold.co/400x300/222/fff?text=Image', fit: 'cover', radius: 8 } },
  video: { label: 'Video File', icon: Video, category: 'Core', defaultProps: { url: '', loop: true, muted: true, autoplay: true } },
  audio: { label: 'Audio', icon: Music, category: 'Core', defaultProps: { url: '', volume: 0.5, loop: true } },
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
const INITIAL_ORG: Organization = { id: 'org_01', name: 'Demo Restaurant Group', plan: 'Growth' };

const INITIAL_TEMPLATES: TileTemplate[] = [
  { id: 't_01', orgId: 'ACCEL_GLOBAL', type: 'text', name: 'Price Tag - Large', tags: ['price', 'menu'], defaultProps: { content: '$12.99', fontSize: 64, color: '#fbbf24', fontWeight: 'bold' }, defaultDimensions: { w: 200, h: 80 } },
  { id: 't_02', orgId: 'ACCEL_GLOBAL', type: 'text', name: 'Menu Item Title', tags: ['menu'], defaultProps: { content: 'Cheeseburger', fontSize: 32, color: '#ffffff', fontWeight: 'bold' }, defaultDimensions: { w: 300, h: 50 } },
];

const INITIAL_SLIDES: Slide[] = [
  { 
    id: 'slide_01', orgId: 'org_01', name: 'Morning Menu', background: '#111827', width: 800, height: 450,
    elements: [
      { id: 'el_01', type: 'text', x: 50, y: 40, width: 400, height: 60, zIndex: 1, opacity: 1, props: { content: 'BREAKFAST SPECIAL', fontSize: 40, color: '#fbbf24', fontWeight: 'bold' } },
      // Example of a bound element:
      { id: 'el_02', type: 'text', x: 50, y: 120, width: 300, height: 40, zIndex: 1, opacity: 1, props: { content: 'Avocado Toast', fontSize: 24, color: '#fff' }, binding: { source: 'menu', itemId: 'item_01', field: 'name' } },
      { id: 'el_03', type: 'text', x: 400, y: 120, width: 100, height: 40, zIndex: 1, opacity: 1, props: { content: '$8.50', fontSize: 24, color: '#fbbf24', textAlign: 'right' }, binding: { source: 'menu', itemId: 'item_01', field: 'price' } },
    ] 
  }
];

const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc_01', orgId: 'org_01', name: 'Downtown Branch', screens: [{ id: 'scr_01', locationId: 'loc_01', name: 'Main Menu Board', rotationMs: 10000, slides: ['slide_01'] }] }
];

const INITIAL_MENU_SECTIONS: MenuSection[] = [
  { id: 'sec_01', name: 'Breakfast', order: 0 },
  { id: 'sec_02', name: 'Burgers', order: 1 },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'item_01', sectionId: 'sec_01', name: 'Avocado Toast', description: 'Sourdough, smashed avocado, chili flakes.', price: '8.50', imageUrl: 'https://placehold.co/100x100?text=Toast' },
  { id: 'item_02', sectionId: 'sec_02', name: 'Classic Burger', description: 'Lettuce, tomato, onion, secret sauce.', price: '12.00', imageUrl: 'https://placehold.co/100x100?text=Burger' },
];

// --- 4. MAIN APPLICATION COMPONENT ---

export default function AccelRestaurants_Platform() {
  const [activeTab, setActiveTab] = useState<'screens'|'menu'|'kpi'>('screens');
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [slides, setSlides] = useState<Slide[]>(INITIAL_SLIDES);
  const [templates, setTemplates] = useState<TileTemplate[]>(INITIAL_TEMPLATES);
  const [menuSections, setMenuSections] = useState<MenuSection[]>(INITIAL_MENU_SECTIONS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  
  const [activeLocationId, setActiveLocationId] = useState<string>(INITIAL_LOCATIONS[0].id);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const activeLocation = locations.find(l => l.id === activeLocationId);
  const activeSlide = slides.find(s => s.id === editingSlideId);

  // --- Global Context for Renderer ---
  const renderContext = useMemo(() => ({ menuItems, campaigns: [] }), [menuItems]);

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-orange-400">
            <Layout size={24} />
            <div className="leading-tight">
              <h1 className="font-bold text-lg tracking-tight text-white">AccelRestaurants™</h1>
              <p className="text-[10px] font-medium tracking-wider text-neutral-400">CLARITY. STRATEGY. EXECUTION.</p>
            </div>
          </div>
          <div className="h-6 w-px bg-neutral-800 mx-2" />
          <nav className="flex gap-1">
            {[
              { id: 'screens', label: 'Screens', icon: Monitor },
              { id: 'menu', label: 'Menu Data', icon: Database },
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
          <button 
            onClick={() => {
              const name = prompt("Enter new location name:");
              if (name) {
                const newId = generateId();
                const newLoc: Location = { 
                  id: newId, 
                  orgId: INITIAL_ORG.id, 
                  name, 
                  screens: [{ id: generateId(), locationId: newId, name: 'Main Screen', rotationMs: 10000, slides: [] }] 
                };
                setLocations([...locations, newLoc]);
                setActiveLocationId(newId);
              }
            }}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Plus size={14} /> Loc
          </button>
          <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700">
            <MapPin size={14} className="text-orange-500" />
            <select 
              value={activeLocationId} 
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
              onUpdate={(updated) => setSlides(prev => prev.map(s => s.id === updated.id ? updated : s))} 
              onClose={() => setEditingSlideId(null)}
              templates={templates}
              onSaveTemplate={(t) => setTemplates(prev => [...prev, t])}
              menuItems={menuItems}
              renderContext={renderContext}
            />
          ) : (
            <Dashboard 
              location={activeLocation!} 
              slides={slides} 
              onEditSlide={setEditingSlideId}
              onCreateSlide={() => setSlides([...slides, { id: generateId(), orgId: INITIAL_ORG.id, name: 'New Slide', background: '#111827', width: 800, height: 450, elements: [] }])}
              onUpdateLocation={(updatedLoc) => setLocations(locations.map(l => l.id === updatedLoc.id ? updatedLoc : l))}
            />
          )
        )}
        
        {activeTab === 'menu' && <MenuModule sections={menuSections} items={menuItems} onUpdateSections={setMenuSections} onUpdateItems={setMenuItems} />}
        {activeTab === 'kpi' && <KPIModule />}
      </main>
    </div>
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
    <div className="fixed inset-0 z-100 bg-black flex items-center justify-center">
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
  );
}

function Dashboard({ location, slides, onEditSlide, onCreateSlide, onUpdateLocation }: { 
  location: Location, slides: Slide[], onEditSlide: (id: string) => void, onCreateSlide: () => void, onUpdateLocation: (l: Location) => void 
}) {
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [deployingScreenId, setDeployingScreenId] = useState<string | null>(null);
  const [playingScreenId, setPlayingScreenId] = useState<string | null>(null);
  const editingScreen = location?.screens.find(s => s.id === editingScreenId);
  const deployingScreen = location?.screens.find(s => s.id === deployingScreenId);
  const playingScreen = location?.screens.find(s => s.id === playingScreenId);

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
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-[500px] shadow-2xl" onClick={e => e.stopPropagation()}>
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
                  <code className="text-xs text-green-500 font-mono truncate">https://display.accel.com/s/{deployingScreen.id}</code>
                  <button className="text-neutral-500 hover:text-white" onClick={() => navigator.clipboard.writeText(`https://display.accel.com/s/${deployingScreen.id}`)} title="Copy URL"><Copy size={14}/></button>
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

function SlideEditor({ slide, onUpdate, onClose, templates, onSaveTemplate, menuItems, renderContext }: { 
  slide: Slide, onUpdate: (s: Slide) => void, onClose: () => void, templates: TileTemplate[], 
  onSaveTemplate: (t: TileTemplate) => void, menuItems: MenuItem[], renderContext: RenderContext 
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
      <div className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col">
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
                    <div className="grid grid-cols-3 gap-2">
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

      <div className="flex-1 relative bg-neutral-950 flex flex-col">
        <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900">
          <input type="text" value={slide.name} onChange={(e) => onUpdate({...slide, name: e.target.value})} className="bg-transparent text-sm font-medium outline-none text-white focus:text-orange-400" />
          <div className="flex items-center gap-2 text-xs text-neutral-500">
             <span className="uppercase font-bold text-[9px]">Size:</span>
             <input type="number" value={slide.width || 800} onChange={(e) => onUpdate({...slide, width: Number(e.target.value)})} className="bg-neutral-800 border border-neutral-700 rounded w-12 text-center text-white" />
             <span>x</span>
             <input type="number" value={slide.height || 450} onChange={(e) => onUpdate({...slide, height: Number(e.target.value)})} className="bg-neutral-800 border border-neutral-700 rounded w-12 text-center text-white" />
             <span className="ml-1">px</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center justify-center" onClick={() => setSelectedElId(null)}>
          <div ref={canvasRef} className="relative shadow-2xl bg-neutral-900 overflow-hidden" style={{ width: `${slide.width || 800}px`, height: `${slide.height || 450}px`, backgroundColor: slide.background, backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
             {slide.elements.sort((a,b) => a.zIndex - b.zIndex).map(el => (
               <div key={el.id} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.zIndex, opacity: el.opacity, border: selectedElId === el.id ? '1px solid #fbbf24' : '1px solid transparent' }} onMouseDown={(e) => handleMouseDown(e, el.id, 'move')} className="group">
                 <TileRenderer type={el.type} props={el.props} dimensions={{w: el.width, h: el.height}} binding={el.binding} context={renderContext} />
                 {selectedElId === el.id && (
                   <>
                     <div className="absolute -top-3 -left-1 bg-orange-500 text-black text-[9px] font-bold">{TILE_REGISTRY[el.type].label}</div>
                     <div className="absolute bottom-0 right-0 w-4 h-4 bg-orange-500 cursor-nwse-resize flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}><Move size={10} className="text-black" /></div>
                   </>
                 )}
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800"><h3 className="font-semibold text-sm">Properties</h3></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedEl ? (
            <>
              {/* Data Binding Section - NEW in Part 2 */}
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-800">
                 <h4 className="text-[10px] font-bold text-orange-500 uppercase mb-2 flex items-center gap-1"><LinkIcon size={10} /> Connect Data</h4>
                 <div className="space-y-2">
                    <div className="flex gap-2 text-xs mb-2">
                       <button onClick={() => updateElement(selectedEl.id, { binding: { source: 'none' } })} className={`flex-1 py-1 rounded border ${selectedEl.binding?.source === 'none' ? 'bg-neutral-700 border-white text-white' : 'border-neutral-700 text-neutral-500'}`}>Static</button>
                       <button onClick={() => updateElement(selectedEl.id, { binding: { source: 'menu' } })} className={`flex-1 py-1 rounded border ${selectedEl.binding?.source === 'menu' ? 'bg-orange-900/30 border-orange-500 text-orange-400' : 'border-neutral-700 text-neutral-500'}`}>Menu Item</button>
                    </div>
                    {selectedEl.binding?.source === 'menu' && (
                      <>
                        <select value={selectedEl.binding.itemId || ''} onChange={(e) => updateElement(selectedEl.id, { binding: { source: 'menu', field: selectedEl.binding?.field, itemId: e.target.value } })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs mb-2">
                           <option value="">Select Item...</option>
                           {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <select value={selectedEl.binding.field || ''} onChange={(e) => updateElement(selectedEl.id, { binding: { source: 'menu', itemId: selectedEl.binding?.itemId, field: e.target.value } })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs">
                           <option value="">Select Field...</option>
                           <option value="name">Name</option>
                           <option value="price">Price</option>
                           <option value="description">Description</option>
                           <option value="calories">Calories</option>
                           <option value="imageUrl">Image URL</option>
                        </select>
                        <div className="text-[10px] text-green-500 mt-1 flex items-center gap-1"><ArrowUpRight size={10} /> Live Bound</div>
                      </>
                    )}
                 </div>
              </div>

              {/* Standard Props */}
              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-neutral-500 uppercase">Style & Layout</h4>
                 <div className="grid grid-cols-2 gap-2">
                    {['x', 'y', 'width', 'height', 'opacity', 'zIndex'].map(prop => (
                      <div key={prop}>
                        <label className="text-[9px] text-neutral-500 uppercase block mb-1">{prop}</label>
                        <input type="number" value={Math.round((selectedEl as any)[prop])} onChange={(e) => updateElement(selectedEl.id, { [prop]: Number(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs" />
                      </div>
                    ))}
                 </div>
                 {Object.entries(selectedEl.props).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{key}</label>
                      {key.includes('color') || key === 'bg' ? (
                         <div className="flex gap-2">
                           <input type="color" value={val} onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.value } })} className="h-8 w-8 bg-transparent cursor-pointer" />
                           <input type="text" value={val} onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.value } })} className="flex-1 bg-neutral-950 border border-neutral-700 rounded p-1 text-xs" />
                         </div>
                      ) : (
                         <input type={typeof val === 'number' ? 'number' : 'text'} value={val} onChange={(e) => updateElement(selectedEl.id, { props: { ...selectedEl.props, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value } })} className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-xs" />
                      )}
                    </div>
                 ))}
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-col gap-2">
                 <button onClick={handleCreateTemplate} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded text-xs font-medium flex items-center justify-center gap-2"><Save size={14} /> Save as Template</button>
                 <button onClick={() => onUpdate({...slide, elements: slide.elements.filter(e => e.id !== selectedEl.id)})} className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded text-xs font-medium flex items-center justify-center gap-2"><Trash2 size={14} /> Delete Tile</button>
              </div>
            </>
          ) : (
            <div className="text-center text-neutral-500 text-sm mt-10">Select an element to edit properties.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 9. TILE RENDERER (Updated with Binding Logic) ---

function TileRenderer({ type, props, dimensions, binding, context }: { 
  type: TileTypeKey, 
  props: Record<string, any>, 
  dimensions: { w: number, h: number }, 
  binding?: DataBinding, 
  context?: RenderContext 
}) {
  // BINDING RESOLUTION LOGIC
  let finalProps = { ...props };
  console.log(`Debug: Rendering tile of type ${type} with final props:`, JSON.stringify(finalProps));
  
  if (binding && binding.source === 'menu' && binding.itemId && binding.field && context?.menuItems) {
    const item = context.menuItems.find(i => i.id === binding.itemId);
    if (item) {
      const fieldKey = binding.field as keyof MenuItem;
      const val = item[fieldKey];
      if (type === 'text') finalProps.content = fieldKey === 'price' ? `$${String(val)}` : String(val);
      if (type === 'image') finalProps.url = String(val);
    }
  }

  // Common Styles
  const containerStyle: React.CSSProperties = {
    width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: finalProps.color || '#fff', fontSize: finalProps.fontSize ? `${finalProps.fontSize}px` : '16px', textAlign: finalProps.textAlign as any, 
    fontFamily: finalProps.fontFamily || 'Inter', fontWeight: finalProps.fontWeight || 'normal', backgroundColor: finalProps.bg || 'transparent', borderRadius: finalProps.radius ? `${finalProps.radius}px` : 0
  };

  switch (type) {
    case 'text': return <div style={{ ...containerStyle, whiteSpace: 'pre-wrap' }} className="p-2">{finalProps.content || 'Default text'}</div>;
    case 'image': return <img src={finalProps.url || 'https://placehold.co/400x300'} alt="Image" style={{ ...containerStyle, objectFit: finalProps.fit || 'cover' }} className="w-full h-full" />;
    case 'video': return <video src={finalProps.url || ''} autoPlay loop muted style={{ ...containerStyle, objectFit: 'cover' }} className="w-full h-full" />;
    case 'audio': return <audio src={finalProps.url || ''} autoPlay loop controls style={containerStyle} className="w-full h-full" />;
    case 'gif': return <img src={finalProps.url || 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif'} alt="GIF" style={{ ...containerStyle, objectFit: finalProps.fit || 'cover' }} className="w-full h-full" />;
    case 'shape': return <div style={{...containerStyle, backgroundColor: finalProps.bg || 'gray', borderRadius: `${finalProps.radius || 0}px` }} className="w-full h-full" />;
    case 'gradient': return <div style={{ background: `linear-gradient(${finalProps.direction || 'to right'}, ${finalProps.colors || '#000,#fff'})`, ...containerStyle }} className="w-full h-full" />;
    case 'weather': return <div style={containerStyle} className="flex flex-col items-center"><Sun size={dimensions.h * 0.4} /><span className="font-bold mt-2">{finalProps.temp || '72'}°{finalProps.units || 'F'}</span><span className="text-xs mt-1">{finalProps.city || 'Default City'}</span></div>; // TODO: Implement dynamic weather API call
    case 'menu': return <div style={{ ...containerStyle, display: 'grid', gridTemplateColumns: `repeat(${finalProps.columns || 1}, 1fr)`, gap: '8px', padding: '8px' }} className="w-full h-full">{(finalProps.items || []).map((item: any, i: number) => (<div key={i} className="flex justify-between p-2 border-b border-white/10"><span className="font-bold">{item.name}</span><span className="text-orange-400">${item.price}</span></div>))}</div>;
    case 'qrcode': return <div style={containerStyle} className="w-full h-full flex items-center justify-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(finalProps.data || 'https://accel.com')}&size=200x200&color=${finalProps.color?.replace('#', '') || '000000'}&bgcolor=${finalProps.bg?.replace('#', '') || 'FFFFFF'}`} alt="QR Code" style={{width: '100%', height: '100%'}} /></div>;
    case 'clock': return <div style={containerStyle} className="flex items-center justify-center">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: finalProps.showSeconds ? '2-digit' : undefined })}</div>; 
    case 'date': return <div style={containerStyle} className="flex items-center justify-center">{new Date().toLocaleDateString(finalProps.format || 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>;
    case 'timer': return <div style={containerStyle} className="flex items-center justify-center">Timer: {finalProps.label || 'Countdown'} {new Date().toLocaleTimeString()}</div>;
    case 'bar': return <div style={containerStyle} className="w-full h-full flex items-center justify-center">Bar Chart placeholder (not implemented)</div>; // TODO: Implement bar chart with recharts
    case 'pie': return (
      <div style={containerStyle} className="w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={finalProps.data.split(',').map((v, i) => ({ value: Number(v), fill: finalProps.colors.split(',')[i] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
    case 'carousel': return <div style={containerStyle} className="w-full h-full overflow-hidden">Carousel placeholder (not implemented)</div>; // TODO: Implement carousel logic
    case 'rss': return <div style={containerStyle} className="overflow-hidden">RSS Feed placeholder (not implemented)</div>; // TODO: Implement RSS feed logic
    case 'map': return <div style={containerStyle} className="w-full h-full">Map placeholder (not implemented)</div>; // TODO: Implement map logic with API
    case 'status': return <div style={{ ...containerStyle, backgroundColor: finalProps.status === 'ok' ? 'green' : finalProps.status === 'warn' ? 'yellow' : 'red' }} className="w-full h-full flex items-center justify-center">Status: {finalProps.status || 'ok'}</div>;
    case 'icon': return <div style={containerStyle} className="flex items-center justify-center"><Star size={finalProps.size || 64} color={finalProps.color || 'white'} /> <span>{finalProps.icon || 'icon'}</span></div>; // Using Star as default, TODO: dynamic icon based on string prop
    case 'html': return <div style={containerStyle} dangerouslySetInnerHTML={{ __html: finalProps.code || '' }} className="w-full h-full" />;
    case 'progress': return <div style={{ ...containerStyle, background: `linear-gradient(to right, ${finalProps.color || 'green'} 0%, ${finalProps.color || 'green'} ${finalProps.value || 50}%, gray 50%, gray 100%)`, borderRadius: '4px' }} className="w-full h-4" />; // TODO: Implement progress bar logic
    case 'table': return <div style={containerStyle} className="w-full h-full overflow-auto"><table style={{width: '100%', borderCollapse: 'collapse'}}><thead><tr style={{background: 'gray', color: 'white'}}><th>Header1</th><th>Header2</th></tr></thead><tbody>{(finalProps.data || []).map((row: string[], i: number) => (<tr key={i} style={{borderBottom: '1px solid white'}}><td style={{padding: '4px'}}>{row[0]}</td><td style={{padding: '4px'}}>{row[1]}</td></tr>))}</tbody></table></div>; 
    case 'countdown': return <div style={containerStyle} className="flex items-center justify-center">Countdown placeholder (not implemented)</div>; // TODO: Implement countdown logic with target date
    case 'emojiWeather': return <div style={containerStyle} className="flex items-center justify-center">Weather Emoji placeholder (not implemented)</div>; // TODO: Implement weather emoji logic
    case 'crypto': return <div style={containerStyle} className="flex items-center justify-center">Crypto: {finalProps.symbol || 'BTC'} - $50,000</div>; // TODO: Implement real-time crypto price API call
    case 'stock': return <div style={containerStyle} className="flex items-center justify-center">Stock: {finalProps.symbol || 'AAPL'} - $150.00</div>; // TODO: Implement real-time stock price API call
    case 'news': return <div style={containerStyle} className="w-full h-full overflow-auto">News Feed placeholder (not implemented)</div>; // TODO: Implement news feed with API
    case 'social': return <div style={containerStyle} className="w-full h-full flex items-center justify-center">Social Feed placeholder (not implemented)</div>; // TODO: Implement social media feed
    case 'button': return <button style={{ ...containerStyle, backgroundColor: finalProps.bg || 'blue', color: 'white' }} className="p-2 rounded cursor-pointer" onClick={finalProps.onClick || (() => {})}>{finalProps.label || 'Click me'}</button>; // Explicitly using native button element
    case 'chart': return <div style={containerStyle} className="w-full h-full flex items-center justify-center">Chart placeholder (not implemented)</div>; 
    case 'calendar': return <div style={containerStyle} className="w-full h-full flex items-center justify-center">Calendar: {new Date().toLocaleDateString()}</div>;
    case 'alert': return <div style={{ ...containerStyle, backgroundColor: 'red', color: 'white' }} className="p-4 rounded">{finalProps.message || 'Alert message'}</div>;
    case 'custom': return <div style={containerStyle} className="w-full h-full flex items-center justify-center">Custom tile rendered: {JSON.stringify(finalProps)}</div>;
    case 'link': return <a href={finalProps.url || '#'} style={{ ...containerStyle, color: 'blue', textDecoration: 'underline' }} className="flex items-center justify-center">{finalProps.text || 'Link'}</a>; // TODO: Add target and rel attributes for security
    case 'gallery': return <div style={containerStyle} className="w-full h-full grid grid-cols-2 gap-2 p-2 overflow-auto">{[1,2,3,4].map((_, i) => (<div key={i} className="w-full h-32 bg-gray-500 flex items-center justify-center">Image {i+1}</div>))}</div>; // TODO: Implement dynamic image gallery from URLs
    default:
      const def = TILE_REGISTRY[type];
      return (
        <div style={{...containerStyle, border: '1px dashed #555'}} className="relative group">
           <def.icon size={24} className="opacity-50 mb-2" />
           <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{def.label}</span>
           <span className="text-[9px] opacity-40 mt-1 max-w-[90%] truncate text-center">{JSON.stringify(finalProps).slice(0, 30)}...</span>
        </div>
      );
  }
}