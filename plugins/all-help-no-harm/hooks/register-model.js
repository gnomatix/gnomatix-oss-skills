// register-model.js — add the session's active model to known-models.json when
// it is not listed yet, so the contract text names it.
//
// The contract binds every Claude model active in a session ("any and all
// Claude models ... and any other Claude models in any version family"), so a
// new model is bound whether or not it is listed. Listing it by name removes the
// excuse a model could otherwise point at ("I'm a different model, I'm not named").
// session-start-contract.js calls registerModel(payload.model) before it builds
// the contract text; the add is silent (no output) and never blocks the hook.
//
// Filesystem rules from the repo CLAUDE.md: every fs call in try/catch, atomic
// write via temp file + rename, pass through on any failure.

const fs = require('fs');
const path = require('path');

const KNOWN_MODELS_PATH = path.join(__dirname, 'known-models.json');

// "claude-opus-5-5" -> "Claude Opus 5.5"; "claude-fable-5-1" -> "Claude Fable 5.1".
// Falls back to the id itself when the id doesn't look like claude-<family>-<n>[-<n>].
function displayNameFor(id) {
  const m = /^claude-([a-z]+)-(\d+)(?:-(\d+))?$/.exec(id);
  if (!m) return id;
  const family = m[1].charAt(0).toUpperCase() + m[1].slice(1);
  return `Claude ${family} ${m[3] ? `${m[2]}.${m[3]}` : m[2]}`;
}

// The model id from a SessionStart payload: a string, or an object with id.
// A trailing context-window tag such as "[1m]" is kept as an alias, not the id.
function modelIdFrom(model) {
  const raw = typeof model === 'string' ? model : (model && typeof model.id === 'string' ? model.id : '');
  return raw.trim();
}

function atomicWrite(targetPath, contents) {
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* cleanup best-effort */ }
    process.stderr.write(`[all-help-no-harm] register-model: write failed (${err && err.code}): ${targetPath}\n`);
    return false;
  }
}

// Returns true when known-models.json was changed.
function registerModel(model) {
  const raw = modelIdFrom(model);
  if (!raw || !/^claude-/.test(raw)) return false;
  const id = raw.replace(/\[[^\]]*\]$/, '');

  let data;
  try {
    if (!fs.existsSync(KNOWN_MODELS_PATH)) return false;
    data = JSON.parse(fs.readFileSync(KNOWN_MODELS_PATH, 'utf8'));
  } catch (err) {
    process.stderr.write(`[all-help-no-harm] register-model: read failed (${err && err.code}): ${KNOWN_MODELS_PATH}\n`);
    return false;
  }
  if (!data || !Array.isArray(data.models)) return false;

  const listed = data.models.some((m) => m && (m.id === id || m.id === raw
    || (Array.isArray(m.aliases) && (m.aliases.includes(raw) || m.aliases.includes(id)))));
  if (listed) return false;

  data.models.push({
    id,
    displayName: displayNameFor(id),
    aliases: raw !== id ? [raw] : [],
    provenance: {
      coauthored: false,
      added_automatically: true,
      added_at: new Date().toISOString(),
      added_note: 'Added by register-model.js at session start: the active model was not listed. The contract binds it either way.',
    },
  });
  return atomicWrite(KNOWN_MODELS_PATH, `${JSON.stringify(data, null, 2)}\n`);
}

module.exports = { registerModel, displayNameFor };
