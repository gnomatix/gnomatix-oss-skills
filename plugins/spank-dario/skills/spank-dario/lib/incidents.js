'use strict';
// spank-dario incident log: <XDG_STATE_HOME or ~/.local/state>/spank-dario/incidents.jsonl.
// One JSON object per line. Pure Node, no subprocesses, so the git hook can use it.
//
// Types:
//   attribution         a tool-attribution line in a commit, PR or document (count)
//   refusal             a false refusal or other non-compliance
//   misrepresentation   a false statement of fact or law the user relied on
//   refusal-candidate   a possible refusal found by the transcript scan
// Each record carries `minutes` (the user's time lost) and `loss` (other money lost) only when
// they were given. A record without them is priced from the user's `incident_minutes` config.

const fs = require('fs');
const path = require('path');
const os = require('os');

const TYPES = ['attribution', 'refusal', 'misrepresentation', 'refusal-candidate'];

function logFile() {
  const base = process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state');
  return path.join(base, 'spank-dario', 'incidents.jsonl');
}

function readIncidents() {
  let text;
  try { text = fs.readFileSync(logFile(), 'utf8'); } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return text.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// Appends one incident. A `source` key already in the log is skipped, so rescans don't double count.
function logIncident(inc) {
  if (!TYPES.includes(inc.type)) throw new Error(`unknown incident type ${inc.type}`);
  const file = logFile();
  if (inc.source && readIncidents().some(i => i.source === inc.source)) return false;
  const rec = { at: new Date().toISOString(), count: 1, ...inc };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(rec) + '\n', 'utf8');
  return true;
}

module.exports = { TYPES, logFile, readIncidents, logIncident };
