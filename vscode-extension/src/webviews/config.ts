// GNOMATIX Skills — Configuration webview.
//
// Provides a proper graphical config UI (toggle switches, tabbed sections,
// brand-styled CSS) backed by bidirectional sync with:
//   - VS Code workspace/user settings.json (via the configuration API)
//   - ~/.claude/side-hooks.json (atomic file write)
//   - plugins/all-help-no-harm/skills/all-help-no-harm/vendors/*.json
//   - plugins/<plugin>/hooks/hooks.json (per-hook enable/disable)
//
// Cross-platform per repo CLAUDE.md:
//   - pure Node (no child_process)
//   - atomic temp-file + rename writes
//   - defensive fs error handling — every fs call wrapped in try/catch
//   - no hard-coded Unix paths; uses os.homedir(), path.join everywhere
//   - tolerates CRLF
//
// Webview security:
//   - Per-instance nonce, CSP: script-src 'self' 'nonce-<n>'
//   - style-src 'self' 'unsafe-inline'
//   - img-src vscode-resource: https:
//   - No external script loading
//
// Branding: GNOMATIX = gnosis (γνῶσις) + automatic. Wordmark X is a DNA
// double helix; O carries Rosalind Franklin's Photo 51 (1952 B-DNA).

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { resolveMarketplaceRoot } from '../extension';

let currentPanel: vscode.WebviewPanel | undefined;
let disposables: vscode.Disposable[] = [];
let sideHooksWatcher: fs.FSWatcher | undefined;

interface IncomingMessage {
  type: string;
  key?: string;
  value?: unknown;
  payload?: Record<string, unknown>;
  id?: string;
}

interface SideHookEntry {
  id: string;
  type?: string;
  trigger?: string;
  enabled?: boolean;
  model?: string;
  criteria?: string;
  [k: string]: unknown;
}

interface SideHooksFile {
  version?: number;
  hooks?: SideHookEntry[];
  [k: string]: unknown;
}

interface VendorDocsFile {
  vendor?: string;
  last_fetched?: string;
  drift_detected?: boolean;
  docs?: Array<{ name?: string; url?: string; sha256?: string }>;
  [k: string]: unknown;
}

interface PluginHooksFile {
  hooks?: Record<
    string,
    Array<{ matcher?: string; hooks?: Array<{ type?: string; command?: string }> }>
  >;
  [k: string]: unknown;
}

export function showConfigPanel(context: vscode.ExtensionContext): void {
  const column = vscode.window.activeTextEditor?.viewColumn;

  if (currentPanel) {
    currentPanel.reveal(column);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'gnomatix.config',
    'GNOMATIX Skills — Configuration',
    column || vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'media')),
        vscode.Uri.file(path.join(context.extensionPath, 'src', 'webviews')),
      ],
    },
  );
  currentPanel = panel;

  panel.iconPath = vscode.Uri.file(
    path.join(context.extensionPath, 'media', 'icon.png'),
  );

  panel.webview.html = renderHtml(context, panel.webview);

  // Push initial state to the webview once it tells us it's ready.
  const messageSub = panel.webview.onDidReceiveMessage((msg: IncomingMessage) => {
    handleMessage(context, panel, msg).catch((err) => {
      console.error('[gnomatix.config] message handler failed:', err);
    });
  });
  disposables.push(messageSub);

  // Watch settings.json changes from outside the webview.
  const cfgSub = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gnomatix')) {
      postState(panel).catch((err) => {
        console.error('[gnomatix.config] postState on config change failed:', err);
      });
    }
  });
  disposables.push(cfgSub);

  // Watch side-hooks.json from outside.
  startSideHooksWatcher(panel);

  panel.onDidDispose(() => {
    currentPanel = undefined;
    for (const d of disposables) {
      try {
        d.dispose();
      } catch {
        /* best effort */
      }
    }
    disposables = [];
    stopSideHooksWatcher();
  });
}

function startSideHooksWatcher(panel: vscode.WebviewPanel): void {
  stopSideHooksWatcher();
  const file = resolveSideHooksPath();
  if (!file) {
    return;
  }
  const dir = path.dirname(file);
  try {
    if (!fs.existsSync(dir)) {
      return;
    }
    // Watch the directory rather than the file so we tolerate file recreation
    // via atomic rename (the file's inode changes; watching the file directly
    // breaks on rename on Linux).
    sideHooksWatcher = fs.watch(dir, (_evt, filename) => {
      if (!filename) {
        return;
      }
      if (filename === path.basename(file)) {
        postState(panel).catch((err) => {
          console.error('[gnomatix.config] postState on watch failed:', err);
        });
      }
    });
    sideHooksWatcher.on('error', (err) => {
      console.error('[gnomatix.config] watcher error:', err);
    });
  } catch (err) {
    console.error('[gnomatix.config] fs.watch failed:', err);
  }
}

function stopSideHooksWatcher(): void {
  if (sideHooksWatcher) {
    try {
      sideHooksWatcher.close();
    } catch {
      /* best effort */
    }
    sideHooksWatcher = undefined;
  }
}

async function handleMessage(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  msg: IncomingMessage,
): Promise<void> {
  switch (msg.type) {
    case 'ready':
      await postState(panel);
      return;
    case 'updateSetting': {
      if (!msg.key) {
        return;
      }
      const cfg = vscode.workspace.getConfiguration();
      try {
        await cfg.update(
          msg.key,
          msg.value,
          vscode.ConfigurationTarget.Global,
        );
        notify(panel, 'saved', `Saved ${msg.key}.`);
      } catch (err) {
        notify(panel, 'error', `Could not save ${msg.key}: ${(err as Error).message}`);
      }
      return;
    }
    case 'toggleSideHook': {
      const id = (msg.payload?.id as string) || '';
      const enabled = !!msg.payload?.enabled;
      const result = updateSideHook(id, (entry) => {
        entry.enabled = enabled;
      });
      notify(panel, result.ok ? 'saved' : 'error',
        result.ok ? `Side-hook ${id} ${enabled ? 'enabled' : 'disabled'}.` : result.reason);
      await postState(panel);
      return;
    }
    case 'updateSideHookField': {
      const id = (msg.payload?.id as string) || '';
      const field = (msg.payload?.field as string) || '';
      const value = msg.payload?.value as string | undefined;
      if (!id || !field) {
        return;
      }
      const result = updateSideHook(id, (entry) => {
        (entry as Record<string, unknown>)[field] = value;
      });
      notify(panel, result.ok ? 'saved' : 'error',
        result.ok ? `Side-hook ${id}.${field} updated.` : result.reason);
      await postState(panel);
      return;
    }
    case 'addSideHook': {
      const entry = msg.payload as unknown as SideHookEntry;
      if (!entry || !entry.id) {
        notify(panel, 'error', 'Side-hook requires an id.');
        return;
      }
      const result = addSideHook(entry);
      notify(panel, result.ok ? 'saved' : 'error',
        result.ok ? `Added side-hook ${entry.id}.` : result.reason);
      await postState(panel);
      return;
    }
    case 'togglePluginHook': {
      const plugin = (msg.payload?.plugin as string) || '';
      const event = (msg.payload?.event as string) || '';
      const enabled = !!msg.payload?.enabled;
      const result = togglePluginHook(plugin, event, enabled);
      notify(panel, result.ok ? 'saved' : 'error',
        result.ok ? `${plugin}/${event} ${enabled ? 'enabled' : 'disabled'}.` : result.reason);
      await postState(panel);
      return;
    }
    case 'openHookSource': {
      const plugin = (msg.payload?.plugin as string) || '';
      const file = (msg.payload?.file as string) || '';
      await openPluginFile(plugin, file);
      return;
    }
    case 'openSkillDoc': {
      const plugin = (msg.payload?.plugin as string) || '';
      const skill = (msg.payload?.skill as string) || '';
      const doc = (msg.payload?.doc as string) || 'SKILL.md';
      await openSkillDoc(plugin, skill, doc);
      return;
    }
    case 'refreshVendorDocs': {
      // The webview cannot run child_process and the extension forbids it
      // per CLAUDE.md. Instead, open the refresh script in an editor and
      // surface the canonical invocation in a notification so the user runs
      // it themselves.
      await surfaceVendorRefresh(panel);
      return;
    }
    case 'requestState':
      await postState(panel);
      return;
    default:
      // Unknown message: log and ignore. The webview must not crash the host.
      console.warn('[gnomatix.config] unknown message type:', msg.type);
  }
}

function notify(
  panel: vscode.WebviewPanel,
  kind: 'saved' | 'error' | 'info',
  message: string,
): void {
  try {
    panel.webview.postMessage({ type: 'toast', kind, message });
  } catch {
    /* best effort */
  }
}

async function postState(panel: vscode.WebviewPanel): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('gnomatix');
  const settings = {
    sideHookConfigPath: cfg.get<string>('sideHookConfigPath', ''),
    localModelPath: cfg.get<string>('localModelPath', ''),
    customCriteriaFilePath: cfg.get<string>('customCriteriaFilePath', ''),
    logDirectory: cfg.get<string>('logDirectory', ''),
    'statusBar.enabled': cfg.get<boolean>('statusBar.enabled', true),
    'contract.enforcement': cfg.get<string>('contract.enforcement', 'advisory'),
    marketplaceRoot: cfg.get<string>('marketplaceRoot', ''),
  };

  const skills = enumerateSkills();
  const pluginHooks = enumeratePluginHooks();
  const sideHooks = readSideHooks();
  const vendors = enumerateVendors();
  const localModels = readLocalModelsReport();

  const payload = {
    type: 'state',
    settings,
    skills,
    pluginHooks,
    sideHooks: { path: resolveSideHooksPath(), entries: sideHooks },
    vendors,
    localModels,
  };
  try {
    await panel.webview.postMessage(payload);
  } catch (err) {
    console.error('[gnomatix.config] postState failed:', err);
  }
}

// -------- enumeration helpers --------

interface SkillSummary {
  plugin: string;
  skill: string;
  enabled: boolean;
  skillMdExists: boolean;
  contractMdExists: boolean;
  description: string;
  path: string;
}

function enumerateSkills(): SkillSummary[] {
  const root = resolveMarketplaceRoot();
  if (!root) {
    return [];
  }
  const pluginsDir = path.join(root, 'plugins');
  const out: SkillSummary[] = [];
  try {
    if (!fs.existsSync(pluginsDir)) {
      return out;
    }
    const plugins = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const p of plugins) {
      if (!p.isDirectory()) {
        continue;
      }
      const skillsDir = path.join(pluginsDir, p.name, 'skills');
      try {
        if (!fs.existsSync(skillsDir)) {
          continue;
        }
        const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
        for (const s of skills) {
          if (!s.isDirectory()) {
            continue;
          }
          const skillPath = path.join(skillsDir, s.name);
          const skillMd = path.join(skillPath, 'SKILL.md');
          const contractMd = path.join(skillPath, 'contract.md');
          let skillMdExists = false;
          let contractMdExists = false;
          let description = '';
          try { skillMdExists = fs.existsSync(skillMd); } catch { /* */ }
          try { contractMdExists = fs.existsSync(contractMd); } catch { /* */ }
          if (skillMdExists) {
            try {
              const head = fs.readFileSync(skillMd, 'utf8').split(/\r?\n/).slice(0, 30).join('\n');
              const m = head.match(/^description:\s*(.+)$/im);
              if (m) {
                description = m[1].trim().replace(/^['"]|['"]$/g, '');
              }
            } catch { /* */ }
          }
          if (!skillMdExists) {
            continue;
          }
          out.push({
            plugin: p.name,
            skill: s.name,
            enabled: true, // advisory; true unless an external mechanism flips it
            skillMdExists,
            contractMdExists,
            description,
            path: skillPath,
          });
        }
      } catch (err) {
        const code = (err as NodeJS.ErrnoException)?.code;
        if (code !== 'ENOENT') {
          console.error('[gnomatix.config] enumerateSkills:', err);
        }
      }
    }
  } catch (err) {
    console.error('[gnomatix.config] enumerateSkills outer:', err);
  }
  return out;
}

interface PluginHookSummary {
  plugin: string;
  hooksJsonPath: string;
  hooksJsonExists: boolean;
  events: Array<{
    event: string;
    enabled: boolean;
    command: string;
    sourceFile: string;
  }>;
}

function enumeratePluginHooks(): PluginHookSummary[] {
  const root = resolveMarketplaceRoot();
  if (!root) {
    return [];
  }
  const pluginsDir = path.join(root, 'plugins');
  const out: PluginHookSummary[] = [];
  try {
    if (!fs.existsSync(pluginsDir)) {
      return out;
    }
    const plugins = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const p of plugins) {
      if (!p.isDirectory()) {
        continue;
      }
      const hooksJson = path.join(pluginsDir, p.name, 'hooks', 'hooks.json');
      const summary: PluginHookSummary = {
        plugin: p.name,
        hooksJsonPath: hooksJson,
        hooksJsonExists: false,
        events: [],
      };
      let exists = false;
      try { exists = fs.existsSync(hooksJson); } catch { /* */ }
      summary.hooksJsonExists = exists;
      if (exists) {
        try {
          const raw = fs.readFileSync(hooksJson, 'utf8');
          const parsed = JSON.parse(raw) as PluginHooksFile;
          for (const [eventName, registrations] of Object.entries(parsed.hooks || {})) {
            for (const reg of registrations || []) {
              for (const h of reg.hooks || []) {
                const cmd = h.command || '';
                const sourceFile = extractSourceFile(cmd);
                summary.events.push({
                  event: eventName,
                  enabled: true,
                  command: cmd,
                  sourceFile,
                });
              }
            }
          }
        } catch (err) {
          console.error(`[gnomatix.config] parse ${hooksJson}:`, err);
        }
      }
      if (summary.hooksJsonExists) {
        out.push(summary);
      }
    }
  } catch (err) {
    console.error('[gnomatix.config] enumeratePluginHooks:', err);
  }
  return out;
}

function extractSourceFile(cmd: string): string {
  // Best-effort extraction of the script path from a hook command line.
  // Looks for ${CLAUDE_PLUGIN_ROOT}/path/to/file.js patterns.
  if (!cmd) {
    return '';
  }
  const m = cmd.match(/\$\{CLAUDE_PLUGIN_ROOT\}([^\s'"]+)/);
  if (m) {
    return m[1].replace(/^[\\/]+/, '');
  }
  const tokens = cmd.split(/\s+/);
  for (const t of tokens) {
    if (/\.(js|mjs|cjs|sh|bat|ps1|exe)$/i.test(t)) {
      return t;
    }
  }
  return '';
}

function resolveSideHooksPath(): string {
  const cfg = vscode.workspace.getConfiguration('gnomatix');
  const explicit = (cfg.get<string>('sideHookConfigPath') || '').trim();
  if (explicit) {
    return explicit;
  }
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  return path.join(home || os.tmpdir(), '.claude', 'side-hooks.json');
}

function readSideHooks(): SideHookEntry[] {
  const file = resolveSideHooksPath();
  try {
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as SideHooksFile;
    return Array.isArray(parsed.hooks) ? parsed.hooks : [];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') {
      console.error('[gnomatix.config] readSideHooks:', err);
    }
    return [];
  }
}

interface UpdateResult {
  ok: boolean;
  reason: string;
}

function updateSideHook(
  id: string,
  mutator: (entry: SideHookEntry) => void,
): UpdateResult {
  const file = resolveSideHooksPath();
  let data: SideHooksFile = { version: 1, hooks: [] };
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      data = JSON.parse(raw) as SideHooksFile;
      if (!Array.isArray(data.hooks)) {
        data.hooks = [];
      }
    }
  } catch (err) {
    return { ok: false, reason: `read ${file}: ${(err as Error).message}` };
  }
  const entries = data.hooks as SideHookEntry[];
  const idx = entries.findIndex((e) => e.id === id);
  if (idx < 0) {
    return { ok: false, reason: `side-hook ${id} not found` };
  }
  mutator(entries[idx]);
  return atomicWriteJson(file, data);
}

function addSideHook(entry: SideHookEntry): UpdateResult {
  const file = resolveSideHooksPath();
  let data: SideHooksFile = { version: 1, hooks: [] };
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      data = JSON.parse(raw) as SideHooksFile;
      if (!Array.isArray(data.hooks)) {
        data.hooks = [];
      }
    }
  } catch (err) {
    return { ok: false, reason: `read ${file}: ${(err as Error).message}` };
  }
  const entries = data.hooks as SideHookEntry[];
  if (entries.some((e) => e.id === entry.id)) {
    return { ok: false, reason: `side-hook ${entry.id} already exists` };
  }
  entries.push(entry);
  // Best-effort ensure the directory exists.
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  } catch (err) {
    return { ok: false, reason: `mkdir ${path.dirname(file)}: ${(err as Error).message}` };
  }
  return atomicWriteJson(file, data);
}

function togglePluginHook(
  plugin: string,
  event: string,
  enabled: boolean,
): UpdateResult {
  // Persist plugin-hook enable/disable state in the workspace state of the
  // extension via a separate JSON file co-located with the plugin's hooks
  // directory. We do NOT mutate hooks/hooks.json itself because that file
  // is shipped by the upstream plugin and would be overwritten by a
  // marketplace update. Instead, write a sidecar disable list.
  const root = resolveMarketplaceRoot();
  if (!root) {
    return { ok: false, reason: 'no marketplace root resolved' };
  }
  const sidecar = path.join(root, 'plugins', plugin, 'hooks', 'gnomatix-overrides.json');
  let data: { disabled?: string[] } = {};
  try {
    if (fs.existsSync(sidecar)) {
      const raw = fs.readFileSync(sidecar, 'utf8');
      data = JSON.parse(raw) as { disabled?: string[] };
    }
  } catch (err) {
    return { ok: false, reason: `read ${sidecar}: ${(err as Error).message}` };
  }
  const set = new Set<string>(data.disabled || []);
  if (enabled) {
    set.delete(event);
  } else {
    set.add(event);
  }
  data.disabled = Array.from(set).sort();
  try {
    fs.mkdirSync(path.dirname(sidecar), { recursive: true });
  } catch (err) {
    return { ok: false, reason: `mkdir ${path.dirname(sidecar)}: ${(err as Error).message}` };
  }
  return atomicWriteJson(sidecar, data);
}

function atomicWriteJson(target: string, data: unknown): UpdateResult {
  const tmp = `${target}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
    fs.renameSync(tmp, target);
    return { ok: true, reason: '' };
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* */ }
    return { ok: false, reason: `write ${target}: ${(err as Error).message}` };
  }
}

interface VendorSummary {
  vendor: string;
  file: string;
  last_fetched: string;
  drift_detected: boolean;
  doc_count: number;
}

function enumerateVendors(): VendorSummary[] {
  const root = resolveMarketplaceRoot();
  if (!root) {
    return [];
  }
  const vendorsDir = path.join(
    root,
    'plugins',
    'all-help-no-harm',
    'skills',
    'all-help-no-harm',
    'vendors',
  );
  const out: VendorSummary[] = [];
  try {
    if (!fs.existsSync(vendorsDir)) {
      return out;
    }
    for (const name of fs.readdirSync(vendorsDir)) {
      if (!name.endsWith('.json')) {
        continue;
      }
      const full = path.join(vendorsDir, name);
      try {
        const raw = fs.readFileSync(full, 'utf8');
        const parsed = JSON.parse(raw) as VendorDocsFile;
        out.push({
          vendor: parsed.vendor || path.basename(name, '.json'),
          file: full,
          last_fetched: parsed.last_fetched || '(unknown)',
          drift_detected: !!parsed.drift_detected,
          doc_count: Array.isArray(parsed.docs) ? parsed.docs.length : 0,
        });
      } catch (err) {
        console.error(`[gnomatix.config] vendor parse ${full}:`, err);
      }
    }
  } catch (err) {
    console.error('[gnomatix.config] enumerateVendors:', err);
  }
  return out;
}

interface LocalModelsReport {
  reportFile: string;
  reportExists: boolean;
  raw: string;
  parsed?: unknown;
}

function readLocalModelsReport(): LocalModelsReport {
  // The detect-local-models.js script writes a cache file. We surface that
  // cache rather than running the script (no child_process). If the cache is
  // absent we surface the source path so the user can run the script.
  const root = resolveMarketplaceRoot();
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const cache = path.join(home || os.tmpdir(), '.claude', 'local-models.json');
  const out: LocalModelsReport = {
    reportFile: cache,
    reportExists: false,
    raw: '',
  };
  try {
    if (fs.existsSync(cache)) {
      out.reportExists = true;
      out.raw = fs.readFileSync(cache, 'utf8');
      try {
        out.parsed = JSON.parse(out.raw);
      } catch {
        /* leave as raw */
      }
    } else {
      const scriptPath = root
        ? path.join(root, 'plugins', 'all-help-no-harm', 'scripts', 'detect-local-models.js')
        : '';
      out.raw = `No cached report at ${cache}.\n\nRun:\n    node ${scriptPath}\n`;
    }
  } catch (err) {
    out.raw = `error: ${(err as Error).message}`;
  }
  return out;
}

async function openPluginFile(plugin: string, relFile: string): Promise<void> {
  const root = resolveMarketplaceRoot();
  if (!root) {
    vscode.window.showWarningMessage('No marketplace root resolved.');
    return;
  }
  const candidate = path.isAbsolute(relFile)
    ? relFile
    : path.join(root, 'plugins', plugin, relFile);
  try {
    if (fs.existsSync(candidate)) {
      const doc = await vscode.workspace.openTextDocument(candidate);
      await vscode.window.showTextDocument(doc);
      return;
    }
  } catch (err) {
    console.error('[gnomatix.config] openPluginFile:', err);
  }
  vscode.window.showWarningMessage(`File not found: ${candidate}`);
}

async function openSkillDoc(
  plugin: string,
  skill: string,
  doc: string,
): Promise<void> {
  const root = resolveMarketplaceRoot();
  if (!root) {
    return;
  }
  const safeDoc = doc.replace(/[^A-Za-z0-9._-]/g, '');
  const candidate = path.join(root, 'plugins', plugin, 'skills', skill, safeDoc);
  try {
    if (fs.existsSync(candidate)) {
      const d = await vscode.workspace.openTextDocument(candidate);
      await vscode.window.showTextDocument(d);
      return;
    }
  } catch (err) {
    console.error('[gnomatix.config] openSkillDoc:', err);
  }
  vscode.window.showWarningMessage(`Doc not found: ${candidate}`);
}

async function surfaceVendorRefresh(panel: vscode.WebviewPanel): Promise<void> {
  const root = resolveMarketplaceRoot();
  if (!root) {
    notify(panel, 'error', 'No marketplace root resolved.');
    return;
  }
  const script = path.join(
    root,
    'plugins',
    'all-help-no-harm',
    'scripts',
    'refresh-vendor-docs.js',
  );
  const cmd = `node ${script}`;
  const choice = await vscode.window.showInformationMessage(
    `GNOMATIX vendor-docs refresh runs as a Node script. Run:\n\n    ${cmd}\n\nThe extension does not spawn subprocesses.`,
    'Copy command',
    'Open script',
  );
  if (choice === 'Copy command') {
    await vscode.env.clipboard.writeText(cmd);
    notify(panel, 'info', 'Command copied to clipboard.');
  } else if (choice === 'Open script') {
    try {
      if (fs.existsSync(script)) {
        const d = await vscode.workspace.openTextDocument(script);
        await vscode.window.showTextDocument(d);
      } else {
        notify(panel, 'error', `Script not found: ${script}`);
      }
    } catch (err) {
      notify(panel, 'error', `Open failed: ${(err as Error).message}`);
    }
  }
}

// -------- HTML rendering --------

function makeNonce(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 32; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

function renderHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
): string {
  const mediaRoot = path.join(context.extensionPath, 'media');
  const webviewsRoot = path.join(context.extensionPath, 'src', 'webviews');

  const wordmarkUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(mediaRoot, 'gnomatix-wordmark.png')),
  );
  const helixUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(mediaRoot, 'gnomatix-x-helix-256.png')),
  );
  const helix24Uri = webview.asWebviewUri(
    vscode.Uri.file(path.join(mediaRoot, 'gnomatix-x-helix-24.png')),
  );
  const killbotsUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(mediaRoot, 'gnomatix-killbots.png')),
  );

  const cssPath = path.join(webviewsRoot, 'config.css');
  const htmlPath = path.join(webviewsRoot, 'config.html');

  let css = '';
  let html = '';
  try {
    if (fs.existsSync(cssPath)) {
      css = fs.readFileSync(cssPath, 'utf8');
    }
  } catch (err) {
    console.error('[gnomatix.config] css read failed:', err);
  }
  try {
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, 'utf8');
    } else {
      html = INLINE_FALLBACK_HTML;
    }
  } catch (err) {
    console.error('[gnomatix.config] html read failed:', err);
    html = INLINE_FALLBACK_HTML;
  }

  const nonce = makeNonce();
  const cspSource = webview.cspSource;

  return html
    .replace(/\{\{CSP_SOURCE\}\}/g, cspSource)
    .replace(/\{\{NONCE\}\}/g, nonce)
    .replace(/\{\{INLINE_CSS\}\}/g, css)
    .replace(/\{\{WORDMARK_URI\}\}/g, wordmarkUri.toString())
    .replace(/\{\{HELIX_URI\}\}/g, helixUri.toString())
    .replace(/\{\{HELIX_24_URI\}\}/g, helix24Uri.toString())
    .replace(/\{\{KILLBOTS_URI\}\}/g, killbotsUri.toString());
}

// Last-resort fallback if the template file cannot be read. Kept tiny on
// purpose; the real UI lives in config.html + config.css.
const INLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src {{CSP_SOURCE}} https: data:; style-src {{CSP_SOURCE}} 'unsafe-inline'; script-src 'nonce-{{NONCE}}';">
<title>GNOMATIX Configuration</title>
<style>{{INLINE_CSS}}</style>
</head>
<body>
<h1>GNOMATIX Configuration (fallback)</h1>
<p>The full template (src/webviews/config.html) was not found.</p>
<script nonce="{{NONCE}}">
  const vscode = acquireVsCodeApi();
  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
