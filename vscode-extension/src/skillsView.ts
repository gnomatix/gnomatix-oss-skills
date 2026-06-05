// Activity Bar tree view: installed plugins / skills with enable-disable
// toggle per skill.
//
// Tree shape:
//   Plugin
//   ├── Skill (with enable/disable state)
//   ├── Skill
//   └── ...
//
// Enable / disable state is persisted in the workspace state of the
// extension context. This is advisory — the actual gate at runtime is in the
// upstream skill (whacking-day / zartan / etc).

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { resolveMarketplaceRoot } from './extension';

const ENABLED_STATE_KEY = 'gnomatix.skill.enabled';

interface PluginManifest {
  name: string;
  description?: string;
  source?: string;
}

interface MarketplaceManifest {
  name?: string;
  plugins?: PluginManifest[];
}

export class PluginNode extends vscode.TreeItem {
  constructor(
    public readonly pluginName: string,
    public readonly pluginPath: string,
    public readonly description2: string,
  ) {
    super(pluginName, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'plugin';
    this.tooltip = description2;
    this.description = path.basename(pluginPath);
    this.iconPath = new vscode.ThemeIcon('package');
  }
}

export class SkillNode extends vscode.TreeItem {
  constructor(
    public readonly skillName: string,
    public readonly skillPath: string,
    public readonly pluginName: string,
    public readonly enabled: boolean,
  ) {
    super(skillName, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'skill';
    this.description = enabled ? 'enabled' : 'disabled';
    this.tooltip = `${pluginName} / ${skillName}\n${skillPath}\n${
      enabled ? 'Enabled' : 'Disabled'
    }`;
    this.iconPath = new vscode.ThemeIcon(
      enabled ? 'pass-filled' : 'circle-slash',
    );
    this.command = {
      command: 'vscode.open',
      title: 'Open SKILL.md',
      arguments: [vscode.Uri.file(path.join(skillPath, 'SKILL.md'))],
    };
  }
}

export type GnomatixTreeNode = PluginNode | SkillNode;

export class SkillsTreeProvider
  implements vscode.TreeDataProvider<GnomatixTreeNode>
{
  private _onDidChange = new vscode.EventEmitter<GnomatixTreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChange.fire(undefined);
  }

  getTreeItem(element: GnomatixTreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: GnomatixTreeNode): GnomatixTreeNode[] {
    if (!element) {
      return this.listPlugins();
    }
    if (element instanceof PluginNode) {
      return this.listSkills(element);
    }
    return [];
  }

  /**
   * Look up the enable/disable state for a skill.
   * Default is enabled.
   */
  isSkillEnabled(pluginName: string, skillName: string): boolean {
    const map = this.context.workspaceState.get<Record<string, boolean>>(
      ENABLED_STATE_KEY,
      {},
    );
    const key = `${pluginName}/${skillName}`;
    return map[key] !== false;
  }

  async setSkillEnabled(
    pluginName: string,
    skillName: string,
    enabled: boolean,
  ): Promise<void> {
    const map = this.context.workspaceState.get<Record<string, boolean>>(
      ENABLED_STATE_KEY,
      {},
    );
    map[`${pluginName}/${skillName}`] = enabled;
    await this.context.workspaceState.update(ENABLED_STATE_KEY, map);
    this.refresh();
  }

  private listPlugins(): PluginNode[] {
    const root = resolveMarketplaceRoot();
    if (!root) {
      return [];
    }
    const manifest = this.readMarketplaceManifest(root);
    const nodes: PluginNode[] = [];

    if (manifest?.plugins && Array.isArray(manifest.plugins)) {
      for (const p of manifest.plugins) {
        if (!p.name) {
          continue;
        }
        // Resolve source field; default to ./plugins/<name>.
        const relSource = p.source || path.join('.', 'plugins', p.name);
        // Normalize: tolerate ./ prefix and platform separators.
        const normalized = relSource.replace(/^\.[\\/]/, '');
        const pluginPath = path.isAbsolute(normalized)
          ? normalized
          : path.join(root, normalized);
        nodes.push(new PluginNode(p.name, pluginPath, p.description || ''));
      }
      return nodes;
    }

    // Fallback: enumerate plugins/ directory directly.
    const pluginsDir = path.join(root, 'plugins');
    try {
      if (!fs.existsSync(pluginsDir)) {
        return nodes;
      }
      const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          nodes.push(
            new PluginNode(e.name, path.join(pluginsDir, e.name), ''),
          );
        }
      }
    } catch (err) {
      this.warn(err, `enumerate ${pluginsDir}`);
    }
    return nodes;
  }

  private listSkills(plugin: PluginNode): SkillNode[] {
    const skillsRoot = path.join(plugin.pluginPath, 'skills');
    const nodes: SkillNode[] = [];
    try {
      if (!fs.existsSync(skillsRoot)) {
        return nodes;
      }
      const entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory()) {
          continue;
        }
        const skillDir = path.join(skillsRoot, e.name);
        const skillMd = path.join(skillDir, 'SKILL.md');
        // Skip directories that don't look like skills.
        try {
          if (!fs.existsSync(skillMd)) {
            continue;
          }
        } catch (err) {
          this.warn(err, `stat ${skillMd}`);
          continue;
        }
        nodes.push(
          new SkillNode(
            e.name,
            skillDir,
            plugin.pluginName,
            this.isSkillEnabled(plugin.pluginName, e.name),
          ),
        );
      }
    } catch (err) {
      this.warn(err, `enumerate ${skillsRoot}`);
    }
    return nodes;
  }

  private readMarketplaceManifest(
    root: string,
  ): MarketplaceManifest | undefined {
    const manifestPath = path.join(
      root,
      '.claude-plugin',
      'marketplace.json',
    );
    try {
      if (!fs.existsSync(manifestPath)) {
        return undefined;
      }
      const raw = fs.readFileSync(manifestPath, 'utf8');
      return JSON.parse(raw) as MarketplaceManifest;
    } catch (err) {
      this.warn(err, `read manifest ${manifestPath}`);
      return undefined;
    }
  }

  private warn(err: unknown, context: string): void {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return;
    }
    console.error(`[gnomatix.skillsView] ${context}:`, err);
  }
}
