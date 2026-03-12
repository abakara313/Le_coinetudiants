-- ================================================================
-- MIGRATION FRESH START — Le Coin des Étudiants
-- À exécuter dans : Supabase → SQL Editor
--
-- AVANT d'exécuter :
--   1. Allez dans Supabase → Authentication → Users
--      Supprimez tous les utilisateurs de test
--   2. Exécutez ce script complet
--   3. Décommentez la dernière ligne avec VOTRE email admin
-- ================================================================


-- ================================================================
-- ÉTAPE 1 : NETTOYAGE COMPLET
-- ================================================================

-- Suppression des triggers
drop trigger if exists on_auth_user_created        on auth.users;
drop trigger if exists update_profiles_updated_at  on profiles;
drop trigger if exists update_announcements_updated_at on announcements;

-- Suppression des fonctions
drop function if exists public.handle_new_user()           cascade;
drop function if exists public.update_updated_at_column()  cascade;
drop function if exists public.get_my_role()               cascade;

-- Suppression des tables (ordre important à cause des FK)
drop table if exists moderator_invitations cascade;
drop table if exists trust_events          cascade;
drop table if exists messages              cascade;
drop table if exists conversations         cascade;
drop table if exists favorites             cascade;
drop table if exists announcements         cascade;
drop table if exists profiles              cascade;


-- ================================================================
-- ÉTAPE 2 : EXTENSIONS
-- ================================================================
create extension if not exists "pgcrypto";


-- ================================================================
-- ÉTAPE 3 : TABLES
-- ================================================================

-- PROFILES
create table profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  email          text        not null,
  role           text        not null default 'student'
                               check (role in ('student','individual','moderator','admin')),
  phone          text,
  trust_level    integer     default 0,
  account_status text        not null default 'active'
                               check (account_status in ('active','suspended','pending')),
  student_declared boolean   default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ANNOUNCEMENTS
create table announcements (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  description     text        not null,
  type            text        not null
                                check (type in ('housing','roommate','job','service')),
  price           numeric,
  status          text        not null default 'pending_review'
                                check (status in ('draft','pending_review','approved','rejected','archived')),
  rejected_reason text,
  views           integer     default 0,
  owner_id        uuid        not null references profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_announcements_owner  on announcements(owner_id);
create index idx_announcements_status on announcements(status);

-- FAVORITES
create table favorites (
  user_id         uuid references profiles(id)      on delete cascade,
  announcement_id uuid references announcements(id) on delete cascade,
  created_at      timestamptz default now(),
  primary key (user_id, announcement_id)
);

-- CONVERSATIONS
create table conversations (
  id         uuid        primary key default gen_random_uuid(),
  user1      uuid        references profiles(id) on delete cascade,
  user2      uuid        references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- MESSAGES
create table messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        references conversations(id) on delete cascade,
  sender_id       uuid        references profiles(id)      on delete cascade,
  content         text        not null,
  created_at      timestamptz default now()
);

-- TRUST EVENTS
create table trust_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references profiles(id) on delete cascade,
  event_type text        not null,
  points     integer     not null,
  created_at timestamptz default now()
);

-- MODERATOR INVITATIONS
create table moderator_invitations (
  id         uuid        primary key default gen_random_uuid(),
  code       text        unique not null,
  email      text,
  created_by uuid        references profiles(id),
  expires_at timestamptz not null,
  used       boolean     default false,
  used_by    uuid        references profiles(id),
  created_at timestamptz default now()
);

create index idx_moderator_code on moderator_invitations(code);


-- ================================================================
-- ÉTAPE 4 : FONCTION CLÉ — get_my_role()
--
-- POURQUOI cette fonction est indispensable :
-- Sans elle, les politiques RLS sur announcements font :
--   SELECT FROM profiles WHERE id = auth.uid()
-- Ce SELECT déclenche RLS sur profiles → qui déclenche RLS
-- sur profiles → boucle infinie → erreur 403.
--
-- security definer = s'exécute avec les droits du propriétaire
-- (postgres), pas de l'appelant → contourne RLS → pas de récursion.
-- ================================================================
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;


-- ================================================================
-- ÉTAPE 5 : CRÉATION AUTOMATIQUE DU PROFIL À L'INSCRIPTION
-- ================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  text;
  v_phone text;
begin
  -- Lecture du rôle depuis les métadonnées envoyées au signUp
  v_role := coalesce(
    new.raw_user_meta_data->>'role',
    'student'
  );

  -- Sécurité : on ne peut pas s'auto-promouvoir admin/modérateur
  if v_role not in ('student', 'individual') then
    v_role := 'student';
  end if;

  v_phone := new.raw_user_meta_data->>'phone';

  -- ON CONFLICT : si le profil existe déjà (rare mais possible),
  -- on met à jour plutôt que d'échouer
  insert into public.profiles (id, email, role, phone)
  values (new.id, new.email, v_role, v_phone)
  on conflict (id) do update
    set role       = excluded.role,
        phone      = excluded.phone,
        updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ================================================================
-- ÉTAPE 6 : TRIGGER updated_at
-- ================================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
before update on profiles
for each row execute function public.update_updated_at_column();

create trigger update_announcements_updated_at
before update on announcements
for each row execute function public.update_updated_at_column();


-- ================================================================
-- ÉTAPE 7 : ACTIVATION RLS
-- ================================================================
alter table profiles             enable row level security;
alter table announcements        enable row level security;
alter table favorites            enable row level security;
alter table conversations        enable row level security;
alter table messages             enable row level security;
alter table trust_events         enable row level security;
alter table moderator_invitations enable row level security;


-- ================================================================
-- ÉTAPE 8 : POLITIQUES RLS
-- Toutes utilisent get_my_role() — ZÉRO récursion garantie
-- ================================================================

-- ── PROFILES ────────────────────────────────────────────────────

-- Tout utilisateur connecté peut lire tous les profils publics
create policy "profiles_select"
on profiles for select to authenticated
using (true);

-- Chacun modifie son profil ; admin/modérateur modifient tout
create policy "profiles_update_own"
on profiles for update to authenticated
using (
  auth.uid() = id
  or public.get_my_role() in ('moderator', 'admin')
)
with check (
  auth.uid() = id
  or public.get_my_role() in ('moderator', 'admin')
);

-- ── ANNOUNCEMENTS ───────────────────────────────────────────────

create policy "announcements_select"
on announcements for select to authenticated
using (
  status    = 'approved'
  or owner_id = auth.uid()
  or public.get_my_role() in ('moderator', 'admin')
);

create policy "announcements_insert"
on announcements for insert to authenticated
with check (auth.uid() = owner_id);

create policy "announcements_update"
on announcements for update to authenticated
using (
  owner_id = auth.uid()
  or public.get_my_role() in ('moderator', 'admin')
)
with check (true);

create policy "announcements_delete"
on announcements for delete to authenticated
using (
  owner_id = auth.uid()
  or public.get_my_role() in ('moderator', 'admin')
);

-- ── FAVORITES ───────────────────────────────────────────────────

create policy "favorites_select"
on favorites for select to authenticated
using (user_id = auth.uid());

create policy "favorites_insert"
on favorites for insert to authenticated
with check (user_id = auth.uid());

create policy "favorites_delete"
on favorites for delete to authenticated
using (user_id = auth.uid());

-- ── CONVERSATIONS ───────────────────────────────────────────────

create policy "conversations_select"
on conversations for select to authenticated
using (
  user1 = auth.uid()
  or user2 = auth.uid()
  or public.get_my_role() in ('moderator', 'admin')
);

create policy "conversations_insert"
on conversations for insert to authenticated
with check (
  user1 = auth.uid() or user2 = auth.uid()
);

-- ── MESSAGES ────────────────────────────────────────────────────

create policy "messages_select"
on messages for select to authenticated
using (
  sender_id = auth.uid()
  or exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.user1 = auth.uid() or c.user2 = auth.uid())
  )
  or public.get_my_role() in ('moderator', 'admin')
);

create policy "messages_insert"
on messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.user1 = auth.uid() or c.user2 = auth.uid())
  )
);

-- ── TRUST EVENTS ────────────────────────────────────────────────

create policy "trust_events_select"
on trust_events for select to authenticated
using (
  user_id = auth.uid()
  or public.get_my_role() in ('moderator', 'admin')
);

create policy "trust_events_insert"
on trust_events for insert to authenticated
with check (
  public.get_my_role() in ('moderator', 'admin')
);

-- ── MODERATOR INVITATIONS ───────────────────────────────────────

create policy "moderator_invitations_select"
on moderator_invitations for select to authenticated
using (
  public.get_my_role() in ('moderator', 'admin')
  or email = (select email from profiles where id = auth.uid())
);

create policy "moderator_invitations_insert"
on moderator_invitations for insert to authenticated
with check (
  public.get_my_role() = 'admin'
);

create policy "moderator_invitations_update"
on moderator_invitations for update to authenticated
using (
  public.get_my_role() in ('moderator', 'admin')
)
with check (true);


-- ================================================================
-- ÉTAPE 9 : PREMIER ADMIN
-- Décommentez et remplacez par VOTRE email, puis exécutez.
-- C'est la SEULE fois où vous intervenez manuellement.
-- Ensuite, tout se gère depuis l'AdminPanel de l'application.
-- ================================================================
-- update profiles set role = 'admin' where email = 'votre-email@example.com';
