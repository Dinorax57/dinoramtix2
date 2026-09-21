-- DinoRamtix 2 production foundation
create extension if not exists pgcrypto;

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default 'DinoUser',
  bio text default '',
  avatar_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.posts(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  kind text not null default 'post' check(kind in ('post','clip','video')),
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.follows(
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id,following_id),
  check(follower_id<>following_id)
);

create table if not exists public.likes(
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,post_id)
);

create table if not exists public.comments(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations(
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members(
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key(conversation_id,user_id)
);

create table if not exists public.messages(
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.stories(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_url text,
  caption text default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '24 hours')
);

create table if not exists public.notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports(
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare uname text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', 'dino_'||substr(new.id::text,1,8));
  insert into public.profiles(id,username,display_name)
  values(new.id, uname, coalesce(new.raw_user_meta_data->>'display_name','DinoUser'))
  on conflict(id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.stories enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy "profiles public read" on public.profiles for select using(true);
create policy "profiles own update" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
create policy "posts public read" on public.posts for select using(true);
create policy "posts own insert" on public.posts for insert with check(auth.uid()=author_id);
create policy "posts own update" on public.posts for update using(auth.uid()=author_id);
create policy "posts own delete" on public.posts for delete using(auth.uid()=author_id);
create policy "follows read" on public.follows for select using(true);
create policy "follows own" on public.follows for insert with check(auth.uid()=follower_id);
create policy "follows remove" on public.follows for delete using(auth.uid()=follower_id);
create policy "likes read" on public.likes for select using(true);
create policy "likes own" on public.likes for insert with check(auth.uid()=user_id);
create policy "likes remove" on public.likes for delete using(auth.uid()=user_id);
create policy "comments read" on public.comments for select using(true);
create policy "comments own" on public.comments for insert with check(auth.uid()=author_id);
create policy "comments delete" on public.comments for delete using(auth.uid()=author_id);
create policy "conversation member read" on public.conversation_members for select using(auth.uid()=user_id);
create policy "conversation member insert" on public.conversation_members for insert with check(auth.uid()=user_id);
create policy "messages member read" on public.messages for select using(exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
create policy "messages own insert" on public.messages for insert with check(auth.uid()=sender_id and exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
create policy "stories public read" on public.stories for select using(expires_at>now());
create policy "stories own insert" on public.stories for insert with check(auth.uid()=author_id);
create policy "stories own delete" on public.stories for delete using(auth.uid()=author_id);
create policy "notifications own" on public.notifications for select using(auth.uid()=user_id);
create policy "reports own insert" on public.reports for insert with check(auth.uid()=reporter_id);

-- Realtime for messages. If the table is already in the publication, ignore the notice.
alter publication supabase_realtime add table public.messages;
