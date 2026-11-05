// Status bar item: the GNOMATIX helix. The all-help-no-harm contract is
// always in effect, so the item shows the glyph alone and carries no state.
//
// The DNA-helix glyph U+1F9EC mirrors the GNOMATIX wordmark's stylized X
// (DNA double helix).

import * as vscode from 'vscode';

const DNA = '\u{1F9EC}'; // U+1F9EC DNA

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

    this.item.text = DNA;
    this.item.tooltip = 'GNOMATIX: all-help-no-harm. Click to open the contract.';
    this.item.color = new vscode.ThemeColor('charts.green');
    this.item.backgroundColor = undefined;
    this.item.show();
  }
}
