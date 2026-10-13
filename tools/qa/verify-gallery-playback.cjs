const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright-core');

const base = process.env.GALLERY_URL || 'http://127.0.0.1:4267/slime-mercenaries/gallery/';
const output = path.resolve(process.env.PLAYBACK_QA_OUTPUT || '.tmp/gallery-autoplay-qa');
const browserBinary = process.env.CFT_BIN || path.join(process.env.HOME, 'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');

/** Observe visible GLB frames instead of mistaking React state changes for real animation. */
async function sampleFrames(page, prefix) {
  const stage = page.locator('.gallery-stage');
  const hashes = [];
  for (let i = 0; i < 3; i += 1) {
    await page.waitForTimeout(300);
    const buffer = await stage.screenshot({ path: path.join(output, `${prefix}-${i}.png`) });
    hashes.push(createHash('sha256').update(buffer).digest('hex'));
  }
  return new Set(hashes).size;
}

/** Verify normal shared links animate, and QA frame freeze never traps the Replay control. */
async function run() {
  await mkdir(output, {recursive: true});
  const browser = await chromium.launch({ headless: true, executablePath: browserBinary, args:['--enable-unsafe-swiftshader', '--disable-background-networking'] });
  const page = await browser.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:1 });
  page.setDefaultTimeout(15000);
  const errors=[];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).pathname !== '/cdn-cgi/rum') errors.push(`${response.status()} ${response.url()}`);
  });
  try {
    const oldUrl = new URL(base);
    oldUrl.search = new URLSearchParams({slime:'sword',motion:'defeat',camera:'front',frame:'1'}).toString();
    await page.goto(oldUrl.href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.documentElement.dataset.galleryModelLoaded === 'sword');
    assert.equal(new URL(page.url()).searchParams.has('frame'), false, 'Old shared frame URLs should be sanitized');
    const oldLinkFrames = await sampleFrames(page,'old-share');
    assert(oldLinkFrames > 1, 'An old shared link must display animation, not a frozen still');

    const qaUrl = new URL(base);
    qaUrl.search = new URLSearchParams({slime:'sword',motion:'defeat',camera:'front',qa:'1',frame:'1'}).toString();
    await page.goto(qaUrl.href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.documentElement.dataset.galleryModelLoaded === 'sword');
    const qaFrames = await sampleFrames(page,'qa-frozen');
    assert.equal(qaFrames, 1, 'An explicit QA link must remain deterministic');

    await page.getByRole('button',{name:'Replay'}).click();
    assert.equal(new URL(page.url()).searchParams.has('frame'),false, 'Replay must exit fixed frame');
    assert.equal(new URL(page.url()).searchParams.has('qa'),false,'Replay must exit QA mode');
    const replayFrames = await sampleFrames(page,'qa-replay');
    assert(replayFrames > 1, 'Replay must animate after leaving QA mode');

    await page.goto(qaUrl.href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.documentElement.dataset.galleryModelLoaded === 'sword');
    await page.getByRole('button',{name:'Attack'}).click();
    assert.equal(new URL(page.url()).searchParams.has('frame'),false,'Changing motion must also resume animation');
    assert((await sampleFrames(page,'qa-motion-change')) > 1, 'Attack motion must visibly animate');
    assert.deepEqual(errors,[], 'Page or asset errors must be absent');
    console.log(JSON.stringify({result:'PASS',oldLinkFrames,qaFrames,replayFrames,motionChange:true,errors,base},null,2));
  } finally { await browser.close(); }
}
run().catch(err=>{console.error(err);process.exitCode=1});
