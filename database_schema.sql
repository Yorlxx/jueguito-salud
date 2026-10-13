-- =====================================================================
-- STICK STORY · Esquema Supabase (ejecutar en SQL Editor)
-- Tablas: sessions (control global del admin) + players (grupos en vivo)
-- =====================================================================

-- ---------- 1. sessions: estado global controlado por el admin ----------
create table if not exists public.sessions (
  id int primary key, -- siempre usamos id = 1 ("la partida actual")
  status text not null default 'lobby', -- lobby | running | paused | finished
  current_round int not null default 1, -- 1..8, la impone el admin
  timer_seconds int not null default 8,
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- 2. players: un registro por grupo (celular) ----------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  group_name text not null unique, -- "Grupo 1" … "Grupo 4"
  lives int not null default 3,
  weight_kg numeric not null default 70.0,
  errors int not null default 0,
  current_round int not null default 1,
  total_time_s int not null default 0, -- desempate del leaderboard
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_sessions_touch on public.sessions;
create trigger trg_sessions_touch
  before update on public.sessions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_players_touch on public.players;
create trigger trg_players_touch
  before update on public.players
  for each row execute function public.touch_updated_at();

-- ---------- partida inicial ----------
insert into public.sessions (id, status, current_round)
values (1, 'lobby', 1)
on conflict (id) do nothing;

-- ---------- RLS (demo en aula: abierto a anon; endurecer en producción) ----------
alter table public.sessions enable row level security;
alter table public.players enable row level security;

drop policy if exists "demo abierta sessions" on public.sessions;
create policy "demo abierta sessions" on public.sessions
  for all using (true) with check (true);

drop policy if exists "demo abierta players" on public.players;
create policy "demo abierta players" on public.players
  for all using (true) with check (true);

-- ---------- Realtime: el proyector escucha cambios al instante ----------
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.players;
