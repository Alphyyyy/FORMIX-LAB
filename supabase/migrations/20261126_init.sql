-- FORMIX LAB · Supabase schema
-- Ejecutar una vez en Supabase → SQL Editor.
-- No contiene datos personales ni sesiones de ejemplo.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_items (
  id text primary key,
  type text not null check (type in ('shape', 'color', 'scent')),
  name text not null,
  notes text not null default '',
  status text not null default 'available' check (status in ('available', 'proposed', 'inactive')),
  sort_order integer not null default 0,
  swatch text,
  swatch_dark text,
  created_at timestamptz not null default now()
);

create index if not exists catalog_items_type_idx
  on public.catalog_items (type, sort_order);

-- ---------------------------------------------------------------------------
-- Equipo
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('operator', 'admin')),
  display_name text not null default 'Equipo FORMIX',
  initials text not null default 'EQ',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sesiones
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text unique,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  state text not null default 'started' check (state in ('started', 'completed')),
  consent_version text not null,
  foam_done boolean not null default false,
  shape_id text references public.catalog_items(id),
  color_id text references public.catalog_items(id),
  scent_id text references public.catalog_items(id),
  purchase_intent boolean not null default false,
  gift_intent boolean not null default false,
  games jsonb not null default '{}'::jsonb,
  reward jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_code_idx on public.sessions (code) where code is not null;
create index if not exists sessions_completed_at_idx on public.sessions (completed_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_touch_updated_at on public.sessions;
create trigger sessions_touch_updated_at
before update on public.sessions
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers de rol
-- ---------------------------------------------------------------------------
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.staff where user_id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_staff_role() in ('operator', 'admin'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_staff_role() = 'admin', false);
$$;

create or replace function public.current_staff_initials()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select initials from public.staff where user_id = auth.uid();
$$;

create or replace function public.get_my_staff()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'role', role,
    'displayName', display_name,
    'initials', initials
  )
  from public.staff
  where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Reglas de premio y códigos
-- ---------------------------------------------------------------------------
create or replace function public.reward_rank(p_type text)
returns integer
language sql
immutable
as $$
  select case p_type
    when 'greeting' then 1
    when 'photo' then 2
    when 'photo_dance' then 3
    else 0
  end;
$$;

create or replace function public.generate_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
  j integer;
begin
  for i in 1..100 loop
    candidate := 'FX-';
    for j in 1..6 loop
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;
    if not exists (select 1 from public.sessions where code = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'No se pudo generar un código único';
end;
$$;

-- ---------------------------------------------------------------------------
-- API de visitante
-- ---------------------------------------------------------------------------
create or replace function public.start_session(
  p_id uuid,
  p_consent_version text,
  p_started_at timestamptz default now()
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.sessions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.sessions (id, user_id, started_at, consent_version)
  values (p_id, auth.uid(), coalesce(p_started_at, now()), p_consent_version)
  on conflict (id) do update
    set consent_version = excluded.consent_version
    where public.sessions.user_id = auth.uid()
      and public.sessions.state = 'started'
  returning * into result;

  if result.id is null then
    raise exception 'session_conflict';
  end if;
  return result;
end;
$$;

create or replace function public.save_session(
  p_id uuid,
  p_foam_done boolean,
  p_shape_id text,
  p_color_id text,
  p_scent_id text,
  p_purchase_intent boolean,
  p_gift_intent boolean
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.sessions;
begin
  if p_shape_id is not null and not exists (
    select 1 from public.catalog_items
    where id = p_shape_id and type = 'shape' and status <> 'inactive'
  ) then
    raise exception 'invalid_shape';
  end if;

  if p_color_id is not null and not exists (
    select 1 from public.catalog_items
    where id = p_color_id and type = 'color' and status <> 'inactive'
  ) then
    raise exception 'invalid_color';
  end if;

  if p_scent_id is not null and not exists (
    select 1 from public.catalog_items
    where id = p_scent_id and type = 'scent' and status <> 'inactive'
  ) then
    raise exception 'invalid_scent';
  end if;

  update public.sessions
  set foam_done = p_foam_done,
      shape_id = p_shape_id,
      color_id = p_color_id,
      scent_id = p_scent_id,
      purchase_intent = p_purchase_intent,
      gift_intent = p_gift_intent
  where id = p_id
    and user_id = auth.uid()
    and state = 'started'
  returning * into result;

  if result.id is null then
    raise exception 'session_not_editable';
  end if;
  return result;
end;
$$;

create or replace function public.complete_session(
  p_id uuid,
  p_consent_version text,
  p_started_at timestamptz,
  p_foam_done boolean,
  p_shape_id text,
  p_color_id text,
  p_scent_id text,
  p_purchase_intent boolean,
  p_gift_intent boolean
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.sessions;
  generated_code text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into result
  from public.sessions
  where id = p_id
  for update;

  if not found then
    insert into public.sessions (id, user_id, consent_version, started_at)
    values (p_id, auth.uid(), p_consent_version, coalesce(p_started_at, now()))
    returning * into result;
  end if;

  if result.user_id <> auth.uid() then
    raise exception 'not_owner';
  end if;

  if result.state = 'completed' and result.code is not null then
    return result;
  end if;

  if p_shape_id is null or p_color_id is null or p_scent_id is null then
    raise exception 'incomplete_session';
  end if;

  if not exists (
    select 1 from public.catalog_items
    where id = p_shape_id and type = 'shape' and status <> 'inactive'
  ) then
    raise exception 'invalid_shape';
  end if;

  if not exists (
    select 1 from public.catalog_items
    where id = p_color_id and type = 'color' and status <> 'inactive'
  ) then
    raise exception 'invalid_color';
  end if;

  if not exists (
    select 1 from public.catalog_items
    where id = p_scent_id and type = 'scent' and status <> 'inactive'
  ) then
    raise exception 'invalid_scent';
  end if;

  generated_code := public.generate_code();

  update public.sessions
  set state = 'completed',
      completed_at = now(),
      code = generated_code,
      foam_done = p_foam_done,
      shape_id = p_shape_id,
      color_id = p_color_id,
      scent_id = p_scent_id,
      purchase_intent = p_purchase_intent,
      gift_intent = p_gift_intent
  where id = p_id
  returning * into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- API del operador
-- ---------------------------------------------------------------------------
create or replace function public.validate_game(
  p_code text,
  p_game_type text,
  p_result text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.sessions;
  new_games jsonb;
  wins integer;
  new_type text;
  new_reward jsonb;
  old_type text;
  reward_locked boolean := false;
  staff_initials text;
begin
  if not public.is_staff() then
    raise exception 'not_staff';
  end if;

  if p_game_type not in ('bacteria', 'aroma') then
    raise exception 'invalid_game';
  end if;

  if p_result not in ('WIN', 'LOSE') then
    raise exception 'invalid_result';
  end if;

  staff_initials := coalesce(public.current_staff_initials(), 'EQ');

  select * into session_row
  from public.sessions
  where code = p_code
  for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  if session_row.state <> 'completed' then
    raise exception 'session_not_completed';
  end if;

  if session_row.games ? p_game_type then
    raise exception 'already_validated';
  end if;

  new_games := session_row.games || jsonb_build_object(
    p_game_type,
    jsonb_build_object(
      'gameType', p_game_type,
      'result', p_result,
      'validatedAt', now(),
      'operatorInitials', staff_initials
    )
  );

  select count(*) into wins
  from jsonb_each(new_games) as game
  where game.value->>'result' = 'WIN';

  if wins >= 2 then
    new_type := 'photo_dance';
  elsif wins = 1 then
    new_type := 'photo';
  else
    new_type := 'greeting';
  end if;

  new_reward := session_row.reward;

  if new_reward is null then
    new_reward := jsonb_build_object(
      'type', new_type,
      'issuedAt', now(),
      'redeemedAt', null,
      'redeemedBy', null
    );
  elsif new_reward->>'redeemedAt' is not null then
    if public.reward_rank(new_type) > public.reward_rank(new_reward->>'type') then
      reward_locked := true;
    end if;
  else
    old_type := new_reward->>'type';
    if public.reward_rank(new_type) > public.reward_rank(old_type) then
      new_reward := jsonb_set(new_reward, '{type}', to_jsonb(new_type), true);
    end if;
  end if;

  update public.sessions
  set games = new_games,
      reward = new_reward
  where id = session_row.id
  returning * into session_row;

  return jsonb_build_object(
    'session', to_jsonb(session_row),
    'rewardLocked', reward_locked
  );
end;
$$;

create or replace function public.redeem_reward(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.sessions;
  new_reward jsonb;
begin
  if not public.is_staff() then
    raise exception 'not_staff';
  end if;

  select * into session_row
  from public.sessions
  where code = p_code
  for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  if session_row.reward is null then
    raise exception 'no_reward';
  end if;

  if session_row.reward->>'redeemedAt' is not null then
    return jsonb_build_object(
      'session', to_jsonb(session_row),
      'alreadyRedeemed', true
    );
  end if;

  new_reward := jsonb_set(session_row.reward, '{redeemedAt}', to_jsonb(now()), true);
  new_reward := jsonb_set(
    new_reward,
    '{redeemedBy}',
    to_jsonb(coalesce(public.current_staff_initials(), 'EQ')),
    true
  );

  update public.sessions
  set reward = new_reward
  where id = session_row.id
  returning * into session_row;

  return jsonb_build_object(
    'session', to_jsonb(session_row),
    'alreadyRedeemed', false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.catalog_items enable row level security;
alter table public.staff enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "catalog read" on public.catalog_items;
create policy "catalog read"
on public.catalog_items
for select
to authenticated
using (status <> 'inactive' or public.is_staff());

drop policy if exists "catalog admin write" on public.catalog_items;
create policy "catalog admin write"
on public.catalog_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "sessions owner read" on public.sessions;
create policy "sessions owner read"
on public.sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "sessions staff read" on public.sessions;
create policy "sessions staff read"
on public.sessions
for select
to authenticated
using (public.is_staff());

-- staff no tiene políticas directas: solo se consulta desde funciones
-- security definer y desde el SQL Editor.

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.catalog_items to authenticated;
grant insert, update, delete on public.catalog_items to authenticated;
grant select on public.sessions to authenticated;

revoke all on function public.touch_updated_at() from public;
revoke all on function public.current_staff_role() from public;
revoke all on function public.current_staff_initials() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.get_my_staff() from public;
revoke all on function public.reward_rank(text) from public;
revoke all on function public.generate_code() from public;
revoke all on function public.start_session(uuid, text, timestamptz) from public;
revoke all on function public.save_session(uuid, boolean, text, text, text, boolean, boolean) from public;
revoke all on function public.complete_session(uuid, text, timestamptz, boolean, text, text, text, boolean, boolean) from public;
revoke all on function public.validate_game(text, text, text) from public;
revoke all on function public.redeem_reward(text) from public;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_my_staff() to authenticated;
grant execute on function public.start_session(uuid, text, timestamptz) to authenticated;
grant execute on function public.save_session(uuid, boolean, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.complete_session(uuid, text, timestamptz, boolean, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.validate_game(text, text, text) to authenticated;
grant execute on function public.redeem_reward(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Asignación de equipo (ejecutar después de crear los usuarios en Auth)
-- ---------------------------------------------------------------------------
create or replace function public.assign_staff(
  p_email text,
  p_role text,
  p_display_name text,
  p_initials text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('operator', 'admin') then
    raise exception 'invalid_role';
  end if;

  insert into public.staff (user_id, role, display_name, initials)
  select id, p_role, p_display_name, p_initials
  from auth.users
  where email = p_email
  on conflict (user_id) do update
    set role = excluded.role,
        display_name = excluded.display_name,
        initials = excluded.initials;

  if not found then
    raise exception 'user_not_found: %', p_email;
  end if;
end;
$$;

revoke all on function public.assign_staff(text, text, text, text) from public;

-- ---------------------------------------------------------------------------
-- Catálogo inicial
-- ---------------------------------------------------------------------------
insert into public.catalog_items (id, type, name, notes, status, sort_order, swatch, swatch_dark)
values
  ('shape-patita', 'shape', 'Patita', 'Una huella suave, redonda y cercana.', 'available', 1, null, null),
  ('shape-corazon', 'shape', 'Corazón', 'Clásico, generoso y fácil de reconocer.', 'available', 2, null, null),
  ('shape-esfera', 'shape', 'Esfera', 'Pulido, minimalista y perfecto para la palma.', 'available', 3, null, null),
  ('shape-rosa', 'shape', 'Rosa', 'Pétalos en capas para un acabado de autor.', 'proposed', 4, null, null),
  ('shape-osito', 'shape', 'Osito', 'Tierno y compacto, con orejas redondeadas.', 'proposed', 5, null, null),
  ('shape-estrella', 'shape', 'Estrella', 'Un guiño de feria, con puntas suaves.', 'proposed', 6, null, null),
  ('shape-luna', 'shape', 'Luna', 'Media luna serena, ideal para un ritual nocturno.', 'proposed', 7, null, null),
  ('shape-concha', 'shape', 'Concha', 'Estrías orgánicas inspiradas en el mar.', 'proposed', 8, null, null),
  ('color-rosa', 'color', 'Rosa', 'El rosa de la casa.', 'available', 1, '#E890A8', '#C96B85'),
  ('color-malva', 'color', 'Malva', 'Un violeta polvoriento y cálido.', 'available', 2, '#B792D6', '#8F6BB0'),
  ('color-azul', 'color', 'Azul', 'Azul cielo, limpio y sereno.', 'available', 3, '#8FB8D9', '#5F8FB5'),
  ('color-verde', 'color', 'Verde', 'Verde salvia, herbal y tranquilo.', 'proposed', 4, '#9DC3A6', '#6E9A7A'),
  ('color-naranja', 'color', 'Naranja', 'Naranja melocotón, luminoso y cálido.', 'proposed', 5, '#F0B07A', '#C9844E'),
  ('color-marfil', 'color', 'Marfil', 'Un neutro cremoso que deja respirar la forma.', 'proposed', 6, '#F3E9DA', '#D6C4A8'),
  ('scent-fresa', 'scent', 'Fresa', 'Frutal · dulce', 'available', 1, null, null),
  ('scent-chocolate', 'scent', 'Chocolate', 'Gourmand · cálido', 'available', 2, null, null),
  ('scent-vainilla', 'scent', 'Vainilla', 'Dulce · cremoso', 'available', 3, null, null),
  ('scent-coco', 'scent', 'Coco', 'Tropical · suave', 'proposed', 4, null, null),
  ('scent-lavanda', 'scent', 'Lavanda', 'Floral · herbal', 'proposed', 5, null, null),
  ('scent-naranja', 'scent', 'Naranja', 'Cítrico · luminoso', 'proposed', 6, null, null)
on conflict (id) do update
  set type = excluded.type,
      name = excluded.name,
      notes = excluded.notes,
      status = excluded.status,
      sort_order = excluded.sort_order,
      swatch = excluded.swatch,
      swatch_dark = excluded.swatch_dark;
