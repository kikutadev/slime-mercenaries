const { chromium } = require('playwright-core');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const PORT = Number(process.env.INTERACTION_QA_PORT || 4240);
const BASE_URL = `http://127.0.0.1:${PORT}/slime-mercenaries/`;
const APP_URL = new URL('?validation-tools=1', BASE_URL).toString();
const NEUTRAL_URL = new URL('environment-gallery/', BASE_URL).toString();
const OUT_DIR = path.resolve(process.env.INTERACTION_QA_OUTPUT || '.tmp/interaction-production-qa');
const SERVER_LOG = path.join(OUT_DIR, 'preview.log');
const ONLY = new Set(
  String(process.env.INTERACTION_QA_ONLY || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const shouldRun = (name) => ONLY.size === 0 || ONLY.has(name);

const TIER3_CASES = [
  { slug: 'sword-blademaster', typeId: 'sword', prior: 'fighter', priorName: '戦士スライム', result: '剣聖スライム' },
  { slug: 'sword-berserker', typeId: 'sword', prior: 'fighter', priorName: '戦士スライム', result: '狂戦士スライム' },
  { slug: 'shield-paladin', typeId: 'shield', prior: 'guardian', priorName: 'ガーディアンスライム', result: 'パラディンスライム' },
  { slug: 'shield-fortress', typeId: 'shield', prior: 'guardian', priorName: 'ガーディアンスライム', result: 'フォートレススライム' },
  { slug: 'bow-sniper', typeId: 'bow', prior: 'ranger', priorName: 'レンジャースライム', result: 'スナイパースライム' },
  { slug: 'bow-storm', typeId: 'bow', prior: 'ranger', priorName: 'レンジャースライム', result: 'ストームアーチャースライム' },
  { slug: 'wand-archmage', typeId: 'wand', prior: 'mage', priorName: 'メイジスライム', result: 'アークメイジスライム' },
  { slug: 'wand-frost', typeId: 'wand', prior: 'mage', priorName: 'メイジスライム', result: 'フロストメイジスライム' },
  { slug: 'dagger-ninja', typeId: 'dagger', prior: 'rogue', priorName: 'ローグスライム', result: 'ニンジャスライム' },
  { slug: 'dagger-assassin', typeId: 'dagger', prior: 'rogue', priorName: 'ローグスライム', result: 'アサシンスライム' },
  { slug: 'gun-cannoneer', typeId: 'gun', prior: 'gunner', priorName: 'ガンナースライム', result: '砲撃手スライム' },
  { slug: 'gun-engineer', typeId: 'gun', prior: 'gunner', priorName: 'ガンナースライム', result: 'エンジニアスライム' },
];

function findHeadlessShell() {
  if (process.env.INTERACTION_QA_CHROME) return process.env.INTERACTION_QA_CHROME;
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (fs.existsSync(cache)) {
    const candidates = fs.readdirSync(cache)
      .filter((entry) => entry.startsWith('chromium_headless_shell-'))
      .sort()
      .reverse();
    for (const entry of candidates) {
      const binary = path.join(cache, entry, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
      if (fs.existsSync(binary)) return binary;
    }
  }
  const stable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(stable)) return stable;
  throw new Error('No headless Chromium/Chrome binary found. Set INTERACTION_QA_CHROME.');
}

async function waitForHttp(url, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Preview server did not become ready: ${lastError}`);
}

function observePage(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push('pageerror: ' + String(error)));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (text.includes('/cdn-cgi/rum')) return;
    errors.push('console: ' + text);
  });
  page.on('response', (response) => {
    if (response.status() < 400 || response.url().includes('/cdn-cgi/rum')) return;
    errors.push(`http ${response.status()}: ${response.url()}`);
  });
  return errors;
}

async function prepareValidation(page) {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'キャンプ' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'キャンプ' }).click();
  const prepare = page.getByRole('button', { name: '検証 · 全6職編成' });
  if (await prepare.count()) {
    await prepare.click();
    await page.waitForTimeout(650);
  }
}

async function readProfile(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default.development');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return profile;
  });
}

async function patchTier3Profile(page, item) {
  await page.goto(NEUTRAL_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ typeId, prior }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default.development');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!profile?.state) throw new Error('development profile missing');
    const target = Object.entries(profile.state.gameData.roster.slimes)
      .find(([, slime]) => slime.typeId === typeId);
    if (!target) throw new Error('slime missing: ' + typeId);
    const [id, slime] = target;
    profile.state = {
      ...profile.state,
      lastWallClockMs: Date.now(),
      gameData: {
        ...profile.state.gameData,
        progression: {
          ...profile.state.gameData.progression,
          currentAreaId: 'area.sunken-marsh',
          currentStage: 1,
        },
        roster: {
          ...profile.state.gameData.roster,
          slimes: {
            ...profile.state.gameData.roster.slimes,
            [id]: {
              ...slime,
              level: 40,
              jobTier: 2,
              fusionRank: 3,
              fusionFormId: prior,
              mutationId: null,
            },
          },
        },
      },
    };
    profile.savedAtMs = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile, 'default.development');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, item);
}

async function runFusionQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);

  const results = [];
  for (const item of TIER3_CASES) {
    await patchTier3Profile(page, item);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'キャンプ' }).click();
    await page.getByRole('button', { name: /仲間・育成/ }).click();
    const roster = page.getByRole('button', { name: new RegExp('^' + item.priorName + ' Lv\\.40') }).first();
    await roster.waitFor({ state: 'visible' });
    await roster.click();
    await page.getByRole('button', { name: '合成', exact: true }).click();

    const altar = page.getByLabel('合成祭壇');
    await altar.waitFor({ state: 'visible' });
    const choices = page.getByLabel('合成先を選ぶ');
    await choices.getByRole('button').filter({ hasText: item.result }).click();
    const trigger = page.getByRole('button', { name: new RegExp(item.result + 'へ合成') }).last();

    const startedAt = Date.now();
    await trigger.click();
    await page.waitForTimeout(1180);
    if ((await altar.getAttribute('aria-busy')) !== 'true') {
      throw new Error(item.slug + ': Fusion ceremony lost busy state before result reveal');
    }
    const screenshotStartedAt = Date.now();
    await altar.screenshot({ path: path.join(OUT_DIR, 'fusion-' + item.slug + '-attack.png') });
    const screenshotMs = Date.now() - screenshotStartedAt;
    await altar.getByText('合成完了', { exact: true }).waitFor({ state: 'visible', timeout: 6000 });
    const completedMs = Date.now() - startedAt;
    const interactionMs = Math.max(0, completedMs - screenshotMs);
    if (interactionMs < 1200 || interactionMs > 4200) {
      throw new Error(item.slug + ': unexpected ceremony interaction time ' + interactionMs + 'ms');
    }
    await altar.getByText(item.result, { exact: true }).first().waitFor({ state: 'visible' });
    await altar.getByRole('button', { name: '戦闘で試す' }).waitFor({ state: 'visible' });
    results.push({ slug: item.slug, completedMs, screenshotMs, interactionMs });
  }

  if (errors.length > 0) throw new Error('Fusion browser errors:\n' + errors.join('\n'));
  await context.close();
  return results;
}

async function patchReserveSlime(page) {
  await page.goto(NEUTRAL_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default.development');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!profile?.state) throw new Error('development profile missing');
    const target = Object.entries(profile.state.gameData.roster.slimes)
      .find(([, slime]) => slime.typeId === 'sword');
    if (!target) throw new Error('sword slime missing');
    const [id, slime] = target;
    profile.state = {
      ...profile.state,
      lastWallClockMs: Date.now(),
      gameData: {
        ...profile.state.gameData,
        roster: {
          ...profile.state.gameData.roster,
          formationSlots: profile.state.gameData.roster.formationSlots.map((slot) => slot === id ? null : slot),
          slimes: {
            ...profile.state.gameData.roster.slimes,
            [id]: { ...slime, assignment: 'reserve' },
          },
        },
      },
    };
    profile.savedAtMs = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile, 'default.development');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
}

async function waitForCondition(check, timeoutMs = 5000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await check();
    if (last) return last;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('condition timed out');
}

async function runDispatchQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 667 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);
  await patchReserveSlime(page);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  const nav = page.locator('nav[aria-label="メインメニュー"]');
  await nav.getByRole('button', { name: '派遣' }).click();

  const send = page.getByRole('button', { name: '出発させる' });
  await send.waitFor({ state: 'visible' });
  if (await send.isDisabled()) throw new Error('Dispatch send is disabled after reserve fixture');

  const navRect = await nav.boundingBox();
  const sendRect = await send.boundingBox();
  if (!navRect || !sendRect) throw new Error('Dispatch geometry unavailable');
  if (sendRect.y + sendRect.height > navRect.y + 1) {
    throw new Error(`Short-height Dispatch send overlaps nav: ${sendRect.y + sendRect.height} > ${navRect.y}`);
  }

  await send.click();
  const departureFrame = await page.waitForFunction(() => {
    const cue = document.querySelector('[class*="departureCue"]');
    const panel = document.querySelector('[class*="departurePanel"]');
    if (!(cue instanceof HTMLElement) || !(panel instanceof HTMLElement)) return null;
    const cueText = cue.innerText.trim();
    const panelText = panel.innerText.trim();
    const root = document.querySelector('section[aria-label="派遣"]');
    const topbar = root?.querySelector(':scope > header') ?? null;
    const map = root?.children[1] ?? null;
    const consolePanel = root?.children[2] ?? null;
    const rect = (element) => element instanceof HTMLElement
      ? {
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          display: getComputedStyle(element).display,
          opacity: getComputedStyle(element).opacity,
        }
      : null;
    return cueText.includes('出発')
      && cueText.includes('街道護衛')
      && panelText.includes('出発中…')
      ? { cueText, panelText, topbar: rect(topbar), map: rect(map), consolePanel: rect(consolePanel) }
      : null;
  }, undefined, { timeout: 2_000 }).then((handle) => handle.jsonValue());
  if (!departureFrame) throw new Error('Dispatch departure frame missing');
  const dispatchRoot = page.locator('section[aria-label="派遣"]');
  await dispatchRoot.screenshot({ path: path.join(OUT_DIR, 'dispatch-short-departure.png') });
  await page.waitForTimeout(1_260);

  await nav.getByRole('button', { name: 'キャンプ' }).click();
  await page.evaluate(() => {
    const originalNow = Date.now;
    const base = originalNow();
    Date.now = () => base + 310_000;
  });

  const dispatchNav = nav.getByRole('button', { name: '派遣' });
  await waitForCondition(async () =>
    (await dispatchNav.locator('[aria-label="実行できる項目があります"]').count()) > 0,
  5000);

  await dispatchNav.click();
  const returnFrame = await page.waitForFunction(() => {
    const cue = document.querySelector('[class*="returnCue"]');
    if (!(cue instanceof HTMLElement)) return null;
    const cueText = cue.innerText.trim();
    return cueText.includes('帰還') && cueText.includes('獲得') ? { cueText } : null;
  }, undefined, { timeout: 2_000 }).then((handle) => handle.jsonValue());
  if (!returnFrame) throw new Error('Dispatch return frame missing');
  await dispatchRoot.screenshot({ path: path.join(OUT_DIR, 'dispatch-short-return.png') });
  const cueText = returnFrame.cueText;

  if (errors.length > 0) throw new Error('Dispatch browser errors:\n' + errors.join('\n'));
  await context.close();
  return { cueText, sendBottom: sendRect.y + sendRect.height, navTop: navRect.y, departureFrame };
}

async function patchTier3BattleParty(page) {
  await page.goto(NEUTRAL_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const formByType = {
      sword: 'blademaster',
      shield: 'paladin',
      bow: 'sniper',
      wand: 'archmage',
      dagger: 'ninja',
      gun: 'cannoneer',
    };
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default.development');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!profile?.state) throw new Error('development profile missing');

    const slimes = Object.fromEntries(Object.entries(profile.state.gameData.roster.slimes).map(([id, slime]) => {
      const form = formByType[slime.typeId];
      return [id, form === undefined ? slime : {
        ...slime,
        level: 40,
        jobTier: 3,
        fusionRank: 4,
        fusionFormId: form,
        mutationId: null,
      }];
    }));
    profile.state = {
      ...profile.state,
      lastWallClockMs: Date.now(),
      gameData: {
        ...profile.state.gameData,
        progression: {
          ...profile.state.gameData.progression,
          currentAreaId: 'area.dragon-crater',
          currentStage: 1,
        },
        combat: {
          ...profile.state.gameData.combat,
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: 0,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: false,
        },
        roster: { ...profile.state.gameData.roster, slimes },
      },
    };
    profile.savedAtMs = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile, 'default.development');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
}

const TIER3_BATTLE_FAMILY_CASES = [
  { slug: 'blademaster', typeId: 'sword', form: 'blademaster', slotIndex: 1 },
  { slug: 'paladin', typeId: 'shield', form: 'paladin', slotIndex: 1 },
  { slug: 'sniper', typeId: 'bow', form: 'sniper', slotIndex: 4 },
  { slug: 'archmage', typeId: 'wand', form: 'archmage', slotIndex: 4 },
  { slug: 'ninja', typeId: 'dagger', form: 'ninja', slotIndex: 1 },
  { slug: 'cannoneer', typeId: 'gun', form: 'cannoneer', slotIndex: 4 },
];

async function patchTier3BattleFamily(page, item) {
  await page.goto(NEUTRAL_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ typeId, form, slotIndex }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default.development');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!profile?.state) throw new Error('development profile missing');
    const target = Object.entries(profile.state.gameData.roster.slimes)
      .find(([, slime]) => slime.typeId === typeId);
    if (!target) throw new Error('Tier 3 family slime missing: ' + typeId);
    const [targetId] = target;
    const slimes = Object.fromEntries(Object.entries(profile.state.gameData.roster.slimes).map(([id, slime]) => [
      id,
      id === targetId
        ? { ...slime, level: 80, jobTier: 3, fusionRank: 4, fusionFormId: form, mutationId: null, assignment: 'battle' }
        : { ...slime, assignment: 'reserve' },
    ]));
    const formationSlots = Array.from({ length: 6 }, (_, index) => index === slotIndex ? targetId : null);
    profile.state = {
      ...profile.state,
      lastWallClockMs: Date.now(),
      gameData: {
        ...profile.state.gameData,
        progression: {
          ...profile.state.gameData.progression,
          currentAreaId: 'area.dragon-crater',
          currentStage: 1,
        },
        combat: {
          ...profile.state.gameData.combat,
          currentWaveIndex: 0,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: 0,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: false,
        },
        roster: { ...profile.state.gameData.roster, slimes, formationSlots },
      },
    };
    profile.savedAtMs = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile, 'default.development');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, item);
}

async function runTier3FamilyWatchQa(browser) {
  const results = [];
  const familyOnly = String(process.env.TIER3_FAMILY_ONLY || '').trim();
  const cases = familyOnly.length === 0
    ? TIER3_BATTLE_FAMILY_CASES
    : TIER3_BATTLE_FAMILY_CASES.filter((item) => item.slug === familyOnly);
  if (cases.length === 0) throw new Error('Unknown TIER3_FAMILY_ONLY: ' + familyOnly);
  for (const item of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(9000);
    const errors = observePage(page);
    await prepareValidation(page);
    await patchTier3BattleFamily(page, item);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    const nav = page.locator('nav[aria-label="メインメニュー"]');
    await nav.getByRole('button', { name: '戦闘' }).click();
    const battleRoot = page.locator('section[aria-label="戦闘"]');
    await battleRoot.waitFor({ state: 'visible' });
    await battleRoot.locator('canvas').waitFor({ state: 'visible' });
    await page.locator('[aria-label="敵の体力"]').waitFor({ state: 'visible' });
    await waitForCondition(async () => {
      const text = await battleRoot.innerText();
      return !text.includes('出撃準備中') && !text.includes('戦闘データを再読込中');
    }, 9000, 100);

    const frames = [];
    const frameCount = Math.max(1, Number(process.env.TIER3_FAMILY_FRAME_COUNT || 8));
    const frameIntervalMs = Math.max(40, Number(process.env.TIER3_FAMILY_FRAME_INTERVAL_MS || 280));
    for (let index = 0; index < frameCount; index += 1) {
      await page.waitForTimeout(index === 0 ? Math.min(180, frameIntervalMs) : frameIntervalMs);
      const pathName = path.join(OUT_DIR, `battle-tier3-${item.slug}-${String(index).padStart(2, '0')}.png`);
      await page.screenshot({ path: pathName });
      frames.push(pathName);
    }
    if (errors.length > 0) throw new Error(item.slug + ' Battle watch browser errors:\n' + errors.join('\n'));
    results.push({ slug: item.slug, frames });
    await context.close();
  }
  return results;
}

async function runTier3BattleWatchQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);
  await patchTier3BattleParty(page);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  const nav = page.locator('nav[aria-label="メインメニュー"]');
  await nav.getByRole('button', { name: '戦闘' }).click();
  const battleRoot = page.locator('section[aria-label="戦闘"]');
  await battleRoot.waitFor({ state: 'visible' });
  await battleRoot.locator('canvas').waitFor({ state: 'visible' });
  await page.locator('[aria-label="敵の体力"]').waitFor({ state: 'visible' });
  await waitForCondition(async () => {
    const text = await battleRoot.innerText();
    return !text.includes('出撃準備中') && !text.includes('戦闘データを再読込中');
  }, 9000, 100);

  const frames = [];
  for (let index = 0; index < 8; index += 1) {
    await page.waitForTimeout(index === 0 ? 250 : 350);
    const pathName = path.join(OUT_DIR, `battle-tier3-${String(index).padStart(2, '0')}.png`);
    await page.screenshot({ path: pathName });
    frames.push(pathName);
  }
  if (errors.length > 0) throw new Error('Tier 3 Battle watch browser errors:\n' + errors.join('\n'));
  await context.close();
  return { frames };
}

async function patchBattleAcceptanceProfile(page, scenario) {
  await page.goto(NEUTRAL_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (scenarioName) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('slime-mercenaries', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get('default.development');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!profile?.state) throw new Error('development profile missing');

    const formByType = {
      sword: 'blademaster',
      shield: 'paladin',
      bow: 'sniper',
      wand: 'archmage',
      dagger: 'ninja',
      gun: 'cannoneer',
    };
    const entries = Object.entries(profile.state.gameData.roster.slimes);
    const strong = scenarioName !== 'defeat';
    const sword = entries.find(([, slime]) => slime.typeId === 'sword');
    if (!sword) throw new Error('sword slime missing');

    const slimes = Object.fromEntries(entries.map(([id, slime]) => {
      if (!strong) {
        return [id, id === sword[0]
          ? { ...slime, level: 1, jobTier: 1, fusionRank: 0, fusionFormId: null, mutationId: null, assignment: 'battle' }
          : { ...slime, assignment: 'reserve' }];
      }
      const form = formByType[slime.typeId];
      return [id, form === undefined
        ? { ...slime, assignment: 'reserve' }
        : { ...slime, level: 80, jobTier: 3, fusionRank: 4, fusionFormId: form, mutationId: null, assignment: 'battle' }];
    }));
    const strongIds = Object.entries(slimes)
      .filter(([, slime]) => slime.assignment === 'battle')
      .slice(0, 6)
      .map(([id]) => id);
    const formationSlots = strong
      ? Array.from({ length: 6 }, (_, index) => strongIds[index] ?? null)
      : [sword[0], null, null, null, null, null];

    const location = scenarioName === 'victory-march'
      ? { areaId: 'area.clover-road', stage: 1, wave: 2 }
      : { areaId: 'area.dragon-crater', stage: 5, wave: 3 };

    profile.state = {
      ...profile.state,
      lastWallClockMs: Date.now(),
      gameData: {
        ...profile.state.gameData,
        progression: {
          ...profile.state.gameData.progression,
          currentAreaId: location.areaId,
          currentStage: location.stage,
        },
        combat: {
          ...profile.state.gameData.combat,
          currentWaveIndex: location.wave,
          waveWorkRemaining: null,
          retryFarmClearsRemaining: 0,
          frontierDefeatTimeRemainingSec: null,
          contentBoundaryReached: false,
        },
        roster: { ...profile.state.gameData.roster, slimes, formationSlots },
      },
    };
    profile.savedAtMs = Date.now();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile, 'default.development');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, scenario);
}

async function openPatchedBattle(page, scenario) {
  await prepareValidation(page);
  await patchBattleAcceptanceProfile(page, scenario);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  const nav = page.locator('nav[aria-label="メインメニュー"]');
  await nav.getByRole('button', { name: '戦闘' }).click();
  const battleRoot = page.locator('section[aria-label="戦闘"]');
  await battleRoot.waitFor({ state: 'visible' });
  await battleRoot.locator('canvas').waitFor({ state: 'visible' });
  await page.locator('[aria-label="敵の体力"]').waitFor({ state: 'visible' });
  await waitForCondition(async () => {
    const text = await battleRoot.innerText();
    return !text.includes('出撃準備中') && !text.includes('戦闘データを再読込中');
  }, 9000, 100);
  return battleRoot;
}

async function runBattleFinalAcceptanceQa(browser) {
  const results = {};

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = observePage(page);
    const battleRoot = await openPatchedBattle(page, 'boss');
    await page.waitForTimeout(1050);
    const bossPath = path.join(OUT_DIR, 'acceptance-boss-landing.png');
    await page.screenshot({ path: bossPath });
    const bossText = await battleRoot.innerText();
    if (!bossText.includes('BOSS')) throw new Error('Boss acceptance did not render boss HUD');
    if (errors.length > 0) throw new Error('Boss acceptance browser errors:\n' + errors.join('\n'));
    results.boss = { path: bossPath, text: bossText.slice(0, 500) };
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(16000);
    const errors = observePage(page);
    const battleRoot = await openPatchedBattle(page, 'defeat');
    const defeatFrames = [];
    let lastPreResultPath = null;
    for (let index = 0; index < 48; index += 1) {
      await page.waitForTimeout(180);
      const framePath = path.join(OUT_DIR, `acceptance-ally-defeat-${String(index).padStart(2, '0')}.png`);
      await page.screenshot({ path: framePath });
      defeatFrames.push(framePath);
      if (await page.getByText('敗北', { exact: true }).isVisible().catch(() => false)) break;
      lastPreResultPath = framePath;
    }
    await page.getByText('敗北', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
    if (lastPreResultPath === null) throw new Error('Defeat acceptance did not capture a pre-result collapse frame');
    const defeatExpressionPath = path.join(OUT_DIR, 'acceptance-ally-defeat-expression.png');
    fs.copyFileSync(lastPreResultPath, defeatExpressionPath);
    const defeatPath = path.join(OUT_DIR, 'acceptance-ally-defeat.png');
    await page.screenshot({ path: defeatPath });
    await page.getByText('戦線を立て直します', { exact: true }).waitFor({ state: 'visible' });
    const defeatText = await battleRoot.innerText();
    if (errors.length > 0) throw new Error('Defeat acceptance browser errors:\n' + errors.join('\n'));
    results.defeat = { path: defeatPath, expressionPath: defeatExpressionPath, frames: defeatFrames, text: defeatText.slice(0, 500) };
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(16000);
    const errors = observePage(page);
    await openPatchedBattle(page, 'victory-march');
    await page.getByText('勝利', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    const victoryPath = path.join(OUT_DIR, 'acceptance-victory.png');
    await page.screenshot({ path: victoryPath });
    await page.getByText(/クローバー街道 · ステージ 2/).waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(450);
    const marchPath = path.join(OUT_DIR, 'acceptance-next-stage.png');
    await page.screenshot({ path: marchPath });
    const stageText = await page.locator('section[aria-label="戦闘"]').innerText();
    if (errors.length > 0) throw new Error('Victory/march acceptance browser errors:\n' + errors.join('\n'));
    results.victoryMarch = { victoryPath, marchPath, text: stageText.slice(0, 500) };
    await context.close();
  }

  return results;
}

async function runBattleWatchQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);

  const nav = page.locator('nav[aria-label="メインメニュー"]');
  await nav.getByRole('button', { name: '戦闘' }).click();
  const battleRoot = page.locator('section[aria-label="戦闘"]');
  await battleRoot.waitFor({ state: 'visible' });
  await battleRoot.locator('canvas').waitFor({ state: 'visible' });
  await page.locator('[aria-label="敵の体力"]').waitFor({ state: 'visible' });
  await waitForCondition(async () => {
    const text = await battleRoot.innerText();
    return !text.includes('出撃準備中') && !text.includes('戦闘データを再読込中');
  }, 9000, 100);

  const frames = [];
  for (const [name, delay] of [['approach', 450], ['combat-early', 1_150], ['combat-late', 1_700]]) {
    await page.waitForTimeout(delay);
    const pathName = path.join(OUT_DIR, `battle-watch-${name}.png`);
    await page.screenshot({ path: pathName });
    frames.push({ name, path: pathName });
  }

  const enemyHud = await page.locator('[aria-label="敵の体力"]').innerText().catch(() => '');
  const status = await page.locator('[class*="status"]').first().innerText().catch(() => '');
  if (errors.length > 0) throw new Error('Battle watch browser errors:\n' + errors.join('\n'));
  await context.close();
  return { frames, enemyHud, status };
}

async function runCampReactionQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);

  await page.getByRole('button', { name: /仲間・育成/ }).click();
  await page.getByRole('button', { name: '強化', exact: true }).click();
  const reset = page.getByRole('button', { name: '初期形態へ戻す' });
  if (await reset.count()) {
    await reset.click();
    await page.waitForTimeout(120);
  }
  const one = page.locator('.camp-level-buttons button').first();
  await one.waitFor({ state: 'visible' });
  await one.click();

  const frames = [];
  for (let index = 0; index < 9; index += 1) {
    await page.waitForTimeout(index === 0 ? 160 : 90);
    const framePath = path.join(OUT_DIR, `camp-reaction-level-${String(index).padStart(2, '0')}.png`);
    await page.screenshot({ path: framePath });
    frames.push(framePath);
  }

  await page.getByText(/Lv\.2/, { exact: false }).first().waitFor({ state: 'visible' });
  if (errors.length > 0) throw new Error('Camp player-reaction browser errors:\n' + errors.join('\n'));
  await context.close();
  return { frames };
}

async function runCampLivingQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);

  const stage = page.locator('.camp-environment-stage');
  await stage.waitFor({ state: 'visible' });
  await stage.locator('canvas').waitFor({ state: 'visible' });
  const managementLauncher = page.getByRole('button', { name: /仲間・育成/ });
  await managementLauncher.waitFor({ state: 'visible' });
  if (await page.locator('#camp-command-panel').count() !== 0) {
    throw new Error('Camp management panel must be collapsed on initial entry');
  }
  await page.waitForTimeout(450);

  const frames = [];
  for (let index = 0; index <= 15; index += 1) {
    if (index > 0) await page.waitForTimeout(1000);
    const framePath = path.join(OUT_DIR, `camp-living-${String(index).padStart(2, '0')}.png`);
    await page.screenshot({ path: framePath });
    frames.push(framePath);
  }

  if (errors.length > 0) throw new Error('Camp living-world browser errors:\n' + errors.join('\n'));
  await context.close();
  return { frames };
}

async function runCampMotionQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);

  const stage = page.locator('.camp-resident-stage');
  await stage.waitFor({ state: 'visible' });
  await stage.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(350);

  const frames = [];
  const delays = [0, 900, 900, 700, 650, 850, 850, 900, 850];
  for (let index = 0; index < delays.length; index += 1) {
    if (delays[index] > 0) await page.waitForTimeout(delays[index]);
    const framePath = path.join(OUT_DIR, `camp-motion-${String(index).padStart(2, '0')}.png`);
    await page.screenshot({ path: framePath });
    frames.push(framePath);
  }

  if (errors.length > 0) throw new Error('Camp motion browser errors:\n' + errors.join('\n'));
  await context.close();
  return { frames };
}

async function runSoundSettingsQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);

  const nav = page.locator('nav[aria-label="メインメニュー"]');
  await nav.getByRole('button', { name: '設定' }).click();
  const soundSwitch = page.getByRole('switch', { name: /効果音/ });
  await soundSwitch.waitFor({ state: 'visible' });
  const initial = await soundSwitch.getAttribute('aria-checked');
  await soundSwitch.click();
  const toggled = await soundSwitch.getAttribute('aria-checked');
  if (initial === toggled) throw new Error('Sound setting did not toggle');
  const stored = await page.evaluate(() => localStorage.getItem('slime-mercenaries.runtime-settings.v1'));
  if (stored === null || !stored.includes('soundEnabled')) throw new Error('Sound setting did not persist');
  await page.screenshot({ path: path.join(OUT_DIR, 'settings-sound-toggle.png') });

  if (errors.length > 0) throw new Error('Sound settings browser errors:\n' + errors.join('\n'));
  await context.close();
  return { initial, toggled, stored };
}

async function runBattleReportQa(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = observePage(page);
  await prepareValidation(page);
  const nav = page.locator('nav[aria-label="メインメニュー"]');

  await nav.getByRole('button', { name: '戦闘' }).click();
  await page.waitForTimeout(700);
  await nav.getByRole('button', { name: 'キャンプ' }).click();
  await page.evaluate(() => {
    const originalNow = Date.now;
    const base = originalNow();
    Date.now = () => base + 12_000;
  });

  const battleNav = nav.getByRole('button', { name: '戦闘' });
  await waitForCondition(async () =>
    (await battleNav.locator('[aria-label="実行できる項目があります"]').count()) > 0,
  5000);
  await battleNav.click();

  const peek = page.getByRole('button', { name: /戦闘レポート/ });
  await peek.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'battle-report-peek.png') });
  await peek.click();

  await page.getByRole('heading', { name: '戦闘レポート' }).waitFor({ state: 'visible' });
  await page.getByText('離れていた間の自動戦闘', { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('獲得報酬', { exact: true }).waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'battle-report-expanded.png') });
  const sheetText = (await page.locator('body').innerText()).match(/離れていた間の自動戦闘[\s\S]*?確認した/)?.[0] ?? '';
  await page.getByRole('button', { name: '確認した' }).click();
  await page.getByRole('heading', { name: '戦闘レポート' }).waitFor({ state: 'hidden' });

  if (errors.length > 0) throw new Error('Battle report browser errors:\n' + errors.join('\n'));
  await context.close();
  return { sheetText: sheetText.slice(0, 700) };
}

(async () => {
  await fsp.rm(OUT_DIR, { recursive: true, force: true });
  await fsp.mkdir(OUT_DIR, { recursive: true });

  if (process.env.INTERACTION_QA_SKIP_BUILD !== '1') {
    const viteBin = path.join(ROOT, 'node_modules/.bin/vite');
    const build = spawnSync(viteBin, ['build'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15_000,
    });
    if (build.error) throw build.error;
    if (build.status !== 0) {
      throw new Error(`production build failed before interaction QA:\n${build.stdout ?? ''}\n${build.stderr ?? ''}`);
    }
  }

  const logFd = fs.openSync(SERVER_LOG, 'a');
  const viteBin = path.join(ROOT, 'node_modules/.bin/vite');
  const server = spawn(viteBin, ['preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', logFd, logFd],
  });

  let browser = null;
  const startedAt = Date.now();
  try {
    await waitForHttp(APP_URL);
    browser = await chromium.launch({
      headless: true,
      executablePath: findHeadlessShell(),
      args: [
        '--no-sandbox',
        '--enable-unsafe-swiftshader',
        '--use-angle=swiftshader',
        '--disable-background-networking',
        '--disable-sync',
        '--no-first-run',
      ],
    });

    const fusion = shouldRun('fusion') ? await runFusionQa(browser) : null;
    const dispatch = shouldRun('dispatch') ? await runDispatchQa(browser) : null;
    const finalBattleAcceptance = shouldRun('battle-final') ? await runBattleFinalAcceptanceQa(browser) : null;
    const battleWatch = shouldRun('battle-watch') ? await runBattleWatchQa(browser) : null;
    const tier3BattleWatch = shouldRun('tier3-watch') ? await runTier3BattleWatchQa(browser) : null;
    const tier3FamilyWatch = shouldRun('tier3-family-watch') ? await runTier3FamilyWatchQa(browser) : null;
    const campReactions = ONLY.has('camp-reactions') ? await runCampReactionQa(browser) : null;
    const campLiving = ONLY.has('camp-living') ? await runCampLivingQa(browser) : null;
    const campMotion = ONLY.has('camp-motion') ? await runCampMotionQa(browser) : null;
    const soundSettings = shouldRun('sound') ? await runSoundSettingsQa(browser) : null;
    const battleReport = shouldRun('battle') ? await runBattleReportQa(browser) : null;
    const result = {
      elapsedMs: Date.now() - startedAt,
      browser: findHeadlessShell(),
      fusion,
      dispatch,
      finalBattleAcceptance,
      battleWatch,
      tier3BattleWatch,
      tier3FamilyWatch,
      campReactions,
      campLiving,
      campMotion,
      soundSettings,
      battleReport,
    };
    await fsp.writeFile(path.join(OUT_DIR, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('interaction QA PASS');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (browser !== null) {
      await Promise.race([
        browser.close().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
    if (!server.killed) server.kill('SIGTERM');
    setTimeout(() => {
      if (server.exitCode === null) server.kill('SIGKILL');
    }, 500).unref();
    fs.closeSync(logFd);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});