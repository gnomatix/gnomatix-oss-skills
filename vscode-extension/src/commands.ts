// Command palette implementations for GNOMATIX Skills.
//
// All cross-platform conventions per repo CLAUDE.md: no child_process,
// no shell, atomic writes, defensive fs.

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { GnomatixStatusBar } from './statusBar';
import {
  SkillsTreeProvider,
  PluginNode,
  SkillNode,
  GnomatixTreeNode,
} from './skillsView';
import { resolveMarketplaceRoot, resolveLogDirectory } from './extension';
import { showAboutPanel } from './webviews/about';
import { showConfigPanel } from './webviews/config';

export function registerCommands(
  context: vscode.ExtensionContext,
  statusBar: GnomatixStatusBar,
  skills: SkillsTreeProvider,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('gnomatix.installSuite', () =>
      cmdInstallSuite(),
    ),
    vscode.commands.registerCommand(
      'gnomatix.toggleSkill',
      (node?: GnomatixTreeNode) => cmdToggleSkill(skills, node),
    ),
    vscode.commands.registerCommand('gnomatix.openContract', () =>
      cmdOpenContract(),
    ),
    vscode.commands.registerCommand('gnomatix.viewViolationsLog', () =>
      cmdViewViolationsLog(),
    ),
    vscode.commands.registerCommand('gnomatix.resetSessionContract', () =>
      cmdResetSessionContract(statusBar),
    ),
    vscode.commands.registerCommand('gnomatix.showLicensing', () =>
      showAboutPanel(context),
    ),
    vscode.commands.registerCommand('gnomatix.refreshSkills', () =>
      skills.refresh(),
    ),
    vscode.commands.registerCommand('gnomatix.openConfig', () =>
      showConfigPanel(context),
    ),
  );
}

/**
 * Install the suite via the Claude Code CLI if the user invokes it from a
 * terminal. The extension does not run subprocesses (per CLAUDE.md no
 * child_process rule); instead, it surfaces the canonical install command
 * and offers to open a terminal pre-populated with it.
 */
async function cmdInstallSuite(): Promise<void> {
  const installCmd =
    '/plugin install gnomatix-oss-skills@gnomatix-oss-skills';
  const messages = [
    'GNOMATIX Skills are installed via the Claude Code CLI.',
    '',
    'Run the following inside a Claude Code session:',
    `    ${installCmd}`,
    '',
    'See the marketplace README for full installation details.',
  ];
  const choice = await vscode.window.showInformationMessage(
    messages.join('\n'),
    { modal: false },
    'Copy command',
    'Open terminal',
    'Open marketplace README',
  );
  if (choice === 'Copy command') {
    await vscode.env.clipboard.writeText(installCmd);
    vscode.window.showInformationMessage('Install command copied to clipboard.');
  } else if (choice === 'Open terminal') {
    const term = vscode.window.createTerminal('GNOMATIX install');
    term.show(true);
    term.sendText(`# Run inside a Claude Code session, then:\n# ${installCmd}`);
  } else if (choice === 'Open marketplace README') {
    const root = resolveMarketplaceRoot();
    if (root) {
      const readme = path.join(root, 'README.md');
      try {
        if (fs.existsSync(readme)) {
          const doc = await vscode.workspace.openTextDocument(readme);
          await vscode.window.showTextDocument(doc);
          return;
        }
      } catch (err) {
        console.error('[gnomatix.installSuite] README open failed:', err);
      }
    }
    vscode.window.showWarningMessage(
      'Marketplace README not found. Set gnomatix.marketplaceRoot.',
    );
  }
}

async function cmdToggleSkill(
  skills: SkillsTreeProvider,
  node?: GnomatixTreeNode,
): Promise<void> {
  let target: SkillNode | undefined;
  if (node instanceof SkillNode) {
    target = node;
  } else {
    target = await pickSkill(skills);
  }
  if (!target) {
    return;
  }
  const next = !target.enabled;
  await skills.setSkillEnabled(target.pluginName, target.skillName, next);
  vscode.window.showInformationMessage(
    `Skill "${target.pluginName}/${target.skillName}" ${
      next ? 'enabled' : 'disabled'
    }.`,
  );
}

async function pickSkill(
  skills: SkillsTreeProvider,
): Promise<SkillNode | undefined> {
  const plugins = (await skills.getChildren()) as PluginNode[];
  const items: { label: string; node: SkillNode }[] = [];
  for (const p of plugins) {
    const children = (await skills.getChildren(p)) as SkillNode[];
    for (const s of children) {
      items.push({
        label: `${p.pluginName}/${s.skillName} — ${
          s.enabled ? 'enabled' : 'disabled'
        }`,
        node: s,
      });
    }
  }
  if (items.length === 0) {
    vscode.window.showWarningMessage(
      'No skills found. Set gnomatix.marketplaceRoot to your marketplace clone.',
    );
    return undefined;
  }
  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a skill to toggle',
  });
  return pick?.node;
}

/**
 * Open the contract document. Looks, in order, for:
 *   1. all-help-no-harm's SKILL.md (the canonical pact text)
 *   2. marketplace-root/CONTRACT.md
 *   3. workspace-root/CONTRACT.md
 */
async function cmdOpenContract(): Promise<void> {
  const candidates: string[] = [];
  const root = resolveMarketplaceRoot();
  if (root) {
    candidates.push(
      path.join(
        root,
        'plugins',
        'all-help-no-harm',
        'skills',
        'all-help-no-harm',
        'SKILL.md',
      ),
      path.join(root, 'CONTRACT.md'),
      path.join(root, 'contract.md'),
    );
  }
  const folders = vscode.workspace.workspaceFolders || [];
  for (const f of folders) {
    candidates.push(
      path.join(f.uri.fsPath, 'CONTRACT.md'),
      path.join(f.uri.fsPath, 'contract.md'),
    );
  }

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const doc = await vscode.workspace.openTextDocument(c);
        await vscode.window.showTextDocument(doc);
        return;
      }
    } catch (err) {
      console.error('[gnomatix.openContract] candidate check failed:', err);
    }
  }
  vscode.window.showWarningMessage(
    'No contract document found. Set gnomatix.marketplaceRoot to your marketplace clone, or create CONTRACT.md in the workspace root.',
  );
}

async function cmdViewViolationsLog(): Promise<void> {
  const logDir = resolveLogDirectory();
  const log = path.join(logDir, 'actually-im-the-ahole-violations.jsonl');
  try {
    if (!fs.existsSync(log)) {
      vscode.window.showInformationMessage(
        `Violations log not found at ${log}. The log is created the first time the actually-im-the-ahole skill records a finding.`,
      );
      return;
    }
    const doc = await vscode.workspace.openTextDocument(log);
    await vscode.window.showTextDocument(doc);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Could not open violations log: ${(err as Error).message}`,
    );
  }
}

/**
 * Reset the current session's pact-agreement file.
 *
 * VS Code does not expose the Claude Code session ID directly; this command
 * lists pact-agreement files (newest first) and asks the user which one to
 * clear. The cleared file is renamed (atomic rename to .bak.<ts>) rather
 * than deleted, so the user can recover if they hit it by mistake.
 */
async function cmdResetSessionContract(
  statusBar: GnomatixStatusBar,
): Promise<void> {
  const folders = vscode.workspace.workspaceFolders || [];
  if (folders.length === 0) {
    vscode.window.showWarningMessage(
      'Open a workspace folder first; pact-agreements live in .claude/pact-agreements relative to the workspace.',
    );
    return;
  }
  const dir = path.join(
    folders[0].uri.fsPath,
    '.claude',
    'pact-agreements',
  );
  let entries: { name: string; path: string; mtime: number }[] = [];
  try {
    if (!fs.existsSync(dir)) {
      vscode.window.showInformationMessage(
        'No pact-agreements directory yet. Nothing to reset.',
      );
      return;
    }
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) {
        continue;
      }
      const p = path.join(dir, name);
      try {
        const st = fs.statSync(p);
        entries.push({ name, path: p, mtime: st.mtimeMs });
      } catch (err) {
        console.error('[gnomatix.resetSessionContract] stat:', err);
      }
    }
  } catch (err) {
    vscode.window.showErrorMessage(
      `Could not read ${dir}: ${(err as Error).message}`,
    );
    return;
  }
  if (entries.length === 0) {
    vscode.window.showInformationMessage('No pact-agreements found.');
    return;
  }
  entries.sort((a, b) => b.mtime - a.mtime);
  const pick = await vscode.window.showQuickPick(
    entries.map((e) => ({
      label: e.name,
      description: new Date(e.mtime).toISOString(),
      target: e,
    })),
    { placeHolder: 'Select a pact-agreement to reset' },
  );
  if (!pick) {
    return;
  }
  const confirm = await vscode.window.showWarningMessage(
    `Reset (rename to .bak) pact file ${pick.label}?`,
    { modal: true },
    'Reset',
  );
  if (confirm !== 'Reset') {
    return;
  }
  // Rename is atomic on POSIX and "atomic enough" on Windows for this case.
  const ts = Date.now();
  const backup = `${pick.target.path}.bak.${ts}`;
  try {
    fs.renameSync(pick.target.path, backup);
    vscode.window.showInformationMessage(
      `Pact reset. Backup at ${path.basename(backup)}.`,
    );
    statusBar.refresh();
  } catch (err) {
    vscode.window.showErrorMessage(
      `Could not reset pact: ${(err as Error).message}`,
    );
  }
}
