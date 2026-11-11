#!/usr/bin/env node
// gnox:local-config-wizard — Non-LLM post-install configuration wizard, updater,
// validator, and `mise doctor` / `brew doctor`-style diagnostics runner.
//
// Executes declarative per-plugin `config/wizard.json` manifests (`schema: "gnox-wizard/v1"`,
// modeled on Charmbracelet's `huh` Form -> Group -> Field dialogue-chaining model).
// Interactive execution uses Charmbracelet `gum` TUI when installed (`mise use -g gum`),
// falling back cleanly to pure-Node `readline` on TTY, or `--answers` / `--non-interactive`
// for scripted CI and Charmbracelet `vhs` `.tape` runs.
//
// Subcommands:
//   node local-config-wizard.js doctor   [--repo <dir>] [--plugin <name>] [--json]
//   node local-config-wizard.js list     [--repo <dir>] [--json]
//   node local-config-wizard.js run      [<plugin>] [--repo <dir>] [--answers <json|path>] [--non-interactive] [--overwrite] [--ui auto|gum|readline] [--json]
//   node local-config-wizard.js validate [<plugin>] [--repo <dir>] [--json]

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const DEFAULT_MARKETPLACE_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..');

function safeExists(p) {
  try { return typeof p === 'string' && p.length > 0 && fs.existsSync(p); } catch { return false; }
}

function safeReadText(p) {
  try { return safeExists(p) ? fs.readFileSync(p, 'utf8') : null; } catch { return null; }
}

function safeReadJson(p) {
  const raw = safeReadText(p);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function atomicWrite(targetPath, contents) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, contents, 'utf8');
    fs.renameSync(tmp, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* cleanup */ }
    throw err;
  }
}

function probeBinary(bin, args = ['--version']) {
  const cmd = process.platform === 'win32' && !bin.endsWith('.exe') ? bin : bin;
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    timeout: 4000,
    windowsHide: true,
    shell: process.platform === 'win32'
  });
  if (r.error || r.status !== 0) {
    return { available: false, version: null };
  }
  const firstLine = String(r.stdout || r.stderr || '').split(/\r?\n/).map((s) => s.trim()).find(Boolean) || 'available';
  return { available: true, version: firstLine };
}

function detectOrgContext(repoRoot) {
  if (process.env.GNOX_ASSUME_EXTERNAL_USER === '1' || process.env.UPDATE_README_IMAGES_ASSUME_EXTERNAL_USER === '1') {
    return { isGnomatixInternal: false, reason: 'forced-external-env', user: 'external-user', email: '', remote: '' };
  }
  let user = '';
  try { user = os.userInfo().username || ''; } catch { user = process.env.USER || process.env.USERNAME || ''; }
  let email = '';
  let remote = '';
  const gitEmail = spawnSync('git', ['-C', repoRoot, 'config', 'user.email'], { encoding: 'utf8', timeout: 3000, windowsHide: true });
  if (gitEmail.status === 0) email = String(gitEmail.stdout || '').trim();
  const gitRemote = spawnSync('git', ['-C', repoRoot, 'remote', 'get-url', 'origin'], { encoding: 'utf8', timeout: 3000, windowsHide: true });
  if (gitRemote.status === 0) remote = String(gitRemote.stdout || '').trim();

  const lowerUser = user.toLowerCase();
  const lowerEmail = email.toLowerCase();
  const lowerRemote = remote.toLowerCase();
  const isInternal =
    lowerUser === 'brett' ||
    lowerEmail.endsWith('@gnomatix.com') ||
    lowerEmail === 'brettwhitty@gmail.com' ||
    lowerRemote.includes('gnomatix/');

  return {
    isGnomatixInternal: isInternal,
    reason: isInternal ? 'matched-gnomatix-identity-or-remote' : 'external-user-and-remote',
    user,
    email,
    remote
  };
}

function resolveMarketplaceRoot(repoRoot) {
  if (safeExists(path.join(repoRoot, '.claude-plugin', 'marketplace.json')) && safeExists(path.join(repoRoot, 'plugins'))) {
    return repoRoot;
  }
  if (safeExists(path.join(DEFAULT_MARKETPLACE_ROOT, 'plugins'))) {
    return DEFAULT_MARKETPLACE_ROOT;
  }
  return repoRoot;
}

function discoverWizards(marketplaceRoot) {
  const pluginsDir = path.join(marketplaceRoot, 'plugins');
  if (!safeExists(pluginsDir)) return [];
  let entries = [];
  try { entries = fs.readdirSync(pluginsDir, { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const wizPath = path.join(pluginsDir, e.name, 'config', 'wizard.json');
    if (!safeExists(wizPath)) continue;
    const manifest = safeReadJson(wizPath);
    if (manifest) {
      out.push({
        plugin: e.name,
        wizardPath: wizPath,
        pluginRoot: path.join(pluginsDir, e.name),
        manifest
      });
    }
  }
  return out.sort((a, b) => a.plugin.localeCompare(b.plugin));
}

// ─── Charmbracelet `huh`-Compatible Condition & Validation Evaluators ──────

function evalWhen(whenSpec, answers) {
  if (!whenSpec || typeof whenSpec !== 'object') return true;
  const val = answers[whenSpec.field];
  if (Object.prototype.hasOwnProperty.call(whenSpec, 'equals')) {
    return val === whenSpec.equals;
  }
  if (Object.prototype.hasOwnProperty.call(whenSpec, 'not_equals')) {
    return val !== whenSpec.not_equals;
  }
  if (Array.isArray(whenSpec.in)) {
    return whenSpec.in.includes(val);
  }
  if (whenSpec.truthy === true) {
    return Boolean(val);
  }
  if (whenSpec.falsy === true) {
    return !val;
  }
  return true;
}

function expandVars(templateStr, vars) {
  if (typeof templateStr !== 'string') return '';
  return templateStr.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key) && vars[key] !== undefined && vars[key] !== null) {
      const v = vars[key];
      return Array.isArray(v) ? v.join(', ') : String(v);
    }
    return '';
  });
}

function validateFieldValue(field, value) {
  const errors = [];
  const v = field.validate || {};
  if (v.required) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors.push(`Field "${field.key}" is required.`);
    }
  }
  if (typeof value === 'string' && value.length > 0 && v.regex) {
    const re = new RegExp(v.regex);
    if (!re.test(value)) {
      errors.push(v.message || `Field "${field.key}" value "${value}" does not match ${v.regex}.`);
    }
  }
  if (field.type === 'select' && Array.isArray(field.options) && value !== undefined && value !== '') {
    const allowed = field.options.map((o) => (typeof o === 'object' ? o.value : o));
    if (!allowed.includes(value)) {
      errors.push(`Field "${field.key}" value "${value}" is not one of [${allowed.join(', ')}].`);
    }
  }
  return errors;
}

function validateWizardSchema(manifest, wizardPath) {
  const issues = [];
  if (!manifest || typeof manifest !== 'object') {
    return [`${wizardPath}: invalid JSON object`];
  }
  if (manifest.schema !== 'gnox-wizard/v1') {
    issues.push(`${wizardPath}: unsupported schema "${manifest.schema}" (expected "gnox-wizard/v1")`);
  }
  if (!manifest.plugin || typeof manifest.plugin !== 'string') {
    issues.push(`${wizardPath}: missing string "plugin"`);
  }
  if (!Array.isArray(manifest.groups) || manifest.groups.length === 0) {
    issues.push(`${wizardPath}: "groups" must be a non-empty array (Charmbracelet huh Form -> Group -> Field model)`);
  } else {
    const validTypes = new Set(['note', 'input', 'text', 'select', 'multiselect', 'confirm']);
    for (const g of manifest.groups) {
      if (!g.id || !Array.isArray(g.fields)) {
        issues.push(`${wizardPath}: group missing "id" or "fields" array`);
        continue;
      }
      for (const f of g.fields) {
        if (!f.type || !validTypes.has(f.type)) {
          issues.push(`${wizardPath}: group "${g.id}" field "${f.key || '?'}" has invalid type "${f.type}"`);
        }
        if (f.type !== 'note' && !f.key) {
          issues.push(`${wizardPath}: non-note field in group "${g.id}" missing "key"`);
        }
      }
    }
  }
  return issues;
}

// ─── Non-LLM Prompt Drivers (Charmbracelet `gum` TUI + Node `readline`) ───

function promptWithGum(field, defaultVal) {
  if (field.type === 'note') {
    spawnSync('gum', ['style', '--border', 'rounded', '--padding', '0 1', `${field.title || ''}\n${field.description || ''}`], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    return undefined;
  }
  if (field.type === 'confirm') {
    const args = ['confirm', field.title || field.key];
    if (defaultVal === true) args.push('--default=true');
    if (defaultVal === false) args.push('--default=false');
    const r = spawnSync('gum', args, { stdio: 'inherit', shell: process.platform === 'win32' });
    return r.status === 0;
  }
  if (field.type === 'select' || field.type === 'multiselect') {
    const opts = (field.options || []).map((o) => (typeof o === 'object' ? o.value : String(o)));
    const args = ['choose', '--header', field.title || field.key];
    if (field.type === 'multiselect') args.push('--no-limit');
    args.push(...opts);
    const r = spawnSync('gum', args, {
      stdio: ['inherit', 'pipe', 'inherit'],
      encoding: 'utf8',
      shell: process.platform === 'win32'
    });
    const out = String(r.stdout || '').trim();
    if (field.type === 'multiselect') return out ? out.split(/\r?\n/).filter(Boolean) : [];
    return out || defaultVal;
  }
  if (field.type === 'text') {
    const args = ['write', '--header', field.title || field.key, '--value', String(defaultVal || '')];
    const r = spawnSync('gum', args, {
      stdio: ['inherit', 'pipe', 'inherit'],
      encoding: 'utf8',
      shell: process.platform === 'win32'
    });
    return String(r.stdout || '').trim() || defaultVal;
  }
  // input
  const args = ['input', '--header', field.title || field.key, '--value', String(defaultVal || '')];
  if (field.placeholder) args.push('--placeholder', field.placeholder);
  const r = spawnSync('gum', args, {
    stdio: ['inherit', 'pipe', 'inherit'],
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  return String(r.stdout || '').trim() || defaultVal;
}

function askQuestion(rl, promptText) {
  return new Promise((resolve) => rl.question(promptText, (ans) => resolve(ans)));
}

async function promptWithReadline(rl, field, defaultVal) {
  if (field.type === 'note') {
    process.stdout.write(`\n=== ${field.title || 'Note'} ===\n${field.description || ''}\n\n`);
    return undefined;
  }
  if (field.type === 'confirm') {
    const hint = defaultVal ? 'Y/n' : 'y/N';
    const raw = (await askQuestion(rl, `${field.title || field.key} [${hint}]: `)).trim().toLowerCase();
    if (!raw) return Boolean(defaultVal);
    return raw === 'y' || raw === 'yes' || raw === 'true';
  }
  if (field.type === 'select' || field.type === 'multiselect') {
    const opts = (field.options || []).map((o) => (typeof o === 'object' ? o : { label: String(o), value: String(o) }));
    process.stdout.write(`\n${field.title || field.key}:\n`);
    opts.forEach((o, idx) => {
      process.stdout.write(`  ${idx + 1}) ${o.label || o.value} (${o.value})\n`);
    });
    const raw = (await askQuestion(rl, `Select ${field.type === 'multiselect' ? 'comma-separated numbers' : 'number'} [default: ${defaultVal || opts[0]?.value || ''}]: `)).trim();
    if (!raw) return field.type === 'multiselect' ? (Array.isArray(defaultVal) ? defaultVal : []) : (defaultVal || opts[0]?.value);
    if (field.type === 'multiselect') {
      return raw.split(',').map((s) => {
        const idx = Number(s.trim()) - 1;
        return opts[idx] ? opts[idx].value : s.trim();
      }).filter(Boolean);
    }
    const idx = Number(raw) - 1;
    return opts[idx] ? opts[idx].value : raw;
  }
  const raw = (await askQuestion(rl, `${field.title || field.key}${defaultVal !== undefined && defaultVal !== '' ? ` [${defaultVal}]` : ''}: `)).trim();
  return raw || defaultVal;
}

// ─── Wizard Runner ──────────────────────────────────────────────────────────

async function runWizard(wizEntry, repoRoot, options = {}) {
  const schemaErrors = validateWizardSchema(wizEntry.manifest, wizEntry.wizardPath);
  if (schemaErrors.length > 0) {
    throw new Error(`Invalid wizard manifest:\n  ${schemaErrors.join('\n  ')}`);
  }

  const preset = options.answers || {};
  const answers = {
    repo_name: path.basename(repoRoot),
    ...preset
  };

  const gumProbe = probeBinary('gum', ['--version']);
  const uiMode = options.nonInteractive
    ? 'non-interactive'
    : options.ui === 'gum'
      ? 'gum'
      : options.ui === 'readline'
        ? 'readline'
        : gumProbe.available && process.stdin.isTTY
          ? 'gum'
          : process.stdin.isTTY
            ? 'readline'
            : 'non-interactive';

  const rl = uiMode === 'readline' ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
  const fieldErrors = [];

  try {
    for (const group of wizEntry.manifest.groups) {
      if (!evalWhen(group.when, answers)) continue;
      for (const field of group.fields) {
        if (!evalWhen(field.when, answers)) continue;
        if (field.type === 'note') {
          if (uiMode === 'gum') promptWithGum(field);
          else if (uiMode === 'readline') await promptWithReadline(rl, field);
          continue;
        }
        const rawDefault = typeof field.default === 'string' ? expandVars(field.default, answers) : field.default;
        let val;
        if (Object.prototype.hasOwnProperty.call(preset, field.key)) {
          val = preset[field.key];
        } else if (uiMode === 'non-interactive') {
          val = rawDefault;
        } else if (uiMode === 'gum') {
          val = promptWithGum(field, rawDefault);
        } else {
          val = await promptWithReadline(rl, field, rawDefault);
        }
        answers[field.key] = val;
        fieldErrors.push(...validateFieldValue(field, val));
      }
    }
  } finally {
    if (rl) rl.close();
  }

  if (fieldErrors.length > 0) {
    throw new Error(`Wizard validation failed:\n  ${fieldErrors.join('\n  ')}`);
  }

  const writtenFiles = [];
  const skippedFiles = [];
  for (const outSpec of wizEntry.manifest.outputs || []) {
    if (!evalWhen(outSpec.when, answers)) continue;
    const relOut = expandVars(outSpec.path, answers);
    const absOut = path.resolve(repoRoot, relOut);
    if (safeExists(absOut) && !options.overwrite) {
      skippedFiles.push({ path: relOut, reason: 'already_exists_use_overwrite' });
      continue;
    }
    let content = '';
    if (outSpec.format === 'json' && outSpec.json_template) {
      const rendered = JSON.parse(expandVars(JSON.stringify(outSpec.json_template), answers));
      content = JSON.stringify(rendered, null, 2) + '\n';
    } else if (Array.isArray(outSpec.lines)) {
      content = outSpec.lines.map((line) => expandVars(line, answers)).join('\n') + '\n';
    } else if (typeof outSpec.template === 'string') {
      content = expandVars(outSpec.template, answers);
    }
    atomicWrite(absOut, content);
    writtenFiles.push(relOut);
  }

  return {
    plugin: wizEntry.plugin,
    schema: wizEntry.manifest.schema,
    ui_driver: uiMode,
    answers,
    written_files: writtenFiles,
    skipped_files: skippedFiles
  };
}

// ─── Doctor & Sanity Validator (`mise doctor` / `brew doctor` style) ───────

function runDoctor(repoRoot, options = {}) {
  const marketplaceRoot = resolveMarketplaceRoot(repoRoot);
  const org = detectOrgContext(repoRoot);
  const tools = {
    node: { required: true, ...probeBinary(process.execPath, ['--version']) },
    git: { required: true, ...probeBinary('git', ['--version']) },
    mise: { required: false, install_hint: 'winget install jdx.mise  # or https://mise.jdx.dev', ...probeBinary('mise', ['--version']) },
    gum: { required: false, install_hint: 'mise use -g gum', ...probeBinary('gum', ['--version']) },
    magick: { required: false, install_hint: 'mise use -g imagemagick', ...probeBinary('magick', ['-version']) },
    bd: { required: false, install_hint: 'mise use -g github:steveyegge/beads', ...probeBinary('bd', ['--version']) },
    gh: { required: false, install_hint: 'mise use -g gh', ...probeBinary('gh', ['--version']) }
  };

  const checks = [];
  for (const [name, info] of Object.entries(tools)) {
    checks.push({
      id: `tool:${name}`,
      severity: info.available ? 'ok' : (info.required ? 'error' : 'info'),
      summary: info.available ? `${name}: ${info.version}` : `${name}: not installed${info.install_hint ? ` (optional — install via \`${info.install_hint}\`)` : ''}`
    });
  }

  // Project mise.toml configuration check
  const miseCfgPath = [
    path.join(repoRoot, 'mise.toml'),
    path.join(repoRoot, '.mise.toml'),
    path.join(repoRoot, '.config', 'mise', 'mise.toml')
  ].find((p) => safeExists(p));
  checks.push({
    id: 'mise-config:repo',
    severity: 'info',
    summary: miseCfgPath
      ? `Declarative mise config present at ${miseCfgPath}`
      : 'No repository mise.toml found (optional — see deps/README.md for mise setup)'
  });

  const wizards = discoverWizards(marketplaceRoot)
    .filter((w) => !options.plugin || w.plugin === options.plugin);

  for (const w of wizards) {
    const schemaIssues = validateWizardSchema(w.manifest, w.wizardPath);
    checks.push({
      id: `wizard-schema:${w.plugin}`,
      severity: schemaIssues.length === 0 ? 'ok' : 'error',
      summary: schemaIssues.length === 0
        ? `${w.plugin}: valid wizard manifest (${w.manifest.schema}, ${w.manifest.groups.length} group(s))`
        : `${w.plugin}: ${schemaIssues.join('; ')}`
    });

    for (const dc of w.manifest.doctor_checks || []) {
      if (dc.type === 'any_file_exists') {
        const found = (dc.candidates || []).find((rel) => safeExists(path.resolve(repoRoot, rel)));
        if (found) {
          checks.push({
            id: `${w.plugin}:${dc.id}`,
            severity: 'ok',
            summary: `${w.plugin} [${dc.id}]: project-specific config active at ${found}`
          });
        } else {
          const sev = !org.isGnomatixInternal && dc.warn_when_external_fallback ? 'warn' : 'info';
          checks.push({
            id: `${w.plugin}:${dc.id}`,
            severity: sev,
            summary: `${w.plugin} [${dc.id}]: using bundled gnomatix-oss-skills fallback${!org.isGnomatixInternal ? ` — run \`node plugins/gnox/scripts/local-config-wizard.js run ${w.plugin}\` for Interactive Design Mode` : ''}`,
            remediation: `node plugins/gnox/scripts/local-config-wizard.js run ${w.plugin}`
          });
        }
      }
    }
  }

  const errors = checks.filter((c) => c.severity === 'error').length;
  const warnings = checks.filter((c) => c.severity === 'warn').length;

  return {
    status: errors > 0 ? 'error' : (warnings > 0 ? 'warn' : 'ok'),
    repo_root: repoRoot,
    marketplace_root: marketplaceRoot,
    org_context: org,
    errors,
    warnings,
    wizards_discovered: wizards.map((w) => w.plugin),
    checks
  };
}

function validateRepoConfig(repoRoot, pluginFilter) {
  const marketplaceRoot = resolveMarketplaceRoot(repoRoot);
  const wizards = discoverWizards(marketplaceRoot)
    .filter((w) => !pluginFilter || w.plugin === pluginFilter);

  const results = [];
  for (const w of wizards) {
    const schemaErrors = validateWizardSchema(w.manifest, w.wizardPath);
    const defaultVars = {
      repo_name: path.basename(repoRoot),
      workspace_root: path.basename(repoRoot)
    };
    for (const g of w.manifest.groups || []) {
      for (const f of g.fields || []) {
        if (f.key && f.default !== undefined) {
          defaultVars[f.key] = typeof f.default === 'string' ? expandVars(f.default, defaultVars) : f.default;
        }
      }
    }
    const configChecks = [];
    for (const outSpec of w.manifest.outputs || []) {
      let samplePath = expandVars(outSpec.path, defaultVars);
      // If outSpec.path references a select field (e.g., {{config_location}}), find whichever option exists on disk
      const varMatch = /^\{\{([a-zA-Z0-9_.-]+)\}\}$/.exec(outSpec.path || '');
      if (varMatch) {
        const keyName = varMatch[1];
        for (const g of w.manifest.groups || []) {
          for (const f of g.fields || []) {
            if (f.key === keyName && Array.isArray(f.options)) {
              const hitOpt = f.options
                .map((o) => (typeof o === 'object' ? o.value : String(o)))
                .find((optPath) => safeExists(path.resolve(repoRoot, optPath)));
              if (hitOpt) samplePath = hitOpt;
            }
          }
        }
      }
      const abs = path.resolve(repoRoot, samplePath);
      if (safeExists(abs)) {
        if (outSpec.format === 'json' || samplePath.endsWith('.json')) {
          const parsed = safeReadJson(abs);
          configChecks.push({
            path: samplePath,
            exists: true,
            valid: parsed !== null,
            detail: parsed !== null ? 'valid JSON' : 'invalid JSON syntax'
          });
        } else {
          const text = safeReadText(abs) || '';
          configChecks.push({
            path: samplePath,
            exists: true,
            valid: text.trim().length > 0,
            detail: text.trim().length > 0 ? `non-empty (${text.length} chars)` : 'empty file'
          });
        }
      } else {
        configChecks.push({
          path: samplePath,
          exists: false,
          valid: true,
          detail: 'not configured locally (bundled fallback applies)'
        });
      }
    }
    const passed = schemaErrors.length === 0 && configChecks.every((c) => c.valid);
    results.push({
      plugin: w.plugin,
      schema: w.manifest.schema,
      passed,
      schema_errors: schemaErrors,
      output_checks: configChecks
    });
  }

  return {
    passed: results.every((r) => r.passed),
    repo_root: repoRoot,
    results
  };
}

// ─── CLI Argument Parser & Entrypoint ──────────────────────────────────────

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const k = tok.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out[k] = next;
        i += 1;
      } else {
        out[k] = true;
      }
    } else {
      out._.push(tok);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sub = args._[0] || 'doctor';
  const repoRoot = path.resolve(args.repo || process.cwd());
  const asJson = Boolean(args.json);

  if (sub === 'list') {
    const marketplaceRoot = resolveMarketplaceRoot(repoRoot);
    const wizards = discoverWizards(marketplaceRoot).map((w) => ({
      plugin: w.plugin,
      schema: w.manifest.schema,
      title: w.manifest.title || w.plugin,
      description: w.manifest.description || '',
      groups: (w.manifest.groups || []).length,
      outputs: (w.manifest.outputs || []).map((o) => o.path)
    }));
    if (asJson) {
      process.stdout.write(JSON.stringify({ count: wizards.length, wizards }, null, 2) + '\n');
    } else {
      for (const w of wizards) {
        process.stdout.write(`- ${w.plugin} (${w.schema}): ${w.title} [${w.groups} group(s) -> ${w.outputs.join(', ')}]\n`);
      }
    }
    return;
  }

  if (sub === 'doctor') {
    const rep = runDoctor(repoRoot, { plugin: args.plugin || args._[1] || null });
    if (asJson) {
      process.stdout.write(JSON.stringify(rep, null, 2) + '\n');
    } else {
      process.stdout.write(`gnox doctor (${rep.status.toUpperCase()}) — repo: ${rep.repo_root}\n`);
      for (const c of rep.checks) {
        const tag = c.severity === 'ok' ? '[OK]  ' : c.severity === 'warn' ? '[WARN]' : c.severity === 'error' ? '[ERR] ' : '[INFO]';
        process.stdout.write(`  ${tag} ${c.summary}\n`);
      }
      process.stdout.write(`\nSummary: ${rep.errors} error(s), ${rep.warnings} warning(s), ${rep.wizards_discovered.length} plugin wizard(s) available.\n`);
    }
    process.exit(rep.errors > 0 ? 1 : 0);
  }

  if (sub === 'validate') {
    const pluginName = args._[1] || args.plugin || null;
    const rep = validateRepoConfig(repoRoot, pluginName);
    if (asJson) {
      process.stdout.write(JSON.stringify(rep, null, 2) + '\n');
    } else {
      for (const r of rep.results) {
        process.stdout.write(`${r.passed ? '[OK]  ' : '[FAIL]'} ${r.plugin} (${r.schema})\n`);
        for (const err of r.schema_errors) process.stdout.write(`  schema error: ${err}\n`);
        for (const c of r.output_checks) process.stdout.write(`  output ${c.path}: ${c.detail}\n`);
      }
    }
    process.exit(rep.passed ? 0 : 1);
  }

  if (sub === 'run') {
    const pluginName = args._[1] || args.plugin || 'update-readme-images';
    const marketplaceRoot = resolveMarketplaceRoot(repoRoot);
    const wizards = discoverWizards(marketplaceRoot);
    const target = wizards.find((w) => w.plugin === pluginName);
    if (!target) {
      process.stderr.write(`[gnox:local-config-wizard] No wizard manifest found for plugin "${pluginName}". Available: ${wizards.map((w) => w.plugin).join(', ')}\n`);
      process.exit(1);
    }
    let preset = {};
    if (typeof args.answers === 'string') {
      if (safeExists(args.answers)) {
        preset = safeReadJson(args.answers) || {};
      } else {
        preset = JSON.parse(args.answers);
      }
    }
    const res = await runWizard(target, repoRoot, {
      answers: preset,
      nonInteractive: Boolean(args['non-interactive']),
      overwrite: Boolean(args.overwrite),
      ui: typeof args.ui === 'string' ? args.ui : 'auto'
    });
    if (asJson) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else {
      process.stdout.write(`Completed ${res.plugin} wizard (driver=${res.ui_driver}):\n`);
      for (const f of res.written_files) process.stdout.write(`  wrote:   ${f}\n`);
      for (const s of res.skipped_files) process.stdout.write(`  skipped: ${s.path} (${s.reason})\n`);
    }
    return;
  }

  process.stderr.write('Usage: node local-config-wizard.js <doctor | list | run [plugin] | validate [plugin]> [--repo <dir>] [--json]\n');
  process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`[gnox:local-config-wizard] ${err.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  detectOrgContext,
  discoverWizards,
  evalWhen,
  validateWizardSchema,
  runWizard,
  runDoctor,
  validateRepoConfig
};
