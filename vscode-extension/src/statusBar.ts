// Status bar item showing the current contract state.
//
// States:
//   active   — green   — "💗 contract active"
//   pending  — yellow  — "💗 contract pending"
//   declined — red     — "⛔ contract declined"
//
// The DNA-helix glyph U+1F9EC mirrors the GNOMATIX wordmark's stylized X
// (DNA double helix).

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type ContractState = 'active' | 'pending' | 'declined' | 'unknown';

const DNA = '\u{1F9EC}'; // U+1F9EC DNA
const BLOCK = '⛔';  // ⛔

export class GnomatixStatusBar {
  private item: vscode.StatusBarItem;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      // Sit just left of common items like git branch / problems.
      100,
    );
    this.item.command = 'gnomatix.openContract';
    context.subscriptions.push(this.item);
  }

  refresh(): void {
    const cfg = vscode.workspace.getConfiguration('gnomatix');
    if (!cfg.get<boolean>('statusBar.enabled', true)) {
      this.item.hide();
      return;
    }

    const state = this.detectContractState();
    switch (state) {
      case 'active':
        this.item.text = `${DNA} contract active`;
        this.item.tooltip = 'GNOMATIX: all-help-no-harm pact agreed for this session. Click to open contract.';
        // green
        this.item.color = new vscode.ThemeColor('charts.green');
        this.item.backgroundColor = undefined;
        break;
      case 'pending':
        this.item.text = `${DNA} contract pending`;
        this.item.tooltip = 'GNOMATIX: pact not yet established for this session. Click to open contract.';
        // yellow / warning
        this.item.color = new vscode.ThemeColor('charts.yellow');
        this.item.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground',
        );
        break;
      case 'declined':
        this.item.text = `${BLOCK} contract declined`;
        this.item.tooltip = 'GNOMATIX: pact was declined for this session. Click to review.';
        // red / error
        this.item.color = new vscode.ThemeColor('charts.red');
        this.item.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground',
        );
        break;
      default:
        this.item.text = `${DNA} contract unknown`;
        this.item.tooltip = 'GNOMATIX: contract state could not be determined. Click to open contract.';
        this.item.color = undefined;
        this.item.backgroundColor = undefined;
    }
    this.item.show();
  }

  /**
   * Inspect .claude/pact-agreements/ for the most recent session pact.
   *
   * Defensive: any fs error returns 'unknown' rather than throwing.
   */
  private detectContractState(): ContractState {
    const dir = this.resolvePactDir();
    if (!dir) {
      return 'unknown';
    }
    let entries: string[];
    try {
      if (!fs.existsSync(dir)) {
        return 'pending';
      }
      entries = fs.readdirSync(dir).filter((n) => n.endsWith('.json'));
    } catch (err) {
      // Permissions denied, etc. Don't crash the status bar.
      this.warn(err, `readdir ${dir}`);
      return 'unknown';
    }
    if (entries.length === 0) {
      return 'pending';
    }

    // Pick most recently modified.
    let newestPath = '';
    let newestMtime = 0;
    for (const name of entries) {
      const full = path.join(dir, name);
      try {
        const st = fs.statSync(full);
        if (st.mtimeMs > newestMtime) {
          newestMtime = st.mtimeMs;
          newestPath = full;
        }
      } catch (err) {
        this.warn(err, `stat ${full}`);
      }
    }
    if (!newestPath) {
      return 'pending';
    }

    try {
      const raw = fs.readFileSync(newestPath, 'utf8');
      const parsed = JSON.parse(raw) as { status?: string };
      const status = (parsed.status || '').toLowerCase();
      if (status === 'agreed' || status === 'active' || status === 'accepted') {
        return 'active';
      }
      if (status === 'declined' || status === 'rejected') {
        return 'declined';
      }
      return 'pending';
    } catch (err) {
      this.warn(err, `read pact ${newestPath}`);
      return 'unknown';
    }
  }

  private resolvePactDir(): string | undefined {
    const folders = vscode.workspace.workspaceFolders || [];
    if (folders.length === 0) {
      return undefined;
    }
    return path.join(
      folders[0].uri.fsPath,
      '.claude',
      'pact-agreements',
    );
  }

  private warn(err: unknown, context: string): void {
    const code = (err as NodeJS.ErrnoException)?.code;
    // Don't log noisy ENOENT (the most common "not yet set up" case).
    if (code === 'ENOENT') {
      return;
    }
    console.error(`[gnomatix.statusBar] ${context}:`, err);
  }
}
