const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
test('shared ledger migration, atomic validation, account isolation, invitation claiming and concurrent revisions', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(
    `create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  await db.exec(fs.readFileSync('supabase/migrations/20260912000000_shared_ledger.sql', 'utf8'));
  const owner = '11111111-1111-4111-8111-111111111111',
    friend = '22222222-2222-4222-8222-222222222222',
    outsider = '33333333-3333-4333-8333-333333333333',
    gid = '44444444-4444-4444-8444-444444444444';
  await db.query('insert into auth.users(id) values($1),($2),($3)', [owner, friend, outsider]);
  const as = async (user) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.exec('set role authenticated');
  };
  const save = (g, rev) =>
    db.query('select public.save_ledger_group($1::jsonb,$2) as revision', [JSON.stringify(g), rev]);
  const doc = {
    id: gid,
    owner,
    name: 'Dinner',
    currency: 'INR',
    revision: 0,
    archived: false,
    members: [
      { id: owner, userId: owner, name: 'Owner' },
      { id: 'guest', name: 'Rohan' },
    ],
    expenses: [],
    payments: [],
    events: [],
  };
  await as(owner);
  assert.equal((await save(doc, 0)).rows[0].revision, 1);
  await as(outsider);
  assert.equal((await db.query('select * from public.ledger_groups')).rows.length, 0);
  await assert.rejects(save(doc, 1), /access required/);
  await assert.rejects(db.query('update public.ledger_groups set revision=9'), /permission denied/);
  await as(owner);
  const e = {
    id: 'expense-1',
    title: 'Dinner',
    amount: 10000,
    paidBy: owner,
    method: 'amount',
    splits: [{ memberId: 'guest', amount: 10000 }],
    date: '2026-09-12',
    note: '',
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z',
  };
  let next = { ...doc, expenses: [e] };
  await save(next, 1);
  await assert.rejects(save(next, 1), /conflict/);
  await assert.rejects(
    save({ ...next, expenses: [{ ...e, amount: 10001 }] }, 2),
    /Shares must add up/,
  );
  assert.equal((await db.query('select revision from public.ledger_groups')).rows[0].revision, 2);
  await assert.rejects(
    save(
      { ...next, members: [...next.members, { id: friend, userId: friend, name: 'Injected' }] },
      2,
    ),
    /invitation/,
  );
  const token = (
    await db.query('select public.create_ledger_invite($1,$2) as token', [gid, 'guest'])
  ).rows[0].token;
  await as(friend);
  const preview = (await db.query('select public.preview_ledger_invite($1) as preview', [token]))
    .rows[0].preview;
  assert.deepEqual(preview, { name: 'Dinner', currency: 'INR', person: 'Rohan' });
  await db.query('select public.accept_ledger_invite($1)', [token]);
  await db.query('select public.accept_ledger_invite($1)', [token]);
  let row = (await db.query('select document,revision from public.ledger_groups')).rows[0];
  assert.equal(row.revision, 3);
  assert.equal(row.document.members[1].userId, friend);
  next = row.document;
  await assert.rejects(save({ ...next, name: 'Changed by member' }, 3), /Only the creator/);
  const p = {
    id: 'payment-1',
    from: 'guest',
    to: owner,
    amount: 2500,
    method: 'Cash',
    note: '',
    createdAt: '2026-09-12T01:00:00Z',
  };
  await save({ ...next, payments: [p] }, 3);
  next = { ...next, payments: [p] };
  await assert.rejects(
    save({ ...next, payments: [p, { ...p, id: 'overpayment', amount: 7501 }] }, 4),
    /exceeds/,
  );
  await assert.rejects(save({ ...next, payments: [] }, 4), /Only undo/);
  await save({ ...next, payments: [{ ...p, reversed: true }] }, 4);
  next = { ...next, payments: [{ ...p, reversed: true }] };
  await as(outsider);
  assert.equal((await db.query('select * from public.ledger_history')).rows.length, 0);
  await assert.rejects(db.query('select public.accept_ledger_invite($1)', [token]), /already used/);
  await as(owner);
  await assert.rejects(save({ ...next, archived: true }, 5), /Settle all/);
  assert.equal(
    (await db.query('select count(*)::int as n from public.ledger_history')).rows[0].n,
    5,
  );
  await assert.rejects(save({ ...next, currency: 'USD' }, 5), /Currency and owner/);
  const withGuest = { ...next, members: [...next.members, { id: 'guest-2', name: 'Priya' }] };
  await save(withGuest, 5);
  const firstCode = (
    await db.query('select public.create_ledger_invite($1,$2) as token', [gid, 'guest-2'])
  ).rows[0].token;
  const replacement = (
    await db.query('select public.create_ledger_invite($1,$2) as token', [gid, 'guest-2'])
  ).rows[0].token;
  assert.notEqual(firstCode, replacement);
  await as(outsider);
  await assert.rejects(
    db.query('select public.preview_ledger_invite($1)', [firstCode]),
    /Invalid or expired/,
  );
  await db.exec('reset role');
  await db.query(
    "update public.ledger_invites set expires_at=now()-interval '1 second' where token=$1",
    [replacement],
  );
  await as(outsider);
  await assert.rejects(
    db.query('select public.preview_ledger_invite($1)', [replacement]),
    /Invalid or expired/,
  );
  await assert.rejects(
    db.query('select public.accept_ledger_invite($1)', [replacement]),
    /Invalid or expired/,
  );
  await as(owner);
  await db.query('insert into public.ledger_accounts(user_id,preferences) values($1,$2)', [
    owner,
    JSON.stringify({ name: 'Private name' }),
  ]);
  await as(outsider);
  assert.equal((await db.query('select * from public.ledger_accounts')).rows.length, 0);
  await assert.rejects(
    db.query('insert into public.ledger_accounts(user_id,preferences) values($1,$2)', [
      friend,
      '{}',
    ]),
    /row-level security/,
  );
  await db.exec('reset role;set role anon');
  await assert.rejects(
    db.query('select public.preview_ledger_invite($1)', [replacement]),
    /permission denied/,
  );
});
