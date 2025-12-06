export interface RenderContext {
  menuItems: MenuItem[];
  campaigns: Campaign[];
}

export interface Organization {
  id: string;
  name: string;
  plan: 'Free' | 'Growth' | 'Enterprise';
}

export interface Location {
  id: string;
  orgId: string;
  name: string;
  screens: Screen[];
}

export interface Screen {
  id: string;
  locationId: string;
  name: string;
  rotationMs: number;
  slides: string[];
  transition?: 'fade' | 'slide' | 'none';
  algorithm?: 'loop' | 'random' | 'custom';
  customSequence?: string[];
}

export interface Slide {
  id: string;
  orgId: string;
  name: string;
  background: string;
  elements: TileInstance[];
  width: number;
  height: number;
  duration?: number;
}

export interface TileInstance {
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

export interface DataBinding {
  source: 'menu' | 'campaign' | 'none';
  itemId?: string;
  field?: string;
}

export interface MenuItem {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  calories?: string;
}

export interface MenuSection {
  id: string;
  name: string;
  order: number;
}

export interface Campaign {
  id: string;
  name: string;
  offerCode: string;
  status: 'Active' | 'Scheduled' | 'Ended';
  radiusMiles: number;
  startDate: string;
  endDate: string;
}

export type TileTypeKey = 
  | '3dmodel' | 'audio' | 'avatar' | 'bar' | 'camera' | 'carousel' | 'chart' | 'clock' | 'countdown' 
  | 'crypto' | 'custom' | 'date' | 'emojiWeather' | 'flipboard' | 'gif' | 'gradient' | 'html' | 'icon' 
  | 'iframe' | 'image' | 'list' | 'lottie' | 'map' | 'marquee' | 'menu' | 'mic' | 'news' | 'openai' 
  | 'particles' | 'pie' | 'progress' | 'qrcode' | 'quote' | 'random_image' | 'rss' | 'scene' 
  | 'shape' | 'sheetcell' | 'social' | 'status' | 'stock' | 'table' | 'text' | 'timer' | 'video' 
  | 'vimeo' | 'weather' | 'weather_detailed' | 'weather_icon' | 'youtube' | 'button' | 'calendar' | 'alert' | 'link' | 'gallery';

export interface TileTemplate {
  id: string;
  orgId: string | 'ACCEL_GLOBAL';
  type: TileTypeKey;
  name: string;
  tags: string[];
  defaultProps: any;
  defaultDimensions?: { w: number, h: number };
}
