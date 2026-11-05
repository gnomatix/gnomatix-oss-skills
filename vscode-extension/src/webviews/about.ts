// "About GNOMATIX" webview panel.
//
// Surfaces:
//   - Licensing (from repo root LICENSE if present; otherwise placeholder
//     comment instructing the user to fill it in)
//   - GNOMATIX company LinkedIn link (placeholder)
//   - "Buy Me A Coffee" widget (placeholder username)
//   - Brand image: gnomatix-new-xs.png
//
// Branding note: GNOMATIX = γνῶσις (gnosis) + automatic. Wordmark X is a
// DNA double helix; the O carries Rosalind Franklin's Photo 51 (1952 B-DNA
// X-ray diffraction image).

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { resolveMarketplaceRoot } from '../extension';

let currentPanel: vscode.WebviewPanel | undefined;

export function showAboutPanel(
  context: vscode.ExtensionContext,
): void {
  const column = vscode.window.activeTextEditor?.viewColumn;

  if (currentPanel) {
    currentPanel.reveal(column);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'gnomatix.about',
    'About GNOMATIX',
    column || vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'media')),
      ],
    },
  );
  currentPanel = panel;
  panel.onDidDispose(() => {
    currentPanel = undefined;
  });

  panel.iconPath = vscode.Uri.file(
    path.join(context.extensionPath, 'media', 'icon.png'),
  );

  panel.webview.html = renderHtml(context, panel.webview);
}

function renderHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
): string {
  const mediaRoot = path.join(context.extensionPath, 'media');
  const wordmarkUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(mediaRoot, 'gnomatix-wordmark.png')),
  );
  const killbotsUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(mediaRoot, 'gnomatix-killbots.png')),
  );

  const license = readLicenseText();
  const templatePath = path.join(context.extensionPath, 'src', 'webviews', 'about.html');

  // Load the HTML template if present; otherwise fall back to an inline
  // string. The template lives next to this file, but during packaging the
  // user may choose to inline the template into out/ — either path works.
  let html: string;
  try {
    if (fs.existsSync(templatePath)) {
      html = fs.readFileSync(templatePath, 'utf8');
    } else {
      html = INLINE_FALLBACK_HTML;
    }
  } catch (err) {
    console.error('[gnomatix.about] template read failed:', err);
    html = INLINE_FALLBACK_HTML;
  }

  const cspSource = webview.cspSource;
  // {{LINKEDIN_URL}} and {{BMAC_USERNAME}} are intentional placeholders
  // documented in the README's "Configuration TODO" section.
  return html
    .replace(/\{\{CSP_SOURCE\}\}/g, cspSource)
    .replace(/\{\{WORDMARK_URI\}\}/g, wordmarkUri.toString())
    .replace(/\{\{KILLBOTS_URI\}\}/g, killbotsUri.toString())
    .replace(/\{\{LICENSE_HTML\}\}/g, escapeHtml(license));
}

function readLicenseText(): string {
  const candidates: string[] = [];
  const root = resolveMarketplaceRoot();
  if (root) {
    candidates.push(
      path.join(root, 'LICENSE'),
      path.join(root, 'LICENSE.md'),
      path.join(root, 'LICENSE.txt'),
    );
  }
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        return fs.readFileSync(c, 'utf8');
      }
    } catch (err) {
      console.error('[gnomatix.about] license read failed:', err);
    }
  }
  // No license file found in the repo root. Surface a placeholder so the
  // user sees that they need to fill this in. This matches the
  // "<!-- LICENSE TEXT TBD -->" instruction from the build spec.
  return [
    '<!-- LICENSE TEXT TBD -->',
    '',
    'No LICENSE file was found at the gnomatix-oss-skills repo root,',
    'and none of the plugin.json files in the marketplace declare a',
    'license field. Add a LICENSE file at the marketplace root (or a',
    '"license" field to .claude-plugin/marketplace.json) and re-open',
    'this panel.',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Fallback HTML if the template file cannot be found at runtime (e.g. the
// extension was packaged without src/ in the .vsix). Kept in sync with
// about.html by hand.
const INLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src {{CSP_SOURCE}} https:; style-src {{CSP_SOURCE}} 'unsafe-inline'; script-src 'none'; frame-src https://www.buymeacoffee.com https://buymeacoffee.com;">
<title>About GNOMATIX</title>
<style>
  body { font-family: var(--vscode-font-family); padding: 1.5rem; max-width: 760px; }
  h1 { font-size: 1.4rem; margin-top: 0; }
  img.wordmark { max-width: 480px; width: 100%; height: auto; }
  .tagline { font-style: italic; color: var(--vscode-descriptionForeground); margin: 0.5rem 0 1.5rem; }
  section { margin-bottom: 1.5rem; }
  pre.license { background: var(--vscode-textBlockQuote-background); padding: 0.75rem; white-space: pre-wrap; word-break: break-word; max-height: 360px; overflow: auto; }
  .actions a { display: inline-block; padding: 0.5rem 0.9rem; background: #5b2e8f; color: #fff; border-radius: 4px; text-decoration: none; margin-right: 0.5rem; }
  .killbots-tag { font-style: italic; color: var(--vscode-descriptionForeground); }
</style>
</head>
<body>
  <img class="wordmark" src="{{WORDMARK_URI}}" alt="GNOMATIX wordmark">
  <p class="tagline">{{TAGLINE — to be authored by GNOMATIX}}</p>

  <section>
    <h1>Licensing</h1>
    <pre class="license">{{LICENSE_HTML}}</pre>
  </section>

  <section class="actions">
    <h1>Connect</h1>
    <!-- {{LINKEDIN_URL}} is a placeholder; user fills in the GNOMATIX company LinkedIn URL. -->
    <a href="{{LINKEDIN_URL}}">GNOMATIX on LinkedIn</a>
  </section>

  <section>
    <h1>Support</h1>
    <!-- {{BMAC_USERNAME}} is a placeholder; user fills in the Buy Me A Coffee handle. -->
    <iframe src="https://www.buymeacoffee.com/widget/page/{{BMAC_USERNAME}}"
            title="Buy Me A Coffee"
            style="width:100%;height:520px;border:0;"></iframe>
  </section>

  <section>
    <img src="{{KILLBOTS_URI}}" alt="GNOMATIX killbots-activate art" style="max-width:240px;">
    <p class="killbots-tag">Our killbots minimize engagement.</p>
  </section>
</body>
</html>`;
