const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const ids = [
  'sword', 'fighter', 'blademaster', 'berserker',
  'shield', 'guardian', 'paladin', 'fortress',
  'bow', 'ranger', 'sniper', 'storm-archer',
  'wand', 'mage', 'archmage', 'frost-mage',
  'dagger', 'rogue', 'ninja', 'assassin',
  'gun', 'gunner', 'cannoneer', 'engineer',
  'greatsword',
];
const selected = ids.slice(Number(process.env.FROM ?? 0), Number(process.env.TO ?? ids.length));
const base = process.env.GALLERY_URL || 'http://127.0.0.1:4265/slime-mercenaries/gallery/';
const dir = path.resolve(process.env.OUTPUT_DIR || '.tmp/slime-motion-matrix');

/** Inspect actual GLB/motion frames at gameplay phone scale; a file is not proof until inspected. */
async function main() {
  await fs.mkdir(dir, {recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:path.join(process.env.HOME,'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),args:['--enable-unsafe-swiftshader','--disable-background-networking']});
  const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  page.setDefaultTimeout(13000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400 && new URL(r.url()).pathname!=='/cdn-cgi/rum')errors.push(`${r.status()} ${r.url()}`)});
  try {
    for(const id of selected){
      const url=new URL(base);
      url.search=new URLSearchParams({slime:id,motion:'attack',speed:'0.5',camera:'gameplay'}).toString();
      await page.goto(url.href,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(id=>document.documentElement.dataset.galleryModelLoaded===id,id,{timeout:13000});
      const stage=page.locator('.gallery-stage');
      await page.waitForTimeout(260);
      await stage.screenshot({path:path.join(dir,`${id}-windup.png`)});
      await page.waitForTimeout(460);
      await stage.screenshot({path:path.join(dir,`${id}-release.png`)});
      await page.waitForTimeout(510);
      await stage.screenshot({path:path.join(dir,`${id}-follow.png`)});
      console.log(id, 'rendered', errors.length?'errors='+errors.length:'OK');
    }
    await fs.writeFile(path.join(dir,'errors.json'),JSON.stringify(errors,null,2));
    if(errors.length)throw Error(JSON.stringify(errors));
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1});