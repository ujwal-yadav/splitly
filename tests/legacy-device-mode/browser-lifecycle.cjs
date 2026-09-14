/* Fresh browser contexts against the device-only test instance. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SPLITLY_TEST_URL || 'http://localhost:8091';
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const button = (name) =>
      page.getByRole('button', { name, exact: true }).filter({ visible: true });
    const label = (name) => page.getByLabel(name, { exact: true }).filter({ visible: true });
    const text = (name) => page.getByText(name, { exact: true }).filter({ visible: true });
    const open = (path) => page.goto(base + path, { waitUntil: 'networkidle' });
    const stored = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('splitly-ledger-v1:local')));
    await open('/');
    await button('Get started on this device').click();
    await button('Create your first group').click();
    await button('Create group').click();
    await text('Give your group a name.').waitFor();
    await label('Group name').fill('Lifecycle crew');
    await label('Person’s name (optional)').fill('Priya');
    await button('Add person').click();
    await label('Person’s name (optional)').fill('priya');
    await button('Add person').click();
    await text('Use distinct names so you can tell people apart.').waitFor();
    await label('Person’s name (optional)').fill('');
    await button('Create group').click();
    await button('People').click();
    await label('Add a person').fill('Rohan');
    await button('Add person').click();
    await text('Rohan').waitFor();
    await label('Add a person').fill('rohan');
    await button('Add person').click();
    await page.getByText('That name is already in this group.', { exact: false }).waitFor();
    assert.equal((await stored()).groups[0].members.length, 3);
    await button('Rename group').click();
    await label('Group name').fill('Weekend crew');
    await button('Save name').click();
    await text('Weekend crew').waitFor();
    const gid = (await stored()).groups[0].id;
    await button('Archive group').click();
    await button('Reopen group').waitFor();
    assert.equal((await stored()).groups[0].archived, true);
    assert.equal(await button('Add expense').count(), 0);
    await open('/groups');
    assert.equal(await button('Weekend crew').count(), 0);
    await button('Archived').click();
    await button('Weekend crew').click();
    await button('People').click();
    await button('Reopen group').click();
    await button('Add expense').click();
    await label('Amount (INR)').fill('300');
    await label('Description').fill('Weekend lunch');
    await button('Add expense').click();
    await text('Expense details').waitFor();
    await open('/group/' + gid);
    await label('Search expenses').fill('absent');
    await text('No matching expenses.').waitFor();
    await label('Search expenses').fill('lunch');
    await button('Weekend lunch · ₹300.00').waitFor();
    await button('People').click();
    await button('Archive group').click();
    await page
      .getByText('Record all outstanding payments before archiving this group.', { exact: false })
      .waitFor();
    assert.equal((await stored()).groups[0].archived, false);
    await open('/activity');
    await button('Expenses').click();
    await button('Expense added').waitFor();
    await button('Payments').click();
    await text('No activity yet. Saved expenses and payments will appear here.').waitFor();
    await open('/profile');
    await button('Log out').click();
    await label('Email address').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('splitly-guest')), null);
    await page.reload({ waitUntil: 'networkidle' });
    await label('Email address').waitFor();
    await button('Continue on this device').click();
    await button('Weekend crew').waitFor();
    assert.equal((await stored()).groups[0].expenses.length, 1);
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto(base, { waitUntil: 'networkidle' });
    await secondPage
      .getByRole('button', { name: 'Get started on this device', exact: true })
      .click();
    await secondPage
      .getByRole('button', { name: 'Create your first group', exact: true })
      .waitFor();
    assert.equal(
      await secondPage.getByRole('button', { name: 'Weekend crew', exact: true }).count(),
      0,
    );
    await secondContext.close();
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(
      'PASS group validation, members, rename, archive/reopen, expense search, archive guard, activity filters, profile logout/re-entry, and separate browser isolation',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
