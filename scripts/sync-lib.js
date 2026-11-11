// Sync canonical root lib/ modules into self-contained plugin directories.
//
// Each plugin distributes as an independent unit (Claude Code plugin cache or copied folder),
// so shared zero-dependency Node helpers live canonically in root `lib/` and are vendored as
// identical copies into the plugins that import them at runtime.
//
//   node scripts/sync-lib.js          write synced copies
//   node scripts/sync-lib.js --check  exit 1 if any synced copy is missing or out of date

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK_ONLY = process.argv.includes('--check');

const TARGETS = [
  { src: 'lib/fs-safe.js', dest: 'plugins/gnox/hooks/lib/fs-safe.js' },
  { src: 'lib/gnox-discovery.js', dest: 'plugins/gnox/hooks/lib/gnox-discovery.js' },
  { src: 'lib/fs-safe.js', dest: 'plugins/skill-vv/lib/fs-safe.js' },
  { src: 'lib/gnox-discovery.js', dest: 'plugins/skill-vv/lib/gnox-discovery.js' },
];

const BANNER_PREFIX = '// GENERATED COPY — DO NOT EDIT DIRECTLY.\n';

function expectedContents(srcRel) {
  const srcPath = path.join(ROOT, srcRel);
  const raw = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
  return `${BANNER_PREFIX}// Source: ${srcRel} (sync with: node scripts/sync-lib.js)\n\n${raw}`;
}

let changes = 0;

for (const item of TARGETS) {
  const expected = expectedContents(item.src);
  const destPath = path.join(ROOT, item.dest);
  let current = null;
  try {
    current = fs.readFileSync(destPath, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    current = null;
  }
  if (current !== expected) {
    changes += 1;
    if (CHECK_ONLY) {
      console.error(`sync-lib: out of date: ${item.dest} (from ${item.src})`);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, expected, 'utf8');
      console.log(`sync-lib: synced ${item.dest}`);
    }
  }
}

if (CHECK_ONLY) {
  if (changes > 0) {
    console.error(`sync-lib: ${changes} file(s) out of sync; run: node scripts/sync-lib.js`);
    process.exit(1);
  }
  console.log(`0 change(s); ${TARGETS.length} synced lib file(s) verified`);
} else {
  console.log(`sync-lib: ${changes} change(s) applied across ${TARGETS.length} target(s)`);
}
