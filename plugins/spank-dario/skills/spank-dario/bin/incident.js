#!/usr/bin/env node
// spank-dario: record an incident as it happens.
//
// Usage:
//   node bin/incident.js refusal --minutes 25 --note "refused to run the agreed migration"
//   node bin/incident.js misrepresentation --minutes 40 --loss 120 --note "cited a case it hadn't read"
//   node bin/incident.js attribution --count 2 --note "Co-Authored-By trailers in PR #31"
// Options: --minutes N (user's time lost), --loss X (other money lost, in the config currency),
//          --count N, --note "...", --source <id> (dedupe key), --at <ISO time>.

'use strict';
const path = require('path');
const { logIncident, logFile, TYPES } = require(path.join(__dirname, '..', 'lib', 'incidents.js'));

function opt(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

try {
  const type = process.argv[2];
  if (!TYPES.includes(type) || type === 'refusal-candidate') {
    process.stderr.write('usage: incident.js refusal|misrepresentation|attribution [--minutes N] [--loss X] [--count N] [--note "..."]\n');
    process.exitCode = 2;
  } else {
    const inc = { type, minutes: Number(opt('--minutes') || 0), loss: Number(opt('--loss') || 0), count: Number(opt('--count') || 1), note: opt('--note') || '' };
    if (opt('--source')) inc.source = opt('--source');
    if (opt('--at')) inc.at = opt('--at');
    for (const k of ['minutes', 'loss', 'count']) if (!Number.isFinite(inc[k]) || inc[k] < 0) throw new Error(`--${k} must be a number of 0 or more`);
    const added = logIncident(inc);
    process.stdout.write(added ? `recorded ${type} in ${logFile()}\n` : `already recorded (${inc.source})\n`);
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err.message}\n`);
  process.exitCode = 1;
}
