const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');
const ids = [
 'sword','fighter','blademaster','berserker','shield','guardian','paladin','fortress',
 'bow','ranger','sniper','storm-archer','wand','mage','archmage','frost-mage',
 'dagger','rogue','ninja','assassin','gun','gunner','cannoneer','engineer','greatsword'
];
const frames = (process.env.FRAMES || '0.12,0.35,0.56,0.72,0.91').split(',').map(Number);
const base = process.env.GALLERY_URL || 'http://127.0.0.1:4265/slime-mercenaries/gallery/';
const motion = process.env.MOTION || 'attack';
const camera = process.env.CAMERA || 'gameplay';
const dir = path.resolve(process.env.OUTPUT_DIR || '.tmp/slime-motion-full-qa');

/** Capture reproducible attack phases using the actual gallery render, not a pose mock. */
async function main(){
 await fs.mkdir(dir,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:path.join(process.env.HOME,'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),args:['--enable-unsafe-swiftshader','--disable-background-networking']});
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 p.setDefaultTimeout(18000);
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 p.on('response',r=>{if(r.status()>=400 && new URL(r.url()).pathname!=='/cdn-cgi/rum')errors.push(`${r.status()} ${r.url()}`)});
 try {
 for(const id of ids.slice(Number(process.env.FROM || 0),Number(process.env.TO || ids.length))){
   const url=new URL(base);
   url.search=new URLSearchParams({slime:id,motion,speed:'1',camera,qa:'1',frame:String(frames[0])}).toString();
   await p.goto(url.href,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(id=>document.documentElement.dataset.galleryModelLoaded===id,id);
   const stage=p.locator('.gallery-stage');
   for(let i=0;i<frames.length;i++){
     if(i>0)await p.evaluate(frame=>{const q=new URL(window.location.href);q.searchParams.set('frame',String(frame));history.replaceState(null,'',q.href)},frames[i]);
     await p.waitForTimeout(105);
     await stage.screenshot({path:path.join(dir,`${id}-phase-${i}.png`)});
   }
   console.log(id, frames.length, motion, 'phases');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile(path.join(dir,'result.json'),JSON.stringify({ids:ids.length,frames,errors},null,2));
 } finally {await b.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
