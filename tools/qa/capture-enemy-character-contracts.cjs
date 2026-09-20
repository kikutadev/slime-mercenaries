const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const CHARACTER_IDS = [
  'tiny-mushroom','plump-mushroom','spore-mushroom','great-mushroom',
  'leafling','whirl-leaf','bud-bloom','puff-flower','round-hedgehog','acorn-squirrel',
  'crystal-beetle','drill-nose-mole','crystal-bat','pebble-golem','amber-turtle',
  'puff-frog','marsh-sprout','bubble-snail','skimming-lily','great-marsh-frog',
  'snow-roller','ice-bug','scarf-snowman','icicle-lantern','snow-statue-guardian',
  'ember-gecko','charcoal-roller','crackle-bug','magma-crab','furnace-turtle',
];

const ATTACK_FRAME_U = {
  'tiny-mushroom':0.57,'plump-mushroom':0.60,'spore-mushroom':0.50,'great-mushroom':0.78,
  'leafling':0.56,'whirl-leaf':0.44,'bud-bloom':0.62,'puff-flower':0.58,
  'round-hedgehog':0.49,'acorn-squirrel':0.58,'crystal-beetle':0.54,'drill-nose-mole':0.60,
  'crystal-bat':0.62,'pebble-golem':0.60,'amber-turtle':0.70,'puff-frog':0.78,
  'marsh-sprout':0.60,'bubble-snail':0.56,'skimming-lily':0.50,'great-marsh-frog':0.80,
  'snow-roller':0.64,'ice-bug':0.50,'scarf-snowman':0.64,'icicle-lantern':0.56,'snow-statue-guardian':0.80,
  'ember-gecko':0.78,'charcoal-roller':0.70,'crackle-bug':0.64,'magma-crab':0.63,'furnace-turtle':0.84,
};

const DEFEAT_FRAME_U = {
  'tiny-mushroom':0.72,'plump-mushroom':0.72,'spore-mushroom':0.72,'great-mushroom':0.80,
  'leafling':0.72,'whirl-leaf':0.72,'bud-bloom':0.72,'puff-flower':0.72,
  'round-hedgehog':0.72,'acorn-squirrel':0.72,'crystal-beetle':0.72,'drill-nose-mole':0.72,
  'crystal-bat':0.72,'pebble-golem':0.72,'amber-turtle':0.78,'puff-frog':0.72,
  'marsh-sprout':0.72,'bubble-snail':0.76,'skimming-lily':0.72,'great-marsh-frog':0.76,
  'snow-roller':0.72,'ice-bug':0.72,'scarf-snowman':0.76,'icicle-lantern':0.72,'snow-statue-guardian':0.78,
  'ember-gecko':0.76,'charcoal-roller':0.76,'crackle-bug':0.74,'magma-crab':0.76,'furnace-turtle':0.80,
};

const baseUrl = process.env.ENEMY_GALLERY_URL || 'http://127.0.0.1:4183/slime-mercenaries/gallery/';
const outputDir = path.resolve(process.env.ENEMY_QA_OUTPUT || '.tmp/enemy-character-contracts');

(async()=>{
  await fs.mkdir(outputDir,{recursive:true});
  const browser = await chromium.launch({
    headless:true,
    executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args:['--enable-unsafe-swiftshader','--disable-background-networking','--disable-sync','--no-first-run'],
  });
  const page=await browser.newPage({viewport:{width:520,height:900},deviceScaleFactor:1});
  page.setDefaultTimeout(12000);
  const metrics = {};

  async function open(id,motion,camera){
    const url=new URL(baseUrl);
    url.searchParams.set('slime',id);
    url.searchParams.set('motion',motion);
    url.searchParams.set('camera',camera);
    url.searchParams.set('speed','1');
    await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(
      expected=>document.documentElement.dataset.galleryModelLoaded===expected,
      id,
    );
    const stage=page.locator('.gallery-stage');
    if((await stage.getAttribute('data-enemy-id'))!==id) throw new Error(`${id}: wrong Gallery stage`);
    await page.getByRole('button',{name:'Replay',exact:true}).click();
    return stage;
  }

  try {
    for(const id of CHARACTER_IDS){
      let stage=await open(id,'idle','inspection');
      await page.waitForTimeout(320);
      await stage.screenshot({path:path.join(outputDir,`${id}-idle.png`)});
      const idleWidth = Number(await page.locator('html').getAttribute('data-gallery-model-screen-width'));
      const idleHeight = Number(await page.locator('html').getAttribute('data-gallery-model-screen-height'));
      if (!(idleWidth > 0) || !(idleHeight > 0)) throw new Error(`${id}: missing projected idle occupancy`);
      metrics[id] = { idle: { width: idleWidth, height: idleHeight } };

      stage=await open(id,'attack','gameplay');
      const attackDuration=Number(await stage.getAttribute('data-attack-duration'));
      if(!(attackDuration>0)) throw new Error(`${id}: missing attack duration`);
      const attackWait=Math.round(attackDuration*ATTACK_FRAME_U[id]*1000);
      await page.waitForTimeout(attackWait);
      await stage.screenshot({path:path.join(outputDir,`${id}-attack.png`)});

      stage=await open(id,'defeat','gameplay');
      const defeatDuration=Number(await stage.getAttribute('data-defeat-duration'));
      if(!(defeatDuration>0)) throw new Error(`${id}: missing defeat duration`);
      const defeatWait=Math.round(defeatDuration*DEFEAT_FRAME_U[id]*1000);
      await page.waitForTimeout(defeatWait);
      await stage.screenshot({path:path.join(outputDir,`${id}-defeat.png`)});

      console.log(`${id}\tattack=${attackWait}ms\tdefeat=${defeatWait}ms\toccupancy=${idleWidth.toFixed(3)}x${idleHeight.toFixed(3)}`);
    }
    await fs.writeFile(path.join(outputDir, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});