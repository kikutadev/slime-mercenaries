const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const width = Number(process.env.UI_WIDTH || 390);
const height = Number(process.env.UI_HEIGHT || 844);
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:4250/slime-mercenaries/';
const url = new URL('?validation-tools=1', base).toString();
const output = path.resolve(`.tmp/midgame-ui-${width}x${height}`);

/** Save the actual phone viewport as a human-reviewable artifact. */
async function capture(page, name) {
  await page.screenshot({ path: path.join(output, `${name}.png`) });
}

/** Confirm that the player can progress from a full party to a return timer and inspect every forged weapon. */
async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CFT_BIN || path.join(process.env.HOME, 'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
    args: ['--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-sync', '--no-first-run'],
  });
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(() => localStorage.setItem(
    'slime-mercenaries.runtime-settings.v1',
    JSON.stringify({ economyMode: 'development', soundEnabled: false }),
  ));
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (response.status() >= 400 && pathname !== '/cdn-cgi/rum') errors.push(`${response.status()} ${response.url()}`);
  });
  const nav = (label) => page.locator('nav[aria-label="メインメニュー"] button').filter({ hasText: label }).first();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await nav('キャンプ').click();
    await page.getByRole('button', { name: /検証.*全6職編成/ }).click();
    await nav('派遣').click();
    await page.getByRole('button', { name: '編成を変更する ›' }).click();
    await page.locator('.camp-formation-slot').first().waitFor({ state: 'visible' });
    assert.equal(await page.locator('.camp-formation-slot').count(), 6, 'Formation must expose six slots');
    await capture(page, '01-formation');
    await page.getByRole('button', { name: '控えへ戻す' }).click();
    await nav('派遣').click();
    const selected = page.getByRole('button', { name: 'このスライムを派遣' });
    await selected.waitFor({ state: 'visible' });
    await capture(page, '02-dispatch-eligible');
    await selected.click();
    await page.getByText('出発中…').waitFor({ state: 'visible' });
    await capture(page, '03-departure');
    await page.getByText('帰還まで', { exact: true }).waitFor({ state: 'visible' });
    await capture(page, '04-running');
    assert.match(await page.locator('section[aria-label="派遣"]').innerText(), /1\s*\/\s*3/, 'One active contract required');

    await nav('鍛造').click();
    await page.getByRole('button', { name: /10回鍛造/ }).click();
    await page.getByRole('list', { name: '10回鍛造の結果' }).waitFor({ state: 'visible' });
    const resultList = page.getByRole('list', { name: '10回鍛造の結果' });
    assert.equal(await resultList.getByRole('listitem').count(), 10, 'Each draw must have a readable result');
    assert.match(await resultList.getByRole('listitem').first().innerText(), /新規獲得|精錬/);
    const initialScroll = await resultList.evaluate((node) => node.scrollLeft);
    await resultList.evaluate((node) => node.scrollTo({ left: node.scrollWidth, behavior: 'instant' }));
    assert((await resultList.evaluate((node) => node.scrollLeft)) > initialScroll, 'All ten cards must be inspectable by scrolling');
    await capture(page, '05-forge-batch-end');
    await resultList.evaluate((node) => node.scrollTo({ left: 0, behavior: 'instant' }));
    await capture(page, '06-forge-batch-start');
    assert.equal(errors.length, 0, 'No game-origin page or HTTP errors expected');
    console.log(JSON.stringify({ result: 'PASS', width, height, dispatchStarted: true, forgeResultCards: 10, errors }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
