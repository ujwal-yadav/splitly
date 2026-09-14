-- Keep creation and email membership atomic: a bad email leaves no partial group.
create function public.create_ledger_group_with_emails(p_document jsonb, p_emails text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  gid uuid := (p_document->>'id')::uuid;
  rev integer;
  email text;
  result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from public.ledger_groups where id = gid) then
    raise exception 'Group already exists. Refresh before trying again';
  end if;
  if coalesce(cardinality(p_emails), 0) > 99 then
    raise exception 'A group can have up to 100 people';
  end if;
  rev := public.save_ledger_group(p_document, 0);
  foreach email in array coalesce(p_emails, array[]::text[]) loop
    perform public.add_ledger_member_by_email(gid, email, rev);
    select revision into rev from public.ledger_groups where id = gid;
  end loop;
  select document || jsonb_build_object('revision', revision) into result
    from public.ledger_groups where id = gid;
  return result;
end;
$$;
revoke all on function public.create_ledger_group_with_emails(jsonb, text[]) from public, anon;
grant execute on function public.create_ledger_group_with_emails(jsonb, text[]) to authenticated;
