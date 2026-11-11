// gnox — SessionStart & PostCompact hook
//
// Establishes the GNOMATIX Namespacing Convention across the working session so
// every gnox-related skill applies consistent hierarchical scoping, CLI-safe
// callout addressing, CURIE grounding, and command routing.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no subprocess spawning, no
// hardcoded Unix paths, every fs call wrapped in try/catch, fail-open.

'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => { data += chunk; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(data));
    } catch {
      resolve(data);
    }
  });
}

function safeReadJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeNamespaceSegment(seg) {
  return String(seg || '')
    .trim()
    .replace(/^@[a-z0-9._-]+\//i, '')
    .replace(/[\\/:\s]+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    || 'workspace';
}

function detectWorkspaceRoot(projectDir) {
  if (!projectDir || typeof projectDir !== 'string') return 'workspace';
  const absDir = path.resolve(projectDir);

  const readmeImageConfigs = [
    path.join(absDir, '.claude', 'readme-images.json'),
    path.join(absDir, 'config', 'readme-images.json'),
    path.join(absDir, 'readme-images.json'),
    path.join(absDir, 'plugins', 'update-readme-images', 'config', 'readme-images.json')
  ];
  for (const cfgPath of readmeImageConfigs) {
    const cfg = safeReadJson(cfgPath);
    if (cfg && typeof cfg.workspace_root === 'string' && cfg.workspace_root.trim()) {
      return normalizeNamespaceSegment(cfg.workspace_root);
    }
  }

  const mp = safeReadJson(path.join(absDir, '.claude-plugin', 'marketplace.json'));
  if (mp && typeof mp.name === 'string' && mp.name.trim()) {
    return normalizeNamespaceSegment(mp.name);
  }

  const pkg = safeReadJson(path.join(absDir, 'package.json'));
  if (pkg && typeof pkg.name === 'string' && pkg.name.trim()) {
    return normalizeNamespaceSegment(pkg.name);
  }

  return normalizeNamespaceSegment(path.basename(absDir));
}

function buildNamespacingContext(workspaceRoot) {
  return [
    `[gnox] GNOMATIX Namespacing Convention active for this session (workspace_root = "${workspaceRoot}"):`,
    `1. Hierarchical Path & Config Namespace (workspace_root:subdir:...):`,
    `   - Scope directories, packages, plugins, style guides, and rules using colon-delimited paths rooted at "${workspaceRoot}" (e.g. "${workspaceRoot}", "${workspaceRoot}:plugins:<name>", "${workspaceRoot}:packages:<pkg>").`,
    `   - Normalize "/" and "\\" separators (and optional "[...]" brackets) to ":". Child namespaces inherit from parent namespaces top-down from "${workspaceRoot}" unless "inherit": false is explicitly set.`,
    `2. CLI-Safe Callouts & 4-Step Namespace Resolution ([NS]{@target}):`,
    `   - Format asynchronous notifications, proposed-revision gates, and action items as: [NS]{@target} <message> #domain #urgency #action (never bare @person tokens, which trigger CLI file-attachment parsers).`,
    `   - Resolve [NS] strictly in order: (a) explicit [NS] stated by the user -> (b) active task/Bead namespace -> (c) directory or frontmatter "up:" chain to "${workspaceRoot}:<subdir>" -> (d) [UNRESOLVED] #needs-namespace (never guess silently).`,
    `3. Inline Registry Grounding («term» [CURIE]):`,
    `   - When tagging named entities (ontology-lookup / inaudible-markup), tag first mention only using silent guillemets and Bioregistry CURIEs: «term» [PREFIX:id].`,
    `4. Marketplace Command Routing (/gnox:<plugin>[:<skill>]):`,
    `   - Route marketplace skills systematically via /gnox:<plugin> (main skill), /gnox:<plugin>:<skill> (sub-skill), and /gnox:<plugin>:<group>:<cmd> (sub-command).`
  ].join('\n');
}

(async () => {
  let payload = {};
  try {
    payload = JSON.parse((await readStdin()) || '{}');
  } catch {
    payload = {};
  }

  try {
    const projectDir =
      (payload && payload.cwd) ||
      process.env.CLAUDE_PROJECT_DIR ||
      process.cwd();
    const eventName =
      payload && payload.hook_event_name === 'PostCompact'
        ? 'PostCompact'
        : 'SessionStart';
    const workspaceRoot = detectWorkspaceRoot(projectDir);
    const additionalContext = buildNamespacingContext(workspaceRoot);

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: eventName,
          additionalContext
        }
      })
    );
  } catch (err) {
    try {
      process.stderr.write(`[gnox] session-namespace error (ignored): ${err && err.message}\n`);
    } catch { /* ignore */ }
  }
})();
