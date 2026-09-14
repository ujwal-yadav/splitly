-- Add registered people by exact email without exposing an account directory.
create function public.add_ledger_member_by_email(p_group uuid, p_email text, p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  g public.ledger_groups;
  target_id uuid;
  target_name text;
  member jsonb;
  doc jsonb;
  normalized_email text := lower(trim(p_email));
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into g from public.ledger_groups where id = p_group for update;
  if g.id is null or g.owner <> auth.uid() then
    raise exception 'Only the group creator can add people by email';
  end if;
  if coalesce((g.document->>'archived')::boolean, false) then
    raise exception 'Reopen this group before adding people';
  end if;
  if normalized_email is null or length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address';
  end if;
  select u.id, left(coalesce(nullif(trim(a.preferences->>'name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)), 60)
  into target_id, target_name
  from auth.users u left join public.ledger_accounts a on a.user_id = u.id
  where lower(u.email) = normalized_email and u.email_confirmed_at is not null;
  if target_id is null then
    raise exception 'No verified account found for this email. Ask them to sign up and confirm their email first';
  end if;
  select m into member from jsonb_array_elements(g.document->'members') m
    where m->>'userId' = target_id::text;
  if member is not null then
    return jsonb_build_object('name', member->>'name', 'already_member', true);
  end if;
  if p_revision is distinct from g.revision then
    raise exception 'This group changed. Refresh it and try again';
  end if;
  if jsonb_array_length(g.document->'members') >= 100 then
    raise exception 'A group can have up to 100 people';
  end if;
  member := jsonb_build_object('id', target_id::text, 'userId', target_id::text, 'name', target_name);
  doc := jsonb_set(g.document, '{members}', (g.document->'members') || jsonb_build_array(member));
  doc := jsonb_set(doc, '{events}', jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text, 'type', 'group', 'title', 'Person added',
    'detail', target_name || ' joined by email', 'at', now(),
    'actorName', (select m->>'name' from jsonb_array_elements(g.document->'members') m
      where m->>'userId' = auth.uid()::text)
  )) || (doc->'events'));
  perform public.validate_ledger_document(doc);
  update public.ledger_groups set document = doc, revision = g.revision + 1, updated_at = now()
    where id = g.id;
  insert into public.ledger_access(group_id, user_id) values(g.id, target_id);
  insert into public.ledger_history(group_id, revision, actor, document)
    values(g.id, g.revision + 1, auth.uid(), doc);
  return jsonb_build_object('name', target_name, 'already_member', false);
end;
$$;
revoke all on function public.add_ledger_member_by_email(uuid, text, integer) from public, anon;
grant execute on function public.add_ledger_member_by_email(uuid, text, integer) to authenticated;
