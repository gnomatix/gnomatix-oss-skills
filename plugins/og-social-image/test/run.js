// og-social-image — automated check of the skill's documented commands.
//
//   node plugins/og-social-image/test/run.js
//
// Makes a 1408x683 sample PNG with ImageMagick, runs the cover-crop and JPEG
// steps exactly as SKILL.md gives them, and checks the result reads 1280x640
// and is under GitHub's 1 MB cap. Needs the `magick` command (ImageMagick 7).
// child_process is used here because this is a test harness, not a hook.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CAP = 1048576;
let failures = 0;

function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
}

function magick(args) {
  const r = spawnSync('magick', args, { encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`magick ${args.join(' ')} exited ${r.status}: ${r.stderr}`);
  return r.stdout.trim();
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-social-image-'));
try {
  const src = path.join(dir, 'hero.png');
  const out = path.join(dir, 'hero-og-image.jpg');

  // A rich, colourful source at the aspect ratio the skill was built on.
  magick(['-size', '1408x683', 'plasma:fractal', src]);
  check(magick(['identify', '-format', '%w %h', src]) === '1408 683', 'sample source is 1408x683');

  // SKILL.md, steps 2 and 3: cover-crop to the exact target, strip metadata, JPEG q92.
  magick([src, '-resize', '1280x640^', '-gravity', 'center', '-extent', '1280x640', '-strip', '-quality', '92', out]);

  // SKILL.md, step 4: verify dimensions and bytes before claiming done.
  check(magick(['identify', '-format', '%w %h', out]) === '1280 640', 'output reads exactly 1280x640');
  const bytes = fs.statSync(out).size;
  check(bytes > 0 && bytes < CAP, `output is under 1 MB (${bytes} bytes)`);
  check(magick(['identify', '-format', '%m', out]) === 'JPEG', 'output is a JPEG');
} catch (err) {
  check(false, `could not run the commands: ${err.message}`);
} finally {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

console.log(failures === 0 ? 'all passed' : `${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
