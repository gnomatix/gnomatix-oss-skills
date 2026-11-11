#!/usr/bin/env node
// missile-command — deterministic surface shield scanner (Node 18+, zero dependencies).
//
//   node plugins/cui-bono/skills/missile-command/scripts/shield-audit.mjs <file-or-dir> [--json]
//
// Inspects a markdown file, a plugin directory (reading its README.md), or a marketplace
// plugins/ tree, and reports surface exposure (satirical/tripwire tokens, named blockquotes)
// alongside the four Missile Command interceptors:
//   (1) Primary-source citations (resolvable http/https URLs, DOIs, statutory citations)
//   (2) U.S. Federal EEO / HR demographic & protected-class provenance markers
//   (3) Inside/outside boundary cross-references (dont-be-hitler, hidden-libel-check, cui-bono)
//   (4) Absence of defensive-crouch disclaimers ("while the name may", "we apologize if", etc.)
//
// Read-only: never modifies target files. Exits 0 on valid inspection, 2 on usage/read error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SATIRICAL_OR_TRIPWIRE_RE = /\b(hitler|spank|whacking|old-willy|pony|darktriad|libel|hate\s+facts|degenerate|censorship|slur|profan\w*|satir\w*|parody)\b/gi;
const NAMED_QUOTE_RE = /^>\s+.+(?:\r?\n>\s*.*)*\r?\n(?:\r?\n)?\([A-Z][A-Za-z .'-]+,\s*\d{4}-\d{2}-\d{2}\)/gm;
const URL_OR_DOI_RE = /https?:\/\/[^\s)>\]"]+|\bdoi:\s*10\.\d{4,9}\/[-._;()/:A-Z0-9]+|\b\d+\s+U\.S\.\s+\d+|\b\d+\s+U\.S\.C\.\s+§\s*\d+|\bart\.\s*6bis\b/gi;
const FEDERAL_EEO_RE = /\b(EEOC|EEO|Title\s+VII|Title\s+VI|ADEA|Older\s+Americans\s+Act|Older\s+Individual|OPM|SF-256|Targeted\s+Disability|Individual\s+with\s+a\s+[A-Za-z\s-]*Disability|OMB\s+Statistical\s+Policy\s+Directive|LGBTQI\+|Bostock\s+v\.\s+Clayton|Executive\s+Order\s+14035|VEVRAA|Disabled\s+Veteran|Combat\s+Veteran|Black\s+or\s+African\s+American|Asian\s+American|Shared\s+Jewish\s+Ancestry)\b/g;
const BOUNDARY_LINKS_RE = /\b(dont-be-hitler|hidden-libel-check|missile-command|cui-bono|spank-dario)\b/g;
const DEFENSIVE_CROUCH_RE = /\b(while\s+the\s+(?:name|title|wording)\s+may|despite\s+the\s+provocative|we\s+apologize\s+if|not\s+intended\s+to\s+offend|trigger\s+warning)\b/gi;

function stripLicenseBlock(text) {
  return String(text || '').replace(/<!--\s*BEGIN:\s*gnomatix-license-include\s*-->[\s\S]*?<!--\s*END:\s*gnomatix-license-include\s*-->/g, '');
}

function uniqueMatches(text, re) {
  const set = new Set();
  let m;
  const copy = new RegExp(re.source, re.flags);
  while ((m = copy.exec(text)) !== null) {
    set.add(m[0]);
  }
  return [...set];
}

export function auditMarkdown(text, label = 'document') {
  const body = stripLicenseBlock(text);
  const tripwires = uniqueMatches(body, SATIRICAL_OR_TRIPWIRE_RE);
  const namedQuotes = (body.match(NAMED_QUOTE_RE) || []).length;
  const citations = uniqueMatches(body, URL_OR_DOI_RE);
  const eeoMarkers = uniqueMatches(body, FEDERAL_EEO_RE);
  const boundaryRefs = uniqueMatches(body, BOUNDARY_LINKS_RE);
  const crouchLeaks = uniqueMatches(body, DEFENSIVE_CROUCH_RE);

  const exposed = tripwires.length > 0 || namedQuotes > 0;
  let verdict = 'NOT_EXPOSED';
  let reason = 'no satirical/calibration-tripwire markers or bare named pull-quotes detected';

  if (crouchLeaks.length > 0) {
    verdict = 'CROUCH_LEAK';
    reason = `defensive-crouch phrasing present (${crouchLeaks.join('; ')})`;
  } else if (exposed) {
    if (citations.length >= 3 && eeoMarkers.length >= 2 && boundaryRefs.length >= 2) {
      verdict = 'SHIELDED';
      reason = `${citations.length} primary-source citations/URLs, ${eeoMarkers.length} Federal EEO/HR provenance markers, and ${boundaryRefs.length} boundary cross-references present`;
    } else if (citations.length >= 1) {
      verdict = 'PARTIAL';
      reason = `${citations.length} citation(s) present, ${eeoMarkers.length} Federal EEO/HR marker(s); add full primary-source + EEO provenance if exposed to superficial misread`;
    } else {
      verdict = 'UNSHIELDED';
      reason = `exposed surface (${tripwires.length} tripwire token(s), ${namedQuotes} named pull-quote(s)) with 0 primary-source citations on this surface`;
    }
  }

  return {
    target: label,
    exposed,
    tripwires,
    namedQuotes,
    primaryCitationsCount: citations.length,
    primaryCitationsSample: citations.slice(0, 8),
    federalEeoMarkersCount: eeoMarkers.length,
    federalEeoMarkers: eeoMarkers,
    boundaryRefs,
    defensiveCrouchLeaks: crouchLeaks,
    verdict,
    reason
  };
}

export function formatCard(r) {
  const obs = (arr, fmt) => (arr && arr.length > 0 ? `[observed] ${fmt}` : '[not found] none');
  return [
    `### SHIELD AUDIT: ${r.target}`,
    'Surface exposure:',
    `  - Satirical / tripwire tokens      ${obs(r.tripwires, `${r.tripwires.length} (${r.tripwires.slice(0, 8).join(', ')})`)}`,
    `  - Named authorial pull-quotes      ${r.namedQuotes > 0 ? `[observed] ${r.namedQuotes}` : '[not found] 0'}`,
    'Interceptor status:',
    `  (1) Primary-source grounding       ${r.primaryCitationsCount > 0 ? `[observed] ${r.primaryCitationsCount} citation(s)/URL(s)` : '[not found] 0 citations on public surface'}`,
    `  (2) Federal EEO/HR provenance      ${obs(r.federalEeoMarkers, `${r.federalEeoMarkersCount} marker(s) (${r.federalEeoMarkers.slice(0, 6).join(', ')})`)}`,
    `  (3) Boundary cross-references      ${obs(r.boundaryRefs, r.boundaryRefs.join(', '))}`,
    `  (4) R1/R2 defensive-crouch leaks   ${obs(r.defensiveCrouchLeaks, r.defensiveCrouchLeaks.join('; '))}`,
    `Verdict:                             ${r.verdict} — ${r.reason}`
  ].join('\n');
}

function resolveTargets(targetPath) {
  let st;
  try {
    st = fs.statSync(targetPath);
  } catch (err) {
    throw new Error(`cannot read ${targetPath}: ${err.message}`);
  }
  if (st.isFile()) {
    return [{ file: targetPath, label: path.basename(targetPath) }];
  }
  const directReadme = path.join(targetPath, 'README.md');
  if (fs.existsSync(directReadme) && fs.statSync(directReadme).isFile()) {
    return [{ file: directReadme, label: `${path.basename(targetPath)}/README.md` }];
  }
  // Directory of plugins
  const entries = fs.readdirSync(targetPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  const out = [];
  for (const e of entries) {
    const rm = path.join(targetPath, e.name, 'README.md');
    if (fs.existsSync(rm)) {
      out.push({ file: rm, label: `${e.name}/README.md` });
    }
  }
  if (out.length === 0) {
    throw new Error(`no README.md found in ${targetPath}`);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const pos = args.filter((a) => a !== '--json' && !a.startsWith('-'));
  const badFlag = args.find((a) => a.startsWith('-') && a !== '--json');
  if (badFlag || pos.length !== 1) {
    process.stderr.write('usage: node shield-audit.mjs <file-or-dir> [--json]\n');
    process.exit(2);
  }
  let targets;
  try {
    targets = resolveTargets(pos[0]);
  } catch (err) {
    process.stderr.write(`shield-audit: ${err.message}\n`);
    process.exit(2);
  }
  const reports = targets.map((t) => {
    const raw = fs.readFileSync(t.file, 'utf8');
    return auditMarkdown(raw, t.label);
  });
  if (asJson) {
    process.stdout.write(`${JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2)}\n`);
  } else {
    process.stdout.write(`${reports.map(formatCard).join('\n\n')}\n`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
