
const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = process.env.SETTINGS_QA_URL || 'http://127.0.0.1:4187/slime-mercenaries/';
const OUT_DIR = path.resolve(process.env.SETTINGS_QA_OUTPUT || '.tmp/settings-save-qa');

(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));
  page.on('console', (message) => {
    const sourceUrl = message.location().url || '';
    if (sourceUrl.includes('/cdn-cgi/rum')) return;
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });
  page.on('response', (response) => {
    if (response.url().includes('/cdn-cgi/rum')) return;
    if (response.status() >= 400) errors.push('http ' + response.status() + ': ' + response.url());
  });

  await page.goto(ROOT, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('heading', { name: '設定' }).waitFor();
  await page.screenshot({ path: path.join(OUT_DIR, 'development.png'), fullPage: true });

  const development = page.getByRole('radio', { name: /開発用モード/ });
  const normal = page.getByRole('radio', { name: /通常モード/ });
  if ((await development.getAttribute('aria-checked')) !== 'true') {
    throw new Error('Validation build did not default to Development economy mode.');
  }

  await normal.click();
  if ((await normal.getAttribute('aria-checked')) !== 'true') throw new Error('Normal mode switch failed.');
  await page.screenshot({ path: path.join(OUT_DIR, 'normal.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '設定' }).click();
  if ((await normal.getAttribute('aria-checked')) !== 'true') throw new Error('Normal mode did not persist after reload.');
  await development.click();
  if ((await development.getAttribute('aria-checked')) !== 'true') throw new Error('Development mode switch failed.');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /データを書き出す/ }).click();
  const download = await downloadPromise;
  const exportPath = path.join(OUT_DIR, 'export.json');
  await download.saveAs(exportPath);

  const exported = JSON.parse(await fs.readFile(exportPath, 'utf8'));
  if (exported.formatId !== 'idle-game-kit-save-v1' || exported.gameId !== 'slime-mercenaries') {
    throw new Error('Unexpected save export envelope.');
  }
  const gold = exported.state.currencies['currency.gold'];
  const numericGold = Number(gold?.mantissa ?? 0) * 10 ** Number(gold?.exponent ?? 0);
  if (numericGold >= 1e12) throw new Error('Development Gold floor leaked into export.');
  if (Math.max(...Object.values(exported.state.tokens).map(Number)) >= 1e6) {
    throw new Error('Development token floor leaked into export.');
  }

  await page.locator('input[type=file]').setInputFiles(exportPath);
  await page.getByText('このデータを読み込みますか？').waitFor();
  const importReload = page.waitForEvent('load');
  await page.getByRole('button', { name: '読み込んで上書き' }).click();
  await importReload;
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('button', { name: 'セーブデータを削除' }).click();
  await page.getByText('セーブデータを削除しますか？').waitFor();
  const deleteReload = page.waitForEvent('load');
  await page.getByRole('button', { name: '削除して最初から' }).click();
  await deleteReload;
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '設定' }).click();
  await page.screenshot({ path: path.join(OUT_DIR, 'after-delete.png'), fullPage: true });

  if (errors.length > 0) throw new Error('Browser errors:\n' + errors.join('\n'));
  console.log('settings/save QA PASS');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
