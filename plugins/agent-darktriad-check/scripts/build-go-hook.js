// build-go-hook.js — cross-compile the Go hook for every supported platform.
//
//   node scripts/build-go-hook.js            # build hooks/bin/* for six targets
//   node scripts/build-go-hook.js --test     # go vet + go test first
//   node scripts/build-go-hook.js --host     # only the current platform
//
// KontentKop's module path is plain `kontentkop`, so Go resolves it from a
// local clone, never from the network. go.mod points at a sibling checkout
// (../../../KontentKop-Bake-Off). Set KONTENTKOP_SRC to use a clone elsewhere;
// this script then writes a temporary go.work whose replace directive wins
// over go.mod's.
//
// This is a developer build script, not a hook: it runs the Go toolchain
// through child_process with argv arrays and no shell.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN = path.resolve(__dirname, '..');
const OUT = path.join(PLUGIN, 'hooks', 'bin');
const NAME = 'agent-darktriad-check';
const TARGETS = [
  ['linux', 'amd64'], ['linux', 'arm64'],
  ['darwin', 'amd64'], ['darwin', 'arm64'],
  ['windows', 'amd64'], ['windows', 'arm64'],
];
const ARCH = { x64: 'amd64', arm64: 'arm64' };
const OS = { linux: 'linux', darwin: 'darwin', win32: 'windows' };

const args = new Set(process.argv.slice(2));
const env = Object.assign({}, process.env, { CGO_ENABLED: '0' });

let workFile = null;
const src = process.env.KONTENTKOP_SRC;
if (src) {
  const abs = path.resolve(src);
  if (!fs.existsSync(path.join(abs, 'go.mod'))) {
    console.error(`KONTENTKOP_SRC=${src}: no go.mod there`);
    process.exit(2);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-go-work-'));
  workFile = path.join(dir, 'go.work');
  fs.writeFileSync(workFile, `go 1.22\n\nuse ${JSON.stringify(PLUGIN)}\n\nreplace kontentkop => ${JSON.stringify(abs)}\n`);
  env.GOWORK = workFile;
} else if (!fs.existsSync(path.join(PLUGIN, '..', '..', '..', 'KontentKop-Bake-Off', 'go.mod'))) {
  console.error('No KontentKop clone at ../../../KontentKop-Bake-Off and KONTENTKOP_SRC is unset.');
  process.exit(2);
}

function go(goArgs, extraEnv) {
  const r = spawnSync('go', goArgs, { cwd: PLUGIN, env: Object.assign({}, env, extraEnv || {}), stdio: 'inherit', shell: false });
  if (r.error) { console.error(`go: ${r.error.message}`); process.exit(2); }
  return r.status === 0;
}

let ok = true;
try {
  if (args.has('--test')) {
    ok = go(['vet', './...']) && go(['test', './...']);
    if (!ok) process.exit(1);
  }
  const targets = args.has('--host')
    ? [[OS[process.platform], ARCH[process.arch]]]
    : TARGETS;
  fs.mkdirSync(OUT, { recursive: true });
  for (const [goos, goarch] of targets) {
    if (!goos || !goarch) { console.error(`unsupported host ${process.platform}/${process.arch}`); process.exit(2); }
    const out = path.join(OUT, `${NAME}-${goos}-${goarch}${goos === 'windows' ? '.exe' : ''}`);
    console.log(`building ${path.relative(PLUGIN, out)}`);
    if (!go(['build', '-trimpath', '-ldflags=-s -w', '-o', out, `./cmd/${NAME}`], { GOOS: goos, GOARCH: goarch })) ok = false;
  }
} finally {
  if (workFile) { try { fs.rmSync(path.dirname(workFile), { recursive: true, force: true }); } catch { /* ignore */ } }
}
process.exit(ok ? 0 : 1);
