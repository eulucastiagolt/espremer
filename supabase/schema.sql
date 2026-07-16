-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users used by NextAuth and Prisma
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  name text,
  password text not null,
  is_active boolean default true,
  role text default 'admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users add column if not exists email_verified timestamptz;
create table if not exists email_verification_tokens (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

-- Icon metadata. SVG files live in public/icons and are served by the CDN.
create table if not exists icon_families (
  id text primary key,
  name text not null,
  prefix text not null,
  license text not null,
  height integer not null default 24,
  category text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists icon_assets (
  id uuid default uuid_generate_v4() primary key,
  family_id text not null references icon_families(id) on delete cascade,
  name text not null,
  file_path text not null,
  hash text not null,
  categories text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (family_id, name)
);

-- Shared icons table
create table if not exists shared_icons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  svg text not null,
  is_public boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Community icons table (approved icons)
create table if not exists community_icons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  svg text not null,
  categories text[] default '{}',
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by text,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table community_icons add column if not exists file_path text;
alter table community_icons add column if not exists rejection_reason text;
alter table community_icons alter column svg drop not null;

-- Admin profiles table
create table if not exists admin_profiles (
  id uuid references auth.users(id) primary key,
  email text not null,
  full_name text,
  role text default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz default now()
);

-- Removal requests table
create table if not exists removal_requests (
  id uuid default uuid_generate_v4() primary key,
  share_id uuid references shared_icons(id) on delete set null,
  reason text not null,
  email text,
  status text default 'pending' check (status in ('pending', 'processed', 'rejected')),
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- Indexes
create index if not exists idx_shared_icons_public on shared_icons(is_public);
create index if not exists idx_shared_icons_expires on shared_icons(expires_at);
create index if not exists idx_community_icons_status on community_icons(status);
create index if not exists idx_removal_requests_status on removal_requests(status);

-- RLS policies
alter table shared_icons enable row level security;
alter table community_icons enable row level security;
alter table admin_profiles enable row level security;
alter table removal_requests enable row level security;

-- Shared icons policies
create policy "Public can view public icons" on shared_icons
  for select using (is_public = true);

create policy "Anyone can create icons" on shared_icons
  for insert with check (true);

create policy "Anyone can delete icons" on shared_icons
  for delete using (true);

-- Community icons policies
create policy "Public can view approved icons" on community_icons
  for select using (status = 'approved');

create policy "Anyone can submit icons" on community_icons
  for insert with check (true);

create policy "Admins can view all icons" on community_icons
  for select using (
    exists (select 1 from admin_profiles where id = auth.uid())
  );

create policy "Admins can update icons" on community_icons
  for update using (
    exists (select 1 from admin_profiles where id = auth.uid())
  );

create policy "Admins can delete icons" on community_icons
  for delete using (
    exists (select 1 from admin_profiles where id = auth.uid())
  );

-- Admin profiles policies
create policy "Admins can view profiles" on admin_profiles
  for select using (
    exists (select 1 from admin_profiles where id = auth.uid())
  );

create policy "Super admins can manage profiles" on admin_profiles
  for all using (
    exists (select 1 from admin_profiles where id = auth.uid() and role = 'super_admin')
  );

-- Removal requests policies
create policy "Anyone can create requests" on removal_requests
  for insert with check (true);

create policy "Admins can view all requests" on removal_requests
  for select using (
    exists (select 1 from admin_profiles where id = auth.uid())
  );

create policy "Admins can update requests" on removal_requests
  for update using (
    exists (select 1 from admin_profiles where id = auth.uid())
  );

-- Function to auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers
create trigger update_shared_icons_updated_at
  before update on shared_icons
  for each row
  execute function update_updated_at_column();

create trigger update_community_icons_updated_at
  before update on community_icons
  for each row
  execute function update_updated_at_column();
