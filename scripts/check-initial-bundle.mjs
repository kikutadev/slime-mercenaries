import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { basename, dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(projectRoot, 'dist');
const indexPath = join(distRoot, 'index.html');
const basePrefix = '/slime-mercenaries/';
const maxInitialGzipBytes = 160 * 1024;

const html = readFileSync(indexPath, 'utf8');
const initialUrls = [
  ...html.matchAll(/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/g),
  ...html.matchAll(/<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+\.js)["'][^>]*>/g),
].map((match) => match[1]);

if (initialUrls.length === 0) {
  throw new Error('No initial JavaScript entry/modulepreload URLs were found in dist/index.html.');
}

function toDistPath(url) {
  if (!url.startsWith(basePrefix)) {
    throw new Error(`Unexpected built asset URL outside configured base: ${url}`);
  }
  return join(distRoot, url.slice(basePrefix.length));
}

function staticImports(source) {
  const imports = new Set();
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.\.?\/[^"']+\.js)["']/g)) {
    imports.add(match[1]);
  }
  return imports;
}

const queue = initialUrls.map(toDistPath);
const files = new Set();

while (queue.length > 0) {
  const file = normalize(queue.shift());
  if (files.has(file)) continue;
  files.add(file);

  const source = readFileSync(file, 'utf8');
  for (const specifier of staticImports(source)) {
    queue.push(resolve(dirname(file), specifier));
  }
}

let rawBytes = 0;
let gzipBytes = 0;
for (const file of files) {
  const source = readFileSync(file);
  rawBytes += source.byteLength;
  gzipBytes += gzipSync(source).byteLength;

  const name = basename(file);
  if (/^(?:GLTFLoader|BattleScreen|CampSlimeStage|FusionWorkbench|enemy-motion)-/.test(name)) {
    throw new Error(`3D-only chunk leaked into the initial static graph: ${name}`);
  }
  if (source.includes(Buffer.from('WebGLRenderer'))) {
    throw new Error(`Three.js WebGL renderer leaked into the initial static graph: ${name}`);
  }
}

if (gzipBytes > maxInitialGzipBytes) {
  throw new Error(
    `Initial JavaScript gzip budget exceeded: ${(gzipBytes / 1024).toFixed(1)} KiB > ${(maxInitialGzipBytes / 1024).toFixed(0)} KiB.`,
  );
}

console.log('Initial bundle guard: PASS');
console.log(
  JSON.stringify(
    {
      files: [...files].map((file) => relative(distRoot, file)).sort(),
      rawKiB: Number((rawBytes / 1024).toFixed(1)),
      gzipKiB: Number((gzipBytes / 1024).toFixed(1)),
      budgetGzipKiB: maxInitialGzipBytes / 1024,
    },
    null,
    2,
  ),
);
