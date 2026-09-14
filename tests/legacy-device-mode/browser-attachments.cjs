/* File-picker uploads in a fresh device-only browser; no camera or cloud storage involved. */
const { chromium } = require('playwright');
const { Buffer } = require('node:buffer');
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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const button = (name) =>
      page.getByRole('button', { name, exact: true }).filter({ visible: true });
    const label = (name) => page.getByLabel(name, { exact: true }).filter({ visible: true });
    const stored = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('splitly-ledger-v1:local')));
    const open = (path) => page.goto(base + path, { waitUntil: 'networkidle' });
    const upload = async (name) => {
      const chooser = page.waitForEvent('filechooser');
      await button(name).click();
      await (
        await chooser
      ).setFiles({
        name: 'receipt.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/p8AAAAASUVORK5CYII=',
          'base64',
        ),
      });
    };
    await open('/');
    await button('Get started on this device').click();
    await button('Create your first group').click();
    await label('Group name').fill('Receipt crew');
    await button('Create group').click();
    await button('Add expense').click();
    await label('Amount (INR)').fill('125');
    await label('Description').fill('Receipt lunch');
    await button('Optional details · Date, note, receipt').click();
    await button('Attach receipt').click();
    await upload('Choose an image');
    await button('Attach to expense').click();
    await button('Add expense').click();
    await label('Attached receipt').waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await label('Attached receipt').waitFor();
    assert.match((await stored()).groups[0].expenses[0].receipt, /^data:image\//);
    await button('Edit expense').click();
    await button('Optional details · Date, note, receipt').click();
    await button('Remove receipt').click();
    await button('Save changes').click();
    await page.getByText('Expense details', { exact: true }).filter({ visible: true }).waitFor();
    assert.equal((await stored()).groups[0].expenses[0].receipt, undefined);
    await open('/edit-profile');
    await upload('Choose profile photo');
    await button('Remove photo').waitFor();
    await button('Save changes').click();
    await open('/edit-profile');
    await button('Remove photo').waitFor();
    assert.match((await stored()).preferences.photo, /^data:image\//);
    await button('Remove photo').click();
    await button('Save changes').click();
    await open('/profile');
    assert.equal((await stored()).preferences.photo, undefined);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(
      'PASS receipt upload, durable save/reload/removal, and profile photo upload/save/removal',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
