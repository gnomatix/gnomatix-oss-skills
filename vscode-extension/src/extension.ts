// GNOMATIX Skills — VS Code extension entry point.
//
// "GNOMATIX" = GNO (from gnosis, Greek γνῶσις — esoteric/mystical knowledge)
//            + MATIX (automatic) → "automatic gnosis" / "automated knowledge".
// The wordmark's stylized X is a DNA double-helix; the "O" carries Rosalind
// Franklin's Photo 51 (1952 X-ray diffraction image that revealed B-DNA's
// double-helix structure).
//
// Cross-platform discipline per repo CLAUDE.md: pure Node std-lib, atomic
// writes, defensive fs error handling, no shell calls, no hard-coded Unix
// paths.

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { GnomatixStatusBar } from './statusBar';
import { SkillsTreeProvider } from './skillsView';
import { registerCommands } from './commands';

/**
 * Resolve the marketplace root directory.
 *
 * Order of precedence:
 *   1. Explicit setting gnomatix.marketplaceRoot
 *   2. Workspace folder if it looks like the marketplace
 *      (contains .claude-plugin/marketplace.json)
 *   3. Default Claude Code marketplace install location
 *      ($HOME/.claude/plugins/marketplaces/gnomatix-oss-skills)
 */
export function resolveMarketplaceRoot(): string | undefined {
  const cfg = vscode.workspace.getConfiguration('gnomatix');
  const explicit = (cfg.get<string>('marketplaceRoot') || '').trim();
  if (explicit) {
    return explicit;
  }

  const folders = vscode.workspace.workspaceFolders || [];
  for (const folder of folders) {
    const candidate = path.join(
      folder.uri.fsPath,
      '.claude-plugin',
      'marketplace.json',
    );
    try {
      if (fs.existsSync(candidate)) {
        return folder.uri.fsPath;
      }
    } catch {
      // Pass-through. fs.existsSync should not throw, but be defensive.
    }
  }

  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  if (!home) {
    return undefined;
  }
  return path.join(
    home,
    '.claude',
    'plugins',
    'marketplaces',
    'gnomatix-oss-skills',
  );
}

/**
 * Resolve the log directory used by skills.
 */
export function resolveLogDirectory(): string {
  const cfg = vscode.workspace.getConfiguration('gnomatix');
  const explicit = (cfg.get<string>('logDirectory') || '').trim();
  if (explicit) {
    return explicit;
  }
  const folders = vscode.workspace.workspaceFolders || [];
  if (folders.length > 0) {
    return path.join(folders[0].uri.fsPath, '.claude', 'logs');
  }
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  return path.join(home || os.tmpdir(), '.claude', 'logs');
}

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = new GnomatixStatusBar(context);
  statusBar.refresh();

  const skillsProvider = new SkillsTreeProvider(context);
  const treeView = vscode.window.createTreeView('gnomatix.skillsView', {
    treeDataProvider: skillsProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  registerCommands(context, statusBar, skillsProvider);

  // React to configuration changes.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('gnomatix')) {
        statusBar.refresh();
        skillsProvider.refresh();
      }
    }),
  );
}

export function deactivate(): void {
  // No-op. All disposables are registered against the context.
}
