const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');

test('email membership is owner-only, atomic, idempotent and grants only the selected account access', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(
    `create schema auth; create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}'); create role anon; create role authenticated; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  for (const file of [
    '20260912000000_shared_ledger.sql',
    '20260912010000_add_group_member_by_email.sql',
    '20260912020000_create_group_with_emails.sql',
  ])
    await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8'));
  const owner = '11111111-1111-4111-8111-111111111111',
    member = '22222222-2222-4222-8222-222222222222',
    outsider = '33333333-3333-4333-8333-333333333333',
    gid = '44444444-4444-4444-8444-444444444444';
  await db.query(
    "insert into auth.users values ($1,'owner@example.test',now(),'{}'),($2,'ujwal@example.test',now(),'{\"full_name\":\"Ujwal\"}'),($3,'unverified@example.test',null,'{}')",
    [owner, member, outsider],
  );
  const as = async (uid) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
    await db.exec('set role authenticated');
  };
  const add = (email, revision = 1) =>
    db.query('select public.add_ledger_member_by_email($1,$2,$3) as result', [
      gid,
      email,
      revision,
    ]);
  await as(owner);
  const doc = {
    id: gid,
    owner,
    name: 'Shared test',
    currency: 'INR',
    archived: false,
    members: [{ id: owner, userId: owner, name: 'Owner' }],
    expenses: [],
    payments: [],
    events: [],
  };
  await db.query('select public.save_ledger_group($1,0)', [JSON.stringify(doc)]);
  await as(outsider);
  await assert.rejects(add('ujwal@example.test'), /Only the group creator/);
  await as(owner);
  await assert.rejects(add('invalid'), /valid email/);
  await assert.rejects(add('missing@example.test'), /No verified account/);
  await assert.rejects(add('unverified@example.test'), /No verified account/);
  await assert.rejects(add('ujwal@example.test', 0), /group changed/);
  assert.equal((await db.query('select revision from public.ledger_groups')).rows[0].revision, 1);
  assert.deepEqual((await add('  UJWAL@EXAMPLE.TEST  ')).rows[0].result, {
    name: 'Ujwal',
    already_member: false,
  });
  assert.deepEqual((await add('ujwal@example.test')).rows[0].result, {
    name: 'Ujwal',
    already_member: true,
  });
  const saved = (await db.query('select document,revision from public.ledger_groups')).rows[0];
  assert.equal(saved.revision, 2);
  assert.equal(saved.document.members.length, 2);
  assert.equal(saved.document.events.length, 1);
  assert.deepEqual(saved.document.expenses, []);
  await as(member);
  assert.equal((await db.query('select id from public.ledger_groups')).rows.length, 1);
  await assert.rejects(add('unverified@example.test', 2), /Only the group creator/);
  await as(outsider);
  assert.equal((await db.query('select id from public.ledger_groups')).rows.length, 0);
  await as(owner);
  await db.query('select public.save_ledger_group($1,2)', [
    JSON.stringify({ ...saved.document, archived: true }),
  ]);
  await assert.rejects(add('ujwal@example.test', 3), /Reopen/);
  const createdId = '55555555-5555-4555-8555-555555555555';
  const create = (emails) =>
    db.query('select public.create_ledger_group_with_emails($1,$2) as result', [
      JSON.stringify({ ...doc, id: createdId }),
      emails,
    ]);
  await assert.rejects(
    create(['ujwal@example.test', 'missing@example.test']),
    /No verified account/,
  );
  assert.equal(
    (await db.query('select id from public.ledger_groups where id=$1', [createdId])).rows.length,
    0,
  );
  const created = (
    await create([' UJWAL@example.test ', 'ujwal@example.test', 'owner@example.test'])
  ).rows[0].result;
  assert.equal(created.members.length, 2);
  assert.equal(created.revision, 2);
  assert.equal(created.members[1].userId, member);
  await assert.rejects(create(['ujwal@example.test']), /already exists/);
  await as(member);
  assert.equal(
    (await db.query('select id from public.ledger_groups where id=$1', [createdId])).rows.length,
    1,
  );
  await as(outsider);
  assert.equal(
    (await db.query('select id from public.ledger_groups where id=$1', [createdId])).rows.length,
    0,
  );
  await db.exec('reset role; set role anon');
  await assert.rejects(create(['ujwal@example.test']), /permission denied/);
  await assert.rejects(add('ujwal@example.test', 3), /permission denied/);
});
