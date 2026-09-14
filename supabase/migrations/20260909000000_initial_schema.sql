-- Splitly Database Schema
-- Tables first, then RLS policies (to avoid forward references)

-- Clean up from partial runs (cascade drops dependent triggers)
drop table if exists public.payment_methods cascade;
drop table if exists public.settlements cascade;
drop table if exists public.expense_splits cascade;
drop table if exists public.expenses cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_updated_at() cascade;

-- ============================================================
-- 1. CREATE ALL TABLES
-- ============================================================

create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text not null,
  username    text unique,
  phone       text,
  avatar_url  text,
  currency    text not null default 'INR',
  push_token  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text not null default 'office',
  type        text not null default 'Other',
  image_url   text,
  created_by  uuid references public.profiles(id) not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid references public.groups(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references public.groups(id) on delete cascade not null,
  title         text not null,
  amount        numeric(12, 2) not null check (amount > 0),
  currency      text not null default 'INR',
  category      text not null default 'other',
  paid_by       uuid references public.profiles(id) not null,
  split_method  text not null default 'equal' check (split_method in ('equal', 'amount', 'percentage')),
  date          date not null default current_date,
  notes         text,
  receipt_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.expense_splits (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid references public.expenses(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) not null,
  amount      numeric(12, 2) not null,
  percentage  numeric(5, 2),
  is_settled  boolean not null default false
);

create table public.settlements (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.groups(id) on delete cascade not null,
  from_user   uuid references public.profiles(id) not null,
  to_user     uuid references public.profiles(id) not null,
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null default 'INR',
  method      text not null default 'upi',
  status      text not null default 'pending' check (status in ('pending', 'confirmed')),
  note        text,
  created_at  timestamptz not null default now()
);

create table public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null check (type in ('upi', 'bank')),
  label       text not null,
  detail      text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.payment_methods enable row level security;

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

-- profiles
create policy "Users can view any profile"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- groups
create policy "Group members can view group"
  on public.groups for select using (
    exists (select 1 from public.group_members where group_members.group_id = groups.id and group_members.user_id = auth.uid())
  );
create policy "Authenticated users can create groups"
  on public.groups for insert with check (auth.uid() = created_by);
create policy "Group admins can update group"
  on public.groups for update using (
    exists (select 1 from public.group_members where group_members.group_id = groups.id and group_members.user_id = auth.uid() and group_members.role = 'admin')
  );

-- group_members
create policy "Group members can view membership"
  on public.group_members for select using (
    exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
  );
create policy "Group admins can manage members"
  on public.group_members for all using (
    exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'admin')
  );

-- expenses
create policy "Group members can view expenses"
  on public.expenses for select using (
    exists (select 1 from public.group_members where group_members.group_id = expenses.group_id and group_members.user_id = auth.uid())
  );
create policy "Group members can create expenses"
  on public.expenses for insert with check (
    exists (select 1 from public.group_members where group_members.group_id = expenses.group_id and group_members.user_id = auth.uid())
  );
create policy "Expense creator can update"
  on public.expenses for update using (auth.uid() = paid_by);
create policy "Expense creator can delete"
  on public.expenses for delete using (auth.uid() = paid_by);

-- expense_splits
create policy "Viewable by group members"
  on public.expense_splits for select using (
    exists (select 1 from public.expenses e join public.group_members gm on gm.group_id = e.group_id where e.id = expense_splits.expense_id and gm.user_id = auth.uid())
  );
create policy "Insertable by group members"
  on public.expense_splits for insert with check (
    exists (select 1 from public.expenses e join public.group_members gm on gm.group_id = e.group_id where e.id = expense_splits.expense_id and gm.user_id = auth.uid())
  );

-- settlements
create policy "Viewable by involved users"
  on public.settlements for select using (auth.uid() in (from_user, to_user));
create policy "From user can create settlement"
  on public.settlements for insert with check (auth.uid() = from_user);
create policy "Involved users can update settlement"
  on public.settlements for update using (auth.uid() in (from_user, to_user));

-- payment_methods
create policy "Users can manage own payment methods"
  on public.payment_methods for all using (auth.uid() = user_id);

-- ============================================================
-- 4. INDEXES
-- ============================================================

create index idx_group_members_user on public.group_members(user_id);
create index idx_expenses_group on public.expenses(group_id);
create index idx_expenses_paid_by on public.expenses(paid_by);
create index idx_expense_splits_expense on public.expense_splits(expense_id);
create index idx_expense_splits_user on public.expense_splits(user_id);
create index idx_settlements_group on public.settlements(group_id);
create index idx_settlements_users on public.settlements(from_user, to_user);
create index idx_payment_methods_user on public.payment_methods(user_id);

-- ============================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger groups_updated_at
  before update on public.groups
  for each row execute procedure public.update_updated_at();

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.update_updated_at();
