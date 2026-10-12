const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const viewportWidth = Number(process.env.WIDTH || '390');
const viewportHeight = Number(process.env.HEIGHT || '844');
const OUT = path.resolve(`.tmp/ui-overhaul-acceptance-${viewportWidth}x${viewportHeight}`);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4244/slime-mercenaries/';
const delay = (page, milliseconds) => page.waitForTimeout(milliseconds);

/** Capture the actual mobile viewport after a deliberate player interaction. */
async function shot(page, basename) {
  await page.screenshot({ path: path.join(OUT, `${basename}.png`), fullPage: false });
}

/** Run an authentic first-play journey and preserve navigation/UI evidence. */
async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CFT_BIN || path.join(process.env.HOME, 'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
    args: ['--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-sync', '--no-first-run'],
  });
  const context = await browser.newContext({ viewport: { width: viewportWidth, height: viewportHeight }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(`pageerror: ${error}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await delay(page, 450);
  await shot(page, '00-camp-empty');
  await page.getByRole('button', { name: /最初のスライムを生み出す/ }).click();
  await delay(page, 600);
  await shot(page, '01-create-plain');
  await page.getByRole('button', { name: /生み出す/ }).last().click();
  await delay(page, 2650);
  await shot(page, '02-plain-ready');
  await page.getByRole('button', { name: /木人を叩いてみる/ }).click();
  await delay(page, 2050);
  await page.getByRole('button', { name: /剣を渡す/ }).click();
  await page.getByRole('button', { name: /剣士スライムにする/ }).first().click();
  await delay(page, 2700);
  await page.getByRole('button', { name: /もう一度、木人へ/ }).click();
  await delay(page, 2750);
  await shot(page, '03-camp-world');
  await page.getByRole('button', { name: /仲間・育成/ }).click();
  await delay(page, 200);
  await shot(page, '04-management');
  const panel = await page.locator('#camp-command-panel').boundingBox();
  assert(panel !== null && panel.x < 3 && panel.y < 3 && panel.width >= viewportWidth - 4, 'Management must fill the gameplay surface');
  assert(await page.getByLabel('所持ゴールド').count() === 1, 'Gold must remain visible in management');
  await page.getByRole('button', { name: '強化', exact: true }).click();
  await delay(page, 180);
  await shot(page, '05-train');
  assert(await page.locator('.camp-train-stage').count() === 1, 'Training must have a selected-slime stage');
  await page.getByRole('button', { name: '仲間・育成メニューへ戻る' }).click();
  await page.getByRole('button', { name: '編成', exact: true }).click();
  await delay(page, 180);
  await shot(page, '06-formation');
  assert((await page.locator('.camp-formation-slot').count()) === 6, 'Formation must expose all six slots');
  await page.getByRole('button', { name: '仲間・育成メニューへ戻る' }).click();
  await page.locator('button.camp-equipment-entry').click();
  await delay(page, 180);
  await shot(page, '07-equipment');
  await page.getByRole('button', { name: '仲間・育成メニューへ戻る' }).click();
  await page.getByRole('button', { name: '合成', exact: true }).click();
  await delay(page, 800);
  await shot(page, '08-fusion');
  await page.getByRole('button', { name: /仲間・育成/ }).first().click();
  await delay(page, 120);
  await shot(page, '09-management-return');
  const nav = (label) => page.locator('nav[aria-label="メインメニュー"] button').filter({ hasText: label }).first();
  await nav('戦闘').click();
  await delay(page, 1200);
  await shot(page, '10-battle');
  await nav('派遣').click();
  await delay(page, 250);
  await shot(page, '11-dispatch-early');
  assert(await page.getByRole('heading', {name:'派遣'}).isVisible(), 'Dispatch must expose its heading before the 3D map finishes');
  assert(await page.getByRole('button', {name:'キャンプで編成を変更'}).count() === 1, 'Dispatch needs a usable empty-roster exit');
  await delay(page, 2000);
  await shot(page, '12-dispatch');
  await nav('鍛造').click();
  await delay(page, 700);
  await shot(page, '13-forge');
  assert(await page.getByRole('button', {name:/戦闘で鍛造キーを集める/}).count() === 1, 'Empty forge must offer a usable key-acquisition route');
  await nav('設定').click();
  await delay(page, 220);
  await shot(page, '14-settings');
  await page.getByRole('button', { name: '設定を閉じる' }).click().catch(async () => {
    await page.locator('[role="dialog"] button').filter({hasText:'×'}).first().click();
  });
  await page.getByRole('button', { name: /戦闘で鍛造キーを集める/ }).click();
  await page.getByRole('button', { name: '戦闘', exact: true }).first().waitFor({ state: 'visible' });
  assert(await page.locator('section[aria-label="戦闘"]').isVisible(), 'Forge key CTA must navigate to battle');
  const results = { viewport: [viewportWidth, viewportHeight], errors,
    endText: (await page.locator('body').innerText()).slice(0, 1200),
    captured: 15,
    assertCount: 7,
  };
  await writeFile(path.join(OUT, 'result.json'), JSON.stringify(results, null, 2));
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  if (errors.length) process.exitCode = 1;
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
