-- Additive migration: leaves the original prototype tables and any data untouched.
-- Shared groups are revisioned documents, with server-side invariants and private ACLs.
create table public.ledger_groups (
  id uuid primary key,
  owner uuid not null references auth.users(id),
  revision integer not null default 1 check (revision > 0),
  document jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.ledger_access (
  group_id uuid not null references public.ledger_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (group_id,user_id)
);
create table public.ledger_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null check (jsonb_typeof(preferences) = 'object' and octet_length(preferences::text) < 1000000)
);
create table public.ledger_history (
  group_id uuid not null references public.ledger_groups(id) on delete cascade,
  revision integer not null,
  actor uuid not null references auth.users(id),
  document jsonb not null,
  at timestamptz not null default now(),
  primary key (group_id,revision)
);
create table public.ledger_invites (
  token uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.ledger_groups(id) on delete cascade,
  member_id text not null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id),
  unique (group_id,member_id)
);
alter table public.ledger_groups enable row level security;
alter table public.ledger_access enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_history enable row level security;
alter table public.ledger_invites enable row level security;
create policy ledger_access_self on public.ledger_access for select to authenticated using (user_id=auth.uid());
create policy ledger_groups_read on public.ledger_groups for select to authenticated using (exists(select 1 from public.ledger_access a where a.group_id=id and a.user_id=auth.uid()));
create policy ledger_history_read on public.ledger_history for select to authenticated using (exists(select 1 from public.ledger_access a where a.group_id=ledger_history.group_id and a.user_id=auth.uid()));
create policy ledger_account_self on public.ledger_accounts for all to authenticated using (user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.ledger_groups, public.ledger_access, public.ledger_history, public.ledger_invites, public.ledger_accounts from anon, authenticated;
grant select on public.ledger_groups, public.ledger_access, public.ledger_history to authenticated;
grant select, insert, update on public.ledger_accounts to authenticated;

-- Positive means p_from owes p_to; no third-party or cross-group simplification.
create function public.ledger_pair_amount(p_doc jsonb, p_from text, p_to text) returns numeric
language sql immutable set search_path = '' as $$
  select coalesce((select sum(case when e->>'paidBy'=p_to and s->>'memberId'=p_from then (s->>'amount')::numeric when e->>'paidBy'=p_from and s->>'memberId'=p_to then -(s->>'amount')::numeric else 0 end)
    from jsonb_array_elements(p_doc->'expenses') e cross join lateral jsonb_array_elements(e->'splits') s where not coalesce((e->>'deleted')::boolean,false)),0)
  - coalesce((select sum(case when p->>'from'=p_from and p->>'to'=p_to then (p->>'amount')::numeric when p->>'from'=p_to and p->>'to'=p_from then -(p->>'amount')::numeric else 0 end)
    from jsonb_array_elements(p_doc->'payments') p where not coalesce((p->>'reversed')::boolean,false)),0);
$$;

create function public.validate_ledger_document(d jsonb) returns void
language plpgsql set search_path = '' as $$
declare e jsonb; s jsonb; p jsonb; m jsonb; history_event jsonb; n numeric;
begin
  if jsonb_typeof(d) is distinct from 'object' or jsonb_typeof(d->'name') is distinct from 'string' or jsonb_typeof(d->'currency') is distinct from 'string' or octet_length(d::text)>10000000 or length(trim(d->>'name')) not between 1 and 80
    or d->>'currency' not in ('INR','USD','EUR','GBP','AED','SGD','AUD','CAD','JPY','THB')
    or jsonb_typeof(d->'members') is distinct from 'array' or jsonb_typeof(d->'expenses') is distinct from 'array'
    or jsonb_typeof(d->'payments') is distinct from 'array' or jsonb_typeof(d->'events') is distinct from 'array'
    or jsonb_typeof(d->'archived') is distinct from 'boolean' or d->>'id' is null or d->>'owner' is null then
    raise exception 'Invalid group data';
  end if;
  if d->>'name' is null or d->>'currency' is null or jsonb_array_length(d->'members') not between 1 and 100 then raise exception 'Invalid group details'; end if;
  if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(d->'members') x)
    or (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(d->'expenses') x)
    or (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(d->'payments') x)
    or (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(d->'events') x) then raise exception 'Duplicate or missing IDs'; end if;
  for m in select * from jsonb_array_elements(d->'members') loop
    if jsonb_typeof(m->'name') is distinct from 'string' or jsonb_typeof(m->'id') is distinct from 'string' or (m ? 'userId' and jsonb_typeof(m->'userId') <> 'string') or length(trim(m->>'name')) not between 1 and 60 or m->>'id' is null then raise exception 'Invalid member';end if;
  end loop;
  for e in select * from jsonb_array_elements(d->'expenses') loop
    if jsonb_typeof(e->'splits') is distinct from 'array' then raise exception 'Invalid shares';end if;
    if jsonb_typeof(e->'amount') is distinct from 'number' or e->>'title' is null or length(trim(e->>'title')) not between 1 and 120
      or e->>'method' not in ('equal','amount','percentage') or e->>'method' is null
      or not exists(select 1 from jsonb_array_elements(d->'members') member_row where member_row->>'id'=e->>'paidBy') then raise exception 'Invalid expense';end if;
    if jsonb_typeof(e->'id') is distinct from 'string' or jsonb_typeof(e->'title') is distinct from 'string' or jsonb_typeof(e->'note') is distinct from 'string'
      or (e ? 'deleted' and jsonb_typeof(e->'deleted') <> 'boolean') or (e ? 'receipt' and jsonb_typeof(e->'receipt') <> 'string')
      or e->>'createdAt' is null or e->>'updatedAt' is null then raise exception 'Invalid expense fields';end if;
    perform (e->>'createdAt')::timestamptz; perform (e->>'updatedAt')::timestamptz;
    n:=(e->>'amount')::numeric;
    if n<=0 or n>99999999999 or n<>trunc(n) or jsonb_array_length(e->'splits')=0 then raise exception 'Invalid amount';end if;
    if e->>'date' is null or (e->>'date') !~ '^\d{4}-\d{2}-\d{2}$' or (e->>'date')::date>current_date+1 then raise exception 'Invalid date';end if;
    if (select count(*)<>count(distinct x->>'memberId') from jsonb_array_elements(e->'splits') x) then raise exception 'Duplicate shares';end if;
    for s in select * from jsonb_array_elements(e->'splits') loop
      if jsonb_typeof(s->'amount') is distinct from 'number' or (s->>'amount')::numeric<0 or (s->>'amount')::numeric<>trunc((s->>'amount')::numeric)
        or not exists(select 1 from jsonb_array_elements(d->'members') member_row where member_row->>'id'=s->>'memberId') then raise exception 'Invalid share';end if;
    end loop;
    if (select sum((x->>'amount')::numeric) from jsonb_array_elements(e->'splits') x)<>n then raise exception 'Shares must add up to the expense';end if;
    if length(coalesce(e->>'receipt',''))>900050 then raise exception 'Receipt too large';end if;
  end loop;
  for p in select * from jsonb_array_elements(d->'payments') loop
    if jsonb_typeof(p->'amount') is distinct from 'number' then raise exception 'Invalid payment';end if;
    if jsonb_typeof(p->'id') is distinct from 'string' or jsonb_typeof(p->'method') is distinct from 'string' or jsonb_typeof(p->'note') is distinct from 'string'
      or (p ? 'reversed' and jsonb_typeof(p->'reversed') <> 'boolean') or p->>'createdAt' is null then raise exception 'Invalid payment fields';end if;
    perform (p->>'createdAt')::timestamptz;
    n:=(p->>'amount')::numeric;
    if n<=0 or n>99999999999 or n<>trunc(n) or p->>'from'=p->>'to'
      or not exists(select 1 from jsonb_array_elements(d->'members') member_row where member_row->>'id'=p->>'from')
      or not exists(select 1 from jsonb_array_elements(d->'members') member_row where member_row->>'id'=p->>'to') then raise exception 'Invalid payment';end if;
  end loop;
  for history_event in select * from jsonb_array_elements(d->'events') loop
    if jsonb_typeof(history_event->'id') is distinct from 'string' or (history_event ? 'actorName' and jsonb_typeof(history_event->'actorName') <> 'string') or history_event->>'type' is null or history_event->>'type' not in ('expense','payment','group')
      or jsonb_typeof(history_event->'title') is distinct from 'string' or jsonb_typeof(history_event->'detail') is distinct from 'string'
      or history_event->>'at' is null then raise exception 'Invalid activity';end if;
    perform (history_event->>'at')::timestamptz;
  end loop;
end;
$$;

create function public.save_ledger_group(p_document jsonb,p_revision integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare old public.ledger_groups; gid uuid; newrev integer; m jsonb; p jsonb; prior jsonb; checkdoc jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in first';end if;
  perform public.validate_ledger_document(p_document);
  gid:=(p_document->>'id')::uuid;
  select * into old from public.ledger_groups where id=gid for update;
  if not found then
    if p_revision<>0 or p_document->>'owner'<>auth.uid()::text then raise exception 'Invalid group owner';end if;
    if jsonb_array_length(p_document->'expenses')<>0 or jsonb_array_length(p_document->'payments')<>0 then raise exception 'Create an empty group first';end if;
    if (select count(*) from jsonb_array_elements(p_document->'members') member_row where member_row->>'userId'=auth.uid()::text)<>1
      or exists(select 1 from jsonb_array_elements(p_document->'members') member_row where member_row->>'userId' is not null and member_row->>'userId'<>auth.uid()::text) then raise exception 'People must join through invitations';end if;
    newrev:=1;
    insert into public.ledger_groups(id,owner,document,revision) values(gid,auth.uid(),p_document,newrev);
    insert into public.ledger_access(group_id,user_id) values(gid,auth.uid());
  else
    if not exists(select 1 from public.ledger_access where group_id=gid and user_id=auth.uid()) then raise exception 'Group access required';end if;
    if old.revision<>p_revision then raise exception 'revision conflict: refresh and retry';end if;
    if old.document->>'currency' is distinct from p_document->>'currency' or old.owner::text is distinct from p_document->>'owner' then raise exception 'Currency and owner cannot change';end if;
    if old.owner<>auth.uid() and (old.document->'members' is distinct from p_document->'members' or old.document->'name' is distinct from p_document->'name' or old.document->'archived' is distinct from p_document->'archived') then raise exception 'Only the creator can manage this group';end if;
    for m in select * from jsonb_array_elements(old.document->'members') loop
      if not exists(select 1 from jsonb_array_elements(p_document->'members') n where n=m) then raise exception 'Existing identities cannot change';end if;
    end loop;
    for m in select * from jsonb_array_elements(p_document->'members') loop
      if m->>'userId' is not null and not exists(select 1 from jsonb_array_elements(old.document->'members') n where n=m) then raise exception 'Use an invitation to join';end if;
    end loop;
    -- No physical removal of records or client rewriting of existing history.
    if exists(select 1 from jsonb_array_elements(old.document->'expenses') e where not exists(select 1 from jsonb_array_elements(p_document->'expenses') n where n->>'id'=e->>'id'))
      or exists(select 1 from jsonb_array_elements(old.document->'events') e where not exists(select 1 from jsonb_array_elements(p_document->'events') n where n=e)) then raise exception 'Keep history; use delete or undo';end if;
    for p in select * from jsonb_array_elements(old.document->'payments') loop
      select n into prior from jsonb_array_elements(p_document->'payments') n where n->>'id'=p->>'id';
      if prior is null or prior-'reversed' is distinct from p-'reversed' or (coalesce((p->>'reversed')::boolean,false) and not coalesce((prior->>'reversed')::boolean,false)) then raise exception 'Only undo is allowed on a payment record';end if;
    end loop;
    if coalesce((old.document->>'archived')::boolean,false) and (p_document->'expenses' is distinct from old.document->'expenses' or p_document->'payments' is distinct from old.document->'payments') then raise exception 'Reopen the group before changing its records';end if;
    for p in select * from jsonb_array_elements(p_document->'payments') loop
      if not exists(select 1 from jsonb_array_elements(old.document->'payments') n where n->>'id'=p->>'id') then
        if coalesce((p->>'reversed')::boolean,false) then raise exception 'New payment cannot be undone';end if;
        checkdoc:=jsonb_set(p_document,'{payments}',(select coalesce(jsonb_agg(n),'[]'::jsonb) from jsonb_array_elements(p_document->'payments') n where n->>'id'<>p->>'id'));
        if (p->>'amount')::numeric > public.ledger_pair_amount(checkdoc,p->>'from',p->>'to') then raise exception 'Payment exceeds the outstanding balance';end if;
      end if;
    end loop;
    if coalesce((p_document->>'archived')::boolean,false) then
      if exists(select 1 from jsonb_array_elements(p_document->'members') a cross join jsonb_array_elements(p_document->'members') b where a->>'id'<>b->>'id' and public.ledger_pair_amount(p_document,a->>'id',b->>'id')<>0) then raise exception 'Settle all balances before archiving';end if;
    end if;
    newrev:=old.revision+1;
    update public.ledger_groups set document=p_document,revision=newrev,updated_at=now() where id=gid;
  end if;
  insert into public.ledger_history(group_id,revision,actor,document) values(gid,newrev,auth.uid(),p_document);
  return newrev;
end;
$$;

create function public.create_ledger_invite(p_group uuid,p_member text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g public.ledger_groups; result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first';end if;
  select * into g from public.ledger_groups where id=p_group for update;
  if g.owner is null or g.owner<>auth.uid() then raise exception 'Only the group creator can invite';end if;
  if not exists(select 1 from jsonb_array_elements(g.document->'members') member_row where member_row->>'id'=p_member and member_row->>'userId' is null) then raise exception 'Choose someone who has not joined';end if;
  insert into public.ledger_invites(group_id,member_id) values(p_group,p_member)
    on conflict(group_id,member_id) do update set token=gen_random_uuid(),expires_at=now()+interval '7 days',accepted_by=null returning token into result;
  return result;
end;
$$;
create function public.preview_ledger_invite(p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in first';end if;
  select jsonb_build_object('name',g.document->>'name','currency',g.document->>'currency','person',member_row->>'name') into result
    from public.ledger_invites i join public.ledger_groups g on g.id=i.group_id cross join lateral jsonb_array_elements(g.document->'members') member_row
    where i.token=p_token and i.expires_at>now() and i.accepted_by is null and member_row->>'id'=i.member_id and member_row->>'userId' is null;
  if result is null then raise exception 'Invalid or expired invitation';end if;
  return result;
end;
$$;
create function public.accept_ledger_invite(p_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare i public.ledger_invites; g public.ledger_groups; doc jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in first';end if;
  -- Lock group first, like invite creation, to avoid inverted lock ordering.
  select lg.* into g from public.ledger_groups lg join public.ledger_invites li on li.group_id=lg.id where li.token=p_token for update of lg;
  select * into i from public.ledger_invites where token=p_token for update;
  if i.token is null or i.expires_at<=now() then raise exception 'Invalid or expired invitation';end if;
  if i.accepted_by=auth.uid() then return i.group_id;end if;
  if i.accepted_by is not null then raise exception 'Invitation already used';end if;
  if exists(select 1 from public.ledger_access where group_id=i.group_id and user_id=auth.uid()) then raise exception 'You are already in this group';end if;
  if not exists(select 1 from jsonb_array_elements(g.document->'members') member_row where member_row->>'id'=i.member_id and member_row->>'userId' is null) then raise exception 'This person has already joined';end if;
  doc:=jsonb_set(g.document,'{members}',(select jsonb_agg(case when m->>'id'=i.member_id then m||jsonb_build_object('userId',auth.uid()::text) else m end) from jsonb_array_elements(g.document->'members') m));
  doc:=jsonb_set(doc,'{events}',jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'type','group','title','Person joined','detail',(select m->>'name' from jsonb_array_elements(doc->'members') m where m->>'id'=i.member_id),'at',now())) || (doc->'events'));
  update public.ledger_groups set document=doc,revision=g.revision+1,updated_at=now() where id=g.id;
  insert into public.ledger_access(group_id,user_id) values(g.id,auth.uid());
  insert into public.ledger_history(group_id,revision,actor,document) values(g.id,g.revision+1,auth.uid(),doc);
  update public.ledger_invites set accepted_by=auth.uid() where token=p_token;
  return g.id;
end;
$$;
revoke all on function public.ledger_pair_amount(jsonb,text,text), public.validate_ledger_document(jsonb), public.save_ledger_group(jsonb,integer), public.create_ledger_invite(uuid,text), public.preview_ledger_invite(uuid), public.accept_ledger_invite(uuid) from public, anon, authenticated;
grant execute on function public.save_ledger_group(jsonb,integer), public.create_ledger_invite(uuid,text), public.preview_ledger_invite(uuid), public.accept_ledger_invite(uuid) to authenticated;
