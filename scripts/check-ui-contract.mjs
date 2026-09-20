import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const src = join(root, 'src');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const cssFiles = walk(src)
  .filter((path) => path.endsWith('.css'))
  .filter((path) => !path.endsWith('/gallery/gallery.css'));

const failures = [];
const explicitPx = /font-size:\s*([0-9]+)px/g;

for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(explicitPx)) {
    const px = Number(match[1]);
    if (px < 10) failures.push(`${relative(root, file)} uses ${px}px text`);
  }

  if (!file.endsWith('/styles/tokens.css') && /env\(safe-area-inset-(?:top|bottom)\)/.test(source)) {
    failures.push(`${relative(root, file)} bypasses safe-area design tokens`);
  }

  if (file.endsWith('.module.css')) {
    const lines = source.split('\n').length;
    if (lines > 1200) failures.push(`${relative(root, file)} is ${lines} lines; split the screen/component module`);
  }
}

const tokens = readFileSync(join(src, 'styles/tokens.css'), 'utf8');
if (!/--touch-target-min:\s*44px/.test(tokens)) failures.push('touch target token must remain 44px');
if (!/--safe-area-top:\s*env\(safe-area-inset-top\)/.test(tokens)) failures.push('top safe-area token is missing');
if (!/--safe-area-bottom:\s*env\(safe-area-inset-bottom\)/.test(tokens)) failures.push('bottom safe-area token is missing');
if (!/--screen-bottom-reserve:/.test(tokens)) failures.push('screen bottom reserve token is missing');

if (failures.length) {
  console.error('UI production contract: FAIL');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('UI production contract: PASS');
console.log(JSON.stringify({
  cssFiles: cssFiles.map((file) => relative(root, file)).sort(),
  minimumTextPx: 10,
  touchTargetPx: 44,
  safeArea: 'centralized',
}, null, 2));
