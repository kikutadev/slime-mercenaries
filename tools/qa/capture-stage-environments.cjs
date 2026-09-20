const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const AREAS = [
  'clover-road',
  'mushroom-forest',
  'amber-mine',
  'sunken-marsh',
  'frost-ruins',
  'ember-canyon',
  'moonlit-castle',
  'dragon-crater',
];

const BASE = process.env.ENVIRONMENT_GALLERY_URL
  || 'http://127.0.0.1:4186/slime-mercenaries/environment-gallery/';
const OUT = path.resolve(process.env.ENVIRONMENT_QA_OUTPUT || '.tmp/stage-environment-frames');

(async () => {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--enable-unsafe-swiftshader',
      '--disable-background-networking',
      '--disable-sync',
      '--no-first-run',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 520, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);

  const errors = [];
  page.on('pageerror', (error) => errors.push('pageerror ' + String(error)));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('/cdn-cgi/rum')) {
      errors.push(response.status() + ' ' + response.url());
    }
  });

  const metrics = {};
  for (const area of AREAS) {
    metrics[area] = {};
    for (let stage = 1; stage <= 5; stage += 1) {
      const url = new URL(BASE);
      url.searchParams.set('area', area);
      url.searchParams.set('stage', String(stage));
      await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        (expected) => document.documentElement.dataset.environmentLoaded === expected,
        area + ':' + stage,
      );
      await page.waitForTimeout(180);

      const viewport = page.locator('.environment-gallery__stage');
      const box = await viewport.boundingBox();
      if (box === null) throw new Error(area + ':' + stage + ' has no gallery stage');

      const file = area + '-stage-' + stage + '.png';
      await viewport.screenshot({ path: path.join(OUT, file) });
      metrics[area][stage] = {
        width: Math.round(box.width),
        height: Math.round(box.height),
        loaded: await page.evaluate(() => document.documentElement.dataset.environmentLoaded),
      };
      console.log(area + ' stage=' + stage);
    }
  }

  await fs.writeFile(
    path.join(OUT, 'metrics.json'),
    JSON.stringify({ frameCount: AREAS.length * 5, metrics, errors }, null, 2) + '\n',
  );
  await browser.close();

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  console.log('stage environment capture PASS: ' + AREAS.length * 5 + ' frames');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
