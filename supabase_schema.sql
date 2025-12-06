-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ORGANIZATIONS
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  plan text check (plan in ('Free', 'Growth', 'Enterprise')) default 'Free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LOCATIONS
create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SCREENS
create table public.screens (
  id uuid default uuid_generate_v4() primary key,
  location_id uuid references public.locations(id) on delete cascade not null,
  name text not null,
  rotation_ms integer default 10000,
  transition text check (transition in ('fade', 'slide', 'none')) default 'none',
  algorithm text check (algorithm in ('loop', 'random', 'custom')) default 'loop',
  custom_sequence jsonb default '[]'::jsonb, -- Array of slide IDs
  slides jsonb default '[]'::jsonb, -- Array of slide IDs in order
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SLIDES
create table public.slides (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  background text default '#111827',
  width integer default 1920,
  height integer default 1080,
  duration integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SLIDE ELEMENTS (Tiles)
create table public.slide_elements (
  id uuid default uuid_generate_v4() primary key,
  slide_id uuid references public.slides(id) on delete cascade not null,
  type text not null,
  x integer default 0,
  y integer default 0,
  width integer default 200,
  height integer default 150,
  z_index integer default 1,
  opacity numeric default 1.0,
  props jsonb default '{}'::jsonb,
  binding jsonb default '{"source": "none"}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. MENU SECTIONS
create table public.menu_sections (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. MENU ITEMS
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  section_id uuid references public.menu_sections(id) on delete cascade not null,
  name text not null,
  description text,
  price text,
  image_url text,
  calories text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. CAMPAIGNS
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  offer_code text,
  status text check (status in ('Active', 'Scheduled', 'Ended')) default 'Scheduled',
  radius_miles numeric default 3.0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TEMPLATES
create table public.tile_templates (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade, -- Nullable for global templates
  type text not null,
  name text not null,
  tags text[] default '{}',
  default_props jsonb default '{}'::jsonb,
  default_dimensions jsonb default '{"w": 200, "h": 150}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) would go here
-- For now, we will allow public access for demonstration, but in production you MUST enable RLS.
alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.screens enable row level security;
alter table public.slides enable row level security;
alter table public.slide_elements enable row level security;
alter table public.menu_sections enable row level security;
alter table public.menu_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.tile_templates enable row level security;

-- Create simple policies for development (ALLOW ALL)
-- WARNING: REPLACE THESE BEFORE PRODUCTION
create policy "Allow all access" on public.organizations for all using (true);
create policy "Allow all access" on public.locations for all using (true);
create policy "Allow all access" on public.screens for all using (true);
create policy "Allow all access" on public.slides for all using (true);
create policy "Allow all access" on public.slide_elements for all using (true);
create policy "Allow all access" on public.menu_sections for all using (true);
create policy "Allow all access" on public.menu_items for all using (true);
create policy "Allow all access" on public.campaigns for all using (true);
create policy "Allow all access" on public.tile_templates for all using (true);

-- Insert Seed Data
WITH new_org AS (
  INSERT INTO public.organizations (name, plan) VALUES ('Demo Restaurant Group', 'Growth') RETURNING id
),
new_loc AS (
  INSERT INTO public.locations (org_id, name) SELECT id, 'Downtown Branch' FROM new_org RETURNING id, org_id
),
new_slide AS (
  INSERT INTO public.slides (org_id, name, background) SELECT id, 'Morning Menu', '#111827' FROM new_org RETURNING id
),
new_screen AS (
  INSERT INTO public.screens (location_id, name, slides) 
  SELECT new_loc.id, 'Main Menu Board', jsonb_build_array((SELECT id FROM new_slide)::text) 
  FROM new_loc RETURNING id
),
new_section AS (
  INSERT INTO public.menu_sections (org_id, name, sort_order) 
  SELECT id, 'Breakfast', 0 FROM new_org RETURNING id
)
INSERT INTO public.menu_items (section_id, name, description, price, image_url)
SELECT id, 'Avocado Toast', 'Sourdough, smashed avocado, chili flakes.', '8.50', 'https://placehold.co/100x100?text=Toast' FROM new_section;
