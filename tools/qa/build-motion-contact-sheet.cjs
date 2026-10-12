const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');
const ids = [
  'sword','fighter','blademaster','berserker','shield','guardian','paladin','fortress',
  'bow','ranger','sniper','storm-archer','wand','mage','archmage','frost-mage',
  'dagger','rogue','ninja','assassin','gun','gunner','cannoneer','engineer','greatsword'
];
const full = process.env.FULL === '1';
const folder=path.resolve(process.env.SOURCE_DIR || (full ? '.tmp/slime-motion-full-qa' : '.tmp/slime-motion-matrix'));
const selected=process.env.FAMILY ? ids.slice(Number(process.env.FAMILY)*4, Number(process.env.FAMILY)*4+4) : ids;
const overview=!process.env.FAMILY;

/** Build local picture contact sheets; every card is a real browser screenshot, never a mock. */
async function main(){
 const rows = overview ? selected.map(id=>({id,types:[full ? 'phase-2' : 'release']})) : selected.map(id=>({id,types:full ? ['phase-0','phase-1','phase-2','phase-3','phase-4'] : ['windup','release','follow']}));
 const cards=rows.map(({id,types})=>`<div class="row"><div class="id">${id}</div><div class="shots">${types.map(t=>`<img src="${id}-${t}.png" alt="${id} ${t}">`).join('')}</div></div>`).join('');
 const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#fff;font-family:Arial}.grid{display:grid;grid-template-columns:${overview?'repeat(5,1fr)':'1fr'};gap:10px}.row{background:#f5f7f2;border:1px solid #cbd2cd;border-radius:10px;padding:5px}.id{font-size:${overview?15:19}px;font-weight:700;padding:3px 8px}.shots{display:flex;gap:5px}.shots img{display:block;min-width:0;width:${overview?'100%':'33.333%'};object-fit:contain}</style></head><body><div class="grid">${cards}</div></body></html>`;
 const file=path.join(folder,overview?'overview.html':`family-${process.env.FAMILY}.html`);
 await fs.writeFile(file,html);
 const b=await chromium.launch({headless:true,executablePath:path.join(process.env.HOME,'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')});
 try{const p=await b.newPage({viewport:{width:overview?1250:1140,height:920},deviceScaleFactor:1});
 await p.goto('file://'+file,{waitUntil:'load'});
 await p.evaluate(()=>Promise.all(Array.from(document.images,im=>im.decode())));
 const out=path.join(folder,overview?'overview.png':`family-${process.env.FAMILY}.png`);
 await p.screenshot({path:out,fullPage:true});console.log(out);
 } finally{await b.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
