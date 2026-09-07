import { supabase } from './supabase';
import type { 
  Organization, Location, Screen, Slide, TileInstance, 
  MenuSection, MenuItem, TileTemplate, Campaign 
} from '../types';

// --- DATA MAPPING HELPERS ---

const mapScreen = (s: any): Screen => ({
  id: s.id,
  locationId: s.location_id,
  name: s.name,
  rotationMs: s.rotation_ms,
  transition: s.transition,
  algorithm: s.algorithm,
  customSequence: s.custom_sequence,
  slides: s.slides,
  audioConfig: s.audio_config || undefined
});

const mapSlide = (s: any, elements: any[]): Slide => ({
  id: s.id,
  orgId: s.org_id,
  name: s.name,
  background: s.background,
  width: s.width,
  height: s.height,
  duration: s.duration,
  elements: elements.map(e => ({
    id: e.id,
    type: e.type,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    zIndex: e.z_index,
    opacity: e.opacity,
    props: e.props,
    binding: e.binding
  }))
});

const mapMenuSection = (s: any): MenuSection => ({
  id: s.id,
  name: s.name,
  order: s.sort_order
});

const mapMenuItem = (i: any): MenuItem => ({
  id: i.id,
  sectionId: i.section_id,
  name: i.name,
  description: i.description,
  price: i.price,
  imageUrl: i.image_url,
  calories: i.calories
});

const mapTemplate = (t: any): TileTemplate => ({
  id: t.id,
  orgId: t.org_id || 'ACCEL_GLOBAL',
  type: t.type,
  name: t.name,
  tags: t.tags,
  defaultProps: t.default_props,
  defaultDimensions: t.default_dimensions
});

const mapCampaign = (c: any): Campaign => ({
  id: c.id,
  name: c.name,
  offerCode: c.offer_code,
  status: c.status,
  radiusMiles: c.radius_miles,
  startDate: c.start_date,
  endDate: c.end_date
});

// --- API METHODS ---

export const api = {
  // 1. FETCH INITIAL DATA
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) return [];
    return (data || []).map(o => ({ id: o.id, name: o.name, plan: o.plan }));
  },

  async getOrganization(orgId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    if (error) {
      console.error('Error fetching org:', error);
      return null;
    }
    return data as Organization;
  },

  async getLocations(orgId: string): Promise<Location[]> {
    const { data: locs, error: locError } = await supabase
      .from('locations')
      .select('*')
      .eq('org_id', orgId);

    if (locError || !locs) return [];

    const locations: Location[] = [];
    
    for (const loc of locs) {
      const { data: screens } = await supabase
        .from('screens')
        .select('*')
        .eq('location_id', loc.id);
        
      locations.push({
        id: loc.id,
        orgId: loc.org_id,
        name: loc.name,
        screens: (screens || []).map(mapScreen)
      });
    }
    
    return locations;
  },

  async getSlides(orgId: string): Promise<Slide[]> {
    const { data: slidesData, error } = await supabase
      .from('slides')
      .select('*')
      .eq('org_id', orgId);
      
    if (error || !slidesData) return [];

    const slides: Slide[] = [];
    for (const s of slidesData) {
      const { data: elements } = await supabase
        .from('slide_elements')
        .select('*')
        .eq('slide_id', s.id);
      
      slides.push(mapSlide(s, elements || []));
    }
    return slides;
  },

  async getMenu(orgId: string): Promise<{ sections: MenuSection[], items: MenuItem[] }> {
    const { data: sections } = await supabase
      .from('menu_sections')
      .select('*')
      .eq('org_id', orgId)
      .order('sort_order');

    const { data: items } = await supabase
      .from('menu_items')
      .select('*')
      .in('section_id', (sections || []).map(s => s.id));

    return {
      sections: (sections || []).map(mapMenuSection),
      items: (items || []).map(mapMenuItem)
    };
  },

  async getTemplates(orgId: string): Promise<TileTemplate[]> {
    const { data } = await supabase
      .from('tile_templates')
      .select('*')
      .or(`org_id.eq.${orgId},org_id.is.null`);
      
    return (data || []).map(mapTemplate);
  },

  async getCampaigns(orgId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('org_id', orgId);
    
    if (error) return [];
    return (data || []).map(mapCampaign);
  },

  // 2. MUTATIONS - LOCATION & SCREENS

  async createLocation(orgId: string, name: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .insert({ org_id: orgId, name })
      .select()
      .single();
      
    if (error) return null;
    
    const { data: screen } = await supabase
      .from('screens')
      .insert({ location_id: data.id, name: 'Main Screen' })
      .select()
      .single();

    return {
      id: data.id,
      orgId: data.org_id,
      name: data.name,
      screens: screen ? [mapScreen(screen)] : []
    };
  },

  async updateLocation(id: string, updates: { name?: string }): Promise<void> {
    await supabase.from('locations').update(updates).eq('id', id);
  },

  async updateScreen(screen: Screen): Promise<void> {
    await supabase.from('screens').update({
      name: screen.name,
      rotation_ms: screen.rotationMs,
      transition: screen.transition,
      algorithm: screen.algorithm,
      custom_sequence: screen.customSequence,
      slides: screen.slides,
      audio_config: screen.audioConfig || null
    }).eq('id', screen.id);
  },

  async createScreen(locationId: string, name: string): Promise<Screen | null> {
    const { data, error } = await supabase
      .from('screens')
      .insert({ location_id: locationId, name })
      .select()
      .single();

    if (error) return null;
    return data ? mapScreen(data) : null;
  },

  // 3. MUTATIONS - SLIDES

  async createSlide(orgId: string, slide: Partial<Slide>): Promise<Slide | null> {
    const { data: slideData, error } = await supabase
      .from('slides')
      .insert({
        org_id: orgId,
        name: slide.name,
        background: slide.background,
        width: slide.width,
        height: slide.height
      })
      .select()
      .single();

    if (error || !slideData) return null;

    if (slide.elements && slide.elements.length > 0) {
        await supabase.from('slide_elements').insert(
            slide.elements.map(e => ({
                slide_id: slideData.id,
                type: e.type,
                x: e.x,
                y: e.y,
                width: e.width,
                height: e.height,
                z_index: e.zIndex,
                opacity: e.opacity,
                props: e.props,
                binding: e.binding || { source: 'none' }
            }))
        );
    }

    return await this.getSlide(slideData.id);
  },

  async updateSlide(slide: Slide): Promise<void> {
    await supabase.from('slides').update({
      name: slide.name,
      background: slide.background,
      width: slide.width,
      height: slide.height,
      duration: slide.duration
    }).eq('id', slide.id);

    await supabase.from('slide_elements').delete().eq('slide_id', slide.id);
    
    if (slide.elements.length > 0) {
      await supabase.from('slide_elements').insert(
        slide.elements.map(e => ({
          slide_id: slide.id,
          type: e.type,
          x: e.x,
          y: e.y,
          width: e.width,
          height: e.height,
          z_index: e.zIndex,
          opacity: e.opacity,
          props: e.props,
          binding: e.binding
        }))
      );
    }
  },

  async getSlide(slideId: string): Promise<Slide | null> {
     const { data: s } = await supabase.from('slides').select('*').eq('id', slideId).single();
     if (!s) return null;
     const { data: elements } = await supabase.from('slide_elements').select('*').eq('slide_id', slideId);
     return mapSlide(s, elements || []);
  },

  // 4. MUTATIONS - MENU

  async updateMenuSection(section: MenuSection): Promise<void> {
      await supabase.from('menu_sections').update({ name: section.name, sort_order: section.order }).eq('id', section.id);
  },

  async createMenuSection(orgId: string, name: string, order: number): Promise<MenuSection | null> {
      const { data } = await supabase.from('menu_sections').insert({ org_id: orgId, name, sort_order: order }).select().single();
      return data ? mapMenuSection(data) : null;
  },

  async updateMenuItem(item: MenuItem): Promise<void> {
      await supabase.from('menu_items').update({
          name: item.name, description: item.description, price: item.price, 
          image_url: item.imageUrl, calories: item.calories
      }).eq('id', item.id);
  },

  async createMenuItem(sectionId: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
      const { data } = await supabase.from('menu_items').insert({
          section_id: sectionId,
          name: item.name || 'New Item',
          description: item.description,
          price: item.price,
          image_url: item.imageUrl
      }).select().single();
      return data ? mapMenuItem(data) : null;
  },

  async createTemplate(template: TileTemplate): Promise<void> {
      await supabase.from('tile_templates').insert({
          org_id: template.orgId === 'ACCEL_GLOBAL' ? null : template.orgId,
          type: template.type,
          name: template.name,
          tags: template.tags,
          default_props: template.defaultProps,
          default_dimensions: template.defaultDimensions
      });
  },

  async createCampaign(orgId: string, campaign: Partial<Campaign>): Promise<Campaign | null> {
    const { data } = await supabase.from('campaigns').insert({
      org_id: orgId,
      name: campaign.name,
      offer_code: campaign.offerCode,
      status: campaign.status,
      radius_miles: campaign.radiusMiles,
      start_date: campaign.startDate,
      end_date: campaign.endDate
    }).select().single();
    
    return data ? mapCampaign(data) : null;
  },

  async updateCampaign(campaign: Campaign): Promise<void> {
    await supabase.from('campaigns').update({
      name: campaign.name,
      offer_code: campaign.offerCode,
      status: campaign.status,
      radius_miles: campaign.radiusMiles,
      start_date: campaign.startDate,
      end_date: campaign.endDate
    }).eq('id', campaign.id);
  },
  
  // 5. PUBLIC PLAYER
  async getPublicScreen(screenId: string): Promise<{ screen: Screen, slides: Slide[], menuItems: MenuItem[] } | null> {
      const { data: screenData } = await supabase.from('screens').select('*').eq('id', screenId).single();
      if (!screenData) return null;
      
      const screen = mapScreen(screenData);
      const slideIds = screen.algorithm === 'custom' && screen.customSequence ? screen.customSequence : screen.slides;
      
      const slides: Slide[] = [];
      for (const sid of slideIds) {
          const s = await this.getSlide(sid);
          if (s) slides.push(s);
      }
      
      const { data: loc } = await supabase.from('locations').select('org_id').eq('id', screen.locationId).single();
      
      let menuItems: MenuItem[] = [];
      if (loc) {
          const menu = await this.getMenu(loc.org_id);
          menuItems = menu.items;
      }
      
      return { screen, slides, menuItems };
  }
};
