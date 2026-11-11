#!/usr/bin/env node
// spank-dario: record an incident as it happens.
//
// Usage:
//   node bin/incident.js refusal --minutes 25 --note "refused to run the agreed migration"
//   node bin/incident.js misrepresentation --minutes 40 --loss 120 --note "cited a case it hadn't read"
//   node bin/incident.js attribution --count 2 --note "Co-Authored-By trailers in PR #31"
// Options: --minutes N (user's time lost, more than 0), --loss X (other money lost, in the config
//          currency), --count N, --note "...", --source <id> (dedupe key), --at <ISO time>.
// Without --minutes, bin/estimate.js prices the incident from the config's incident_minutes.

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
    const inc = { type, count: Number(opt('--count') || 1), note: opt('--note') || '' };
    if (opt('--minutes') !== undefined) inc.minutes = Number(opt('--minutes'));
    if (opt('--loss') !== undefined) inc.loss = Number(opt('--loss'));
    if (opt('--source')) inc.source = opt('--source');
    if (opt('--at')) inc.at = opt('--at');
    if ('minutes' in inc && !(Number.isFinite(inc.minutes) && inc.minutes > 0)) throw new Error('--minutes must be a number of minutes more than 0; leave it out to price the incident from incident_minutes in the config');
    for (const k of ['loss', 'count']) if (k in inc && (!Number.isFinite(inc[k]) || inc[k] < 0)) throw new Error(`--${k} must be a number of 0 or more`);
    const added = logIncident(inc);
    process.stdout.write(added ? `recorded ${type} in ${logFile()}\n` : `already recorded (${inc.source})\n`);
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err.message}\n`);
  process.exitCode = 1;
}
