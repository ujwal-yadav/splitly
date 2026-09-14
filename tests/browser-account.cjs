/* Account UI exercised with a disposable PostgreSQL engine and a mock Auth transport.
   No requests are sent to a real Supabase project. */
const { chromium } = require('playwright');
const { Buffer } = require('node:buffer');
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
  });
  try {
    await db.exec(
      `create schema auth;create table auth.users(id uuid primary key);create role authenticated;create role anon;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
    );
    await db.exec(fs.readFileSync('supabase/migrations/20260912000000_shared_ledger.sql', 'utf8'));
    const uid = '11111111-1111-4111-8111-111111111111';
    await db.query('insert into auth.users(id) values($1)', [uid]);
    const user = {
      id: uid,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'sam@example.test',
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Sam' },
    };
    const token = () =>
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
      '.' +
      Buffer.from(
        JSON.stringify({
          sub: uid,
          exp: Math.floor(Date.now() / 1000) + 3600,
          aud: 'authenticated',
          role: 'authenticated',
        }),
      ).toString('base64url') +
      '.test';
    const session = () => ({
      access_token: token(),
      refresh_token: 'local-test-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user,
    });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const errors = [];
    let requests = Promise.resolve();
    let rejectSave = false;
    await context.route('http://127.0.0.1:54399/**', (route) => {
      requests = requests.then(async () => {
        const req = route.request();
        const url = new URL(req.url());
        let status = 200;
        let data;
        try {
          if (url.pathname === '/auth/v1/token') data = session();
          else if (url.pathname === '/auth/v1/signup') data = user;
          else if (url.pathname === '/auth/v1/user') data = user;
          else if (url.pathname === '/auth/v1/logout') data = {};
          else if (url.pathname === '/auth/v1/recover') data = {};
          else {
            await db.exec('reset role');
            await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
            await db.exec('set role authenticated');
            if (url.pathname === '/rest/v1/profiles')
              data = { id: uid, full_name: 'Sam', email: user.email };
            else if (url.pathname === '/rest/v1/ledger_groups')
              data = (await db.query('select document,revision from public.ledger_groups')).rows;
            else if (url.pathname === '/rest/v1/ledger_accounts') {
              if (req.method() === 'GET') {
                data =
                  (await db.query('select preferences from public.ledger_accounts')).rows[0] ??
                  null;
              } else {
                const b = req.postDataJSON();
                await db.query(
                  'insert into public.ledger_accounts(user_id,preferences) values($1,$2) on conflict(user_id) do update set preferences=excluded.preferences',
                  [uid, JSON.stringify(b.preferences)],
                );
                data = null;
              }
            } else if (url.pathname === '/rest/v1/rpc/save_ledger_group') {
              if (rejectSave) throw new Error('Test connection interrupted');
              const b = req.postDataJSON();
              data = (
                await db.query('select public.save_ledger_group($1,$2) as result', [
                  JSON.stringify(b.p_document),
                  b.p_revision,
                ])
              ).rows[0].result;
            } else throw new Error('Unexpected test request: ' + url.pathname);
          }
        } catch (e) {
          status = 400;
          data = { message: e.message, code: 'TEST' };
        }
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(data),
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
        });
      });
      return requests;
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    const button = (name) =>
      page.getByRole('button', { name, exact: true }).filter({ visible: true });
    const label = (name) => page.getByLabel(name, { exact: true }).filter({ visible: true });
    const text = (name) => page.getByText(name, { exact: true }).filter({ visible: true });
    const base = process.env.SPLITLY_ACCOUNT_TEST_URL || 'http://localhost:8092';
    await page.goto(base + '/sign-up', { waitUntil: 'networkidle' });
    await label('Your name').fill('Sam');
    await label('Email address').fill('sam@example.test');
    await label('Password').fill('a-valid-test-password');
    await button('Create account').click();
    await text('Check your email to confirm your account if required, then sign in.').waitFor();
    await button('Back to sign in').click();
    await label('Email address').fill('sam@example.test');
    await label('Password').fill('a-valid-test-password');
    await button('Sign in').click();
    await button('Create your first group').waitFor();
    await button('Create your first group').click();
    await label('Group name').fill('Account dinner');
    await label('Person’s name (optional)').fill('Rohan');
    await button('Add person').click();
    rejectSave = true;
    await button('Create group').click();
    await text('Test connection interrupted').waitFor();
    rejectSave = false;
    await button('Create group').click();
    await button('Add expense').waitFor();
    await button('Add expense').click();
    await label('Amount (INR)').fill('100');
    await label('Description').fill('Shared dinner');
    await button('Add expense').click();
    await text('Expense details').waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await text('Shared dinner').waitFor();
    await button('View group balances').click();
    await button('Rohan owes you').waitFor();
    await page.goto(base + '/settings', { waitUntil: 'networkidle' });
    await button('Sign out').click();
    await label('Email address').waitFor();
    assert.equal(await text('Account dinner').count(), 0);
    await button('Forgot password?').click();
    await label('Email address').fill('sam@example.test');
    await button('Reset password').click();
    await text(
      'If an account exists for this email, a reset link has been requested. Check your inbox.',
    ).waitFor();
    await button('Back to sign in').click();
    await label('Email address').fill('sam@example.test');
    await label('Password').fill('a-valid-test-password');
    await button('Sign in').click();
    await button('Account dinner').waitFor();
    await page.goto(base + '/profile', { waitUntil: 'networkidle' });
    await button('Log out').click();
    await label('Email address').waitFor();
    assert.equal(await button('Continue on this device').count(), 0);
    // A legacy guest flag must never bypass account authentication.
    await page.evaluate(() => localStorage.setItem('splitly-guest', 'true'));
    await page.goto(base + '/groups', { waitUntil: 'networkidle' });
    await label('Email address').waitFor();
    assert.equal(await text('Account dinner').count(), 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(
      'PASS account signup confirmation, signin, atomic saves with failure/retry, authenticated reload, password reset request, settings/profile logout and rejection of legacy guest access',
    );
  } finally {
    await browser.close();
    await db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
