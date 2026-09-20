const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const CASES = [
  ['area.clover-road', 1, 0, 'クローバー街道', 'ちびリーフ'],
  ['area.clover-road', 5, 0, 'クローバー街道', '街道オールスター'],
  ['area.mushroom-forest', 1, 0, 'キノコの森', 'ちびキノコ'],
  ['area.mushroom-forest', 5, 3, 'キノコの森', 'オオキノコ'],
  ['area.amber-mine', 1, 0, '琥珀鉱山', 'ころクリ'],
  ['area.amber-mine', 5, 3, '琥珀鉱山', '琥珀ガメ'],
  ['area.sunken-marsh', 1, 0, '沈み沼', 'ぷくガエル'],
  ['area.sunken-marsh', 5, 3, '沈み沼', 'おおぬまガエル'],
  ['area.frost-ruins', 1, 0, '氷雪遺跡', 'ゆきころ'],
  ['area.frost-ruins', 5, 3, '氷雪遺跡', '雪像の番人'],
  ['area.ember-canyon', 1, 0, '灼熱峡谷', 'ひのこヤモリ'],
  ['area.ember-canyon', 5, 3, '灼熱峡谷', '炉心ガメ'],
  ['area.moonlit-castle', 1, 0, '月夜の城', 'ころ兵'],
  ['area.moonlit-castle', 5, 3, '月夜の城', '月冠の騎士'],
  ['area.dragon-crater', 1, 0, '竜の火口', 'たまごドラゴン'],
  ['area.dragon-crater', 5, 3, '竜の火口', '星喰らい竜'],
];
const AREA_IDS = CASES.map((entry) => entry[0]).filter((value, index, all) => all.indexOf(value) === index);
const ROOT = process.env.WORLD_BATTLE_URL || 'http://127.0.0.1:4187/slime-mercenaries/';
const BASE = new URL('?validation-tools=1', ROOT).toString();
const NEUTRAL = new URL('environment-gallery/', ROOT).toString();

async function writeLocation(page, areaId, stage, wave) {
  await page.evaluate(async ({ areaId, stage, wave, allAreas }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!profile?.state) throw new Error('default profile missing');

    const targetIndex = allAreas.indexOf(areaId);
    const areas = { ...profile.state.gameData.progression.areas };
    for (let index = 0; index < allAreas.length; index += 1) {
      const id = allAreas[index];
      const cleared = index < targetIndex ? 5 : index === targetIndex ? Math.max(0, stage - 1) : 0;
      areas[id] = { highestStageCleared: cleared };
    }

    const slimes = Object.fromEntries(Object.entries(profile.state.gameData.roster.slimes).map(([id, slime]) => [
      id,
      { ...slime, level: 11 },
    ]));

    profile.state = {
      ...profile.state,
      lastWallClockMs: Date.now(),
      gameData: {
        ...profile.state.gameData,
        progression: {
          ...profile.state.gameData.progression,
          currentAreaId: areaId,
          currentStage: stage,
          areas,
        },
        combat: {
          ...profile.state.gameData.combat,
          currentWaveIndex: wave,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: 0,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: false,
        },
        roster: {
          ...profile.state.gameData.roster,
          slimes,
        },
      },
    };
    profile.savedAtMs = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile, 'default');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, { areaId, stage, wave, allAreas: AREA_IDS });
}

(async () => {
  const out = path.resolve(process.env.WORLD_BATTLE_QA_OUTPUT || '.tmp/world-content-qa');
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-sync', '--no-first-run'],
  });
  const page = await browser.newPage({ viewport: { width: 520, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(20000);

  const errors = [];
  page.on('pageerror', (error) => errors.push('pageerror ' + String(error)));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('/cdn-cgi/rum')) {
      errors.push(response.status() + ' ' + response.url());
    }
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'キャンプ' }).click();
  await page.getByRole('button', { name: '検証 · 全6職編成' }).click();
  await page.waitForTimeout(700);

  for (const [areaId, stage, wave, areaLabel, enemyLabel] of CASES) {
    await page.goto(NEUTRAL, { waitUntil: 'domcontentloaded' });
    await writeLocation(page, areaId, stage, wave);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const body = await page.locator('body').innerText();
    if (!body.includes(areaLabel + ' · ステージ ' + stage)) {
      throw new Error(areaId + ':' + stage + ' missing area/stage label\n' + body.slice(0, 800));
    }
    if (!body.includes(enemyLabel)) {
      throw new Error(areaId + ':' + stage + ':' + wave + ' missing enemy label ' + enemyLabel + '\n' + body.slice(0, 800));
    }
    const canvasCount = await page.locator('canvas').count();
    if (canvasCount < 1) throw new Error(areaId + ':' + stage + ' has no battle canvas');
    const slug = areaId.replace('area.', '');
    await page.screenshot({ path: path.join(out, slug + '-s' + stage + '-w' + wave + '.png'), fullPage: true });
    console.log(areaId, 'stage=' + stage, 'wave=' + wave, enemyLabel, 'canvas=' + canvasCount);
  }

  await fs.writeFile(path.join(out, 'errors.json'), JSON.stringify(errors, null, 2) + '\n');
  await browser.close();
  if (errors.length > 0) throw new Error(errors.join('\n'));
  console.log('world content QA PASS:', CASES.length, 'battle states');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
