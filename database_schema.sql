-- =====================================================================
-- STICK STORY · Esquema Supabase v2 — plataforma de salas (ejecutar en SQL Editor)
-- Salas independientes por PIN + jugadores con nombre libre + realtime.
-- AVISO: RECONSTRUYE las tablas v1 (los datos demo anteriores son incompatibles
-- con el modelo de salas). No usar en producción con datos reales.
-- =====================================================================

drop table if exists public.players;
drop table if exists public.sessions;

-- ---------- 1. sessions: una fila por sala (PIN único) ----------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique, -- PIN de 6 dígitos, ej. "839201"
  status text not null default 'LOBBY', -- LOBBY | RUNNING | PAUSED | FINISHED
  paused boolean not null default false, -- pausa impuesta por el docente
  current_round int not null default 1, -- 1..8, la impone el admin
  timer_seconds int not null default 15,
  match_no bigint not null default 1, -- época de la partida: cada Iniciar la cambia y reinicia a todos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migración para BD ya creadas (no borra nada, se puede correr siempre):
alter table public.sessions add column if not exists match_no bigint not null default 1;
alter table public.players add column if not exists points int not null default 0;

-- ---------- 2. players: grupos o alumnos libres dentro de una sala ----------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_name text not null, -- nombre libre: "Los Cracks", "Ana Pérez"…
  points int not null default 0, -- puntaje Kahoot: 500 base + 500 por velocidad
  errors int not null default 0,
  weight_kg numeric not null default 70.0, -- numeric (el peso usa decimales)
  current_round int not null default 1,
  total_time_s float not null default 0, -- desempate del leaderboard
  status text not null default 'ACTIVE', -- ACTIVE | FINISHED | ELIMINATED
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, player_name) -- sin duplicados dentro de la sala
);

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_sessions_touch
  before update on public.sessions
  for each row execute function public.touch_updated_at();

create trigger trg_players_touch
  before update on public.players
  for each row execute function public.touch_updated_at();

-- ---------- RLS (demo en aula: abierto a anon; endurecer en producción) ----------
alter table public.sessions enable row level security;
alter table public.players enable row level security;

drop policy if exists "demo abierta sessions" on public.sessions;
create policy "demo abierta sessions" on public.sessions
  for all using (true) with check (true);

drop policy if exists "demo abierta players" on public.players;
create policy "demo abierta players" on public.players
  for all using (true) with check (true);

-- ---------- Realtime: proyector y celulares escuchan al instante ----------
do $$ begin
  alter publication supabase_realtime add table public.sessions;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null; end $$;
