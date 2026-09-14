/* Run against an Expo preview started with EXPO_NO_DOTENV=1. Uses a fresh browser profile. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SPLITLY_TEST_URL || 'http://localhost:8082';
const output = process.env.SPLITLY_TEST_OUTPUT || '/tmp/splitly-browser';
fs.mkdirSync(output, { recursive: true });
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
    const open = async (path) => {
      await page.goto(base + path, { waitUntil: 'networkidle' });
    };
    const stored = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('splitly-ledger-v1:local')));
    await open('/');
    await button('Get started on this device').click();
    await button('Create your first group').click();
    await label('Group name').fill('Dinner crew');
    for (const name of ['Rohan', 'Priya']) {
      await label('Person’s name (optional)').fill(name);
      await button('Add person').click();
    }
    await button('Create group').click();
    let data = await stored();
    const gid = data.groups[0].id;
    assert.equal(data.groups.length, 1);
    await button('Add expense').click();
    await label('Amount (INR)').fill('600');
    await label('Description').fill('Dinner');
    await button('Priya').click();
    await button('Change split').click();
    await button('Amounts').click();
    await label('You amount').fill('100');
    await label('Rohan amount').fill('400');
    assert.equal(await button('Apply split').getAttribute('aria-disabled'), 'true');
    await label('Rohan amount').fill('500');
    await button('Apply split').click();
    await text('₹500.00').waitFor();
    // A failed local write must not change balances or navigate away.
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'splitly-ledger-v1:local') throw new Error('Storage unavailable for test');
        return window.originalSetItem.call(this, k, v);
      };
    });
    await button('Add expense').click();
    await text('Storage unavailable for test').waitFor();
    assert.equal((await stored()).groups[0].expenses.length, 0);
    await page.evaluate(() => {
      Storage.prototype.setItem = window.originalSetItem;
    });
    await button('Add expense').evaluate((b) => {
      b.click();
      b.click();
    });
    await text('Expense details').waitFor();
    data = await stored();
    assert.equal(data.groups[0].expenses.length, 1);
    assert.equal(
      data.groups[0].expenses[0].splits.find((s) => s.memberId === 'local').amount,
      10000,
    );
    assert.equal(data.groups[0].expenses[0].splits.length, 2);
    const eid = data.groups[0].expenses[0].id;
    await page.reload({ waitUntil: 'networkidle' });
    await text('Dinner').waitFor();
    await button('View group balances').click();
    await button('Rohan owes you').click();
    await label('Amount paid (INR)').fill('50');
    await button('Review payment').click();
    await button('Payment already made · Record it').click();
    await text('Payment recorded').waitFor();
    await text('Remaining in this direction: ₹450.00').waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await text('Remaining in this direction: ₹450.00').waitFor();
    await button('Undo payment record').click();
    await button('Undo payment record').last().click();
    await text('Payment undone').waitFor();
    await text('Remaining in this direction: ₹500.00').waitFor();
    await open(`/transaction/${eid}?groupId=${gid}`);
    await button('Edit expense').click();
    await label('Description').fill('Saved edit draft');
    await button('Save draft & close').click();
    await open('/add-transaction');
    assert.equal(await label('Description').inputValue(), 'Saved edit draft');
    await label('Description').fill('Dinner corrected');
    await button('Paid by You').click();
    await button('Rohan').first().click();
    await button('Save changes').click();
    await text('Dinner corrected').waitFor();
    assert.equal(
      (await stored()).groups[0].expenses[0].paidBy,
      data.groups[0].members.find((m) => m.name === 'Rohan').id,
    );
    await button('Delete expense').click();
    await button('Delete expense').last().click();
    await text('Deleted · Excluded from balances').waitFor();
    await button('Restore expense').click();
    await text('Your share ₹100.00').waitFor();
    // Back navigation preserves a draft only after explicit confirmation.
    await open(`/add-transaction?groupId=${gid}`);
    await label('Amount (INR)').fill('10.01');
    await label('Description').fill('Coffee draft');
    await button('Go back').click();
    await text('Keep this expense draft?').waitFor();
    await button('Save draft & leave').click();
    await open('/add-transaction');
    await label('Description').waitFor();
    assert.equal(await label('Description').inputValue(), 'Coffee draft');
    await button('Change split').click();
    await button('Percentages').click();
    await label('You percentage').fill('0');
    await label('Rohan percentage').fill('50');
    await label('Priya percentage').fill('50');
    await button('Apply split').click();
    await button('Save draft & close').click();
    await open('/add-transaction');
    assert.equal(await label('Description').inputValue(), 'Coffee draft');
    await button('Discard draft').click();
    await button('Discard draft').last().click();
    await page.getByText('Home', { exact: true }).first().waitFor();
    await open('/edit-profile');
    await label('Your name').fill('Sam');
    await button('Save changes').click();
    await open('/profile');
    await text('Sam').waitFor();
    await open('/currency-selector');
    await page.getByRole('radio').filter({ hasText: 'US Dollar' }).click();
    await button('Done · USD').click();
    await open('/settings');
    await text('USD · For new groups only').waitFor();
    await page.getByRole('switch', { name: 'Hide amounts on Home' }).click();
    await open('/payment-methods');
    await button('Cash').click();
    await button('Save preference').click();
    await open('/payment-methods');
    assert.equal(await button('Cash').getAttribute('aria-selected'), 'true');
    await open('/');
    await text('You owe ••••').waitFor();
    assert.equal(
      await page.getByText(/₹/).filter({ visible: true }).count(),
      0,
      'Home amount privacy applies to group rows too',
    );
    await page.screenshot({ path: output + '/home.png' });
    // Inspect all destinations on a narrow phone in both themes, including missing-record states.
    const routes = [
      '/onboarding',
      '/login',
      '/sign-up',
      '/forgot-password',
      '/update-password',
      '/',
      '/groups',
      '/activity',
      '/profile',
      '/create-group',
      `/group/${gid}`,
      `/transaction/${eid}?groupId=${gid}`,
      '/add-transaction',
      '/split-options',
      '/settle-up',
      '/payment-method',
      '/payment-success',
      '/edit-profile',
      '/settings',
      '/currency-selector',
      '/payment-methods',
      '/help-support',
      '/scan-bill',
      '/join-group',
    ];
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 740 });
      for (const path of routes) {
        await open(path);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
          `${path} horizontal overflow`,
        );
        if (['/onboarding', '/settle-up', '/settings', `/group/${gid}`].includes(path))
          await page.screenshot({
            path: output + '/' + colorScheme + '-' + path.replace(/[^a-z0-9]/gi, '_') + '.png',
          });
      }
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(
      'PASS durable core loop, custom splits, failed storage, duplicate taps, corrections, drafts, preferences, and 24 routes × 2 themes',
    );
    fs.writeFileSync(
      output + '/report.json',
      JSON.stringify({ errors, routes, checks: 48 }, null, 2),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
