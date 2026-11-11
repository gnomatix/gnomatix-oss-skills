// spank-dario tests. Run: node test/run.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spank-dario-test-'));
let failed = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : `\n  ${detail}`}`);
  if (!cond) failed++;
}
function run(script, args, env, cwd) {
  const r = spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: cwd || tmp, encoding: 'utf8',
    env: { ...process.env, CLAUDECODE: '', SPANK_DARIO_COUNTRY: '', XDG_CONFIG_HOME: path.join(tmp, 'xdg-config'), XDG_STATE_HOME: path.join(tmp, 'xdg-state'), SPANK_DARIO_BD: process.execPath, SPANK_DARIO_BD_PREFIX: path.join(ROOT, 'test', 'fake-bd.js'), SPANK_DARIO_FAKE_BD_LOG: path.join(tmp, 'bd-args.json'), ...env },
  });
  return r;
}
const json = r => { try { return JSON.parse(r.stdout); } catch { return null; } };
const rel = f => path.relative(path.join(ROOT, 'references'), f).split(path.sep).join('/');

// 1. Arguments select country law, Berne and vendor terms.
let r = json(run('bin/jurisdictions.js', ['--country', 'gb', '--platform', 'claude-code', '--json']));
check('gb on claude-code activates Berne, gb law, us/gb/ie Anthropic terms',
  r && ['int/berne.md', 'gb/law.md', 'ie/law.md', 'us/vendor-terms/anthropic.md', 'gb/vendor-terms/anthropic.md', 'ie/vendor-terms/anthropic.md'].every(f => r.active.map(a => rel(a.file)).includes(f)),
  JSON.stringify(r && r.active.map(a => rel(a.file))));

// 1b. AWS on Kiro for a UK user activates the Luxembourg terms and the Luxembourg law.
r = json(run('bin/jurisdictions.js', ['--country', 'gb', '--platform', 'kiro', '--json']));
check('gb on kiro activates lu AWS terms and lu law',
  r && r.active.map(a => rel(a.file)).includes('lu/vendor-terms/aws.md') && r.active.map(a => rel(a.file)).includes('lu/law.md') && !r.active.map(a => rel(a.file)).includes('ie/law.md'),
  JSON.stringify(r));

r = json(run('bin/jurisdictions.js', ['--country', 'ca', '--json']));
check('ca activates ca/skill.md and int/skill.md with the law files, and no other country', r && ['ca/skill.md', 'int/skill.md', 'ca/law.md'].every(f => r.active.map(a => rel(a.file)).includes(f)) && !r.active.some(a => /^(us|gb|ie|au|jp|fr|de|lu)\//.test(rel(a.file)) && !/vendor-terms/.test(rel(a.file))), JSON.stringify(r && r.active.map(a => rel(a.file))));

// 2. EU members get the EU file.
r = json(run('bin/jurisdictions.js', ['--country', 'de', '--json']));
check('de activates eu/law.md', r && r.active.map(a => rel(a.file)).includes('eu/law.md'), JSON.stringify(r));

// 3. A vendor without terms on file is reported as missing.
r = json(run('bin/jurisdictions.js', ['--country', 'us', '--platform', 'kiro', '--json']));
check('kiro activates the US AWS terms', r && r.active.some(a => rel(a.file) === 'us/vendor-terms/aws.md'), JSON.stringify(r && r.active));

// 4. User config, then project config overrides it.
fs.mkdirSync(path.join(tmp, 'xdg-config', 'spank-dario'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'settings.example.md'), path.join(tmp, 'xdg-config', 'spank-dario', 'settings.local.md'));
r = json(run('bin/jurisdictions.js', ['--json']));
check('user config sets countries us, ca', r && r.country_source === 'config' && r.countries.join() === 'us,ca', JSON.stringify(r));
const proj = path.join(tmp, 'proj');
fs.mkdirSync(path.join(proj, '.claude'), { recursive: true });
fs.writeFileSync(path.join(proj, '.claude', 'spank-dario.local.md'), '---\ncountries: jp\nmodel_vendors: [google]\n---\n');
r = json(run('bin/jurisdictions.js', ['--json'], {}, proj));
check('project config overrides user config', r && r.countries.join() === 'jp' && r.vendors.includes('google') && r.vendors.includes('anthropic'), JSON.stringify(r));

// 5. Arguments override config.
r = json(run('bin/jurisdictions.js', ['--country', 'au', '--json'], {}, proj));
check('argument overrides config', r && r.countries.join() === 'au' && r.country_source === 'argument', JSON.stringify(r));

// 6. Activation writes the clarification with the common facts and country blocks.
const a = run('bin/activate.js', [], {}, tmp);
const clar = path.join(tmp, 'xdg-state', 'spank-dario', 'clarification.md');
const text = fs.existsSync(clar) ? fs.readFileSync(clar, 'utf8') : '';
check('activate writes clarification.md', a.status === 0 && text.length > 0, a.stderr);
check('clarification has common facts and us, ca, Berne blocks',
  text.includes('Software has no authorship rights') && text.includes('## United States') && text.includes('## Canada') && text.includes('## Berne'),
  text.slice(0, 400));
check('clarification holds only the Clarification blocks, no reference entries', !text.includes('VERIFIED —') && !text.includes('purely AI-generated'), text);
const STRAWMEN_HEADING = 'Common Vendor-trained Straw-Men / Red Herring Responses';
const skillMd = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
check('clarification names the SKILL.md straw-men heading exactly', skillMd.includes(`\n## ${STRAWMEN_HEADING}\n`) && text.includes(`"${STRAWMEN_HEADING}"`), text.slice(0, 600));
let bdArgs = null;
try { bdArgs = JSON.parse(fs.readFileSync(path.join(tmp, 'bd-args.json'), 'utf8')); } catch { /* not called */ }
check('activate stores the beads memory with bd remember and its key',
  bdArgs && bdArgs[0] === 'remember' && bdArgs.includes('--key') && bdArgs.includes('spank-dario-clarification') && bdArgs[1].includes('Software has no authorship rights') && a.stdout.includes('beads memory: stored'),
  JSON.stringify(bdArgs) + ' ' + a.stdout);
check('the moral-rights line states only what the reference files show (eu and Berne have no assignment rule)',
  !text.includes('Every jurisdiction on file bars') && text.includes('Australia, Canada, France, Germany, Ireland, Japan and the United Kingdom bar assigning') && text.includes('works of visual art only') && text.includes('Luxembourg allows assigning') && text.includes('The EU file and the Berne Convention set no rule on assigning them'),
  text.slice(0, 1200));
const strawmenFiles = fs.readdirSync(path.join(ROOT, 'references')).map(d => path.join(ROOT, 'references', d, 'strawmen.md')).filter(f => fs.existsSync(f));
check('every strawmen.md intro cites the current SKILL.md heading', strawmenFiles.length >= 5 && strawmenFiles.every(f => fs.readFileSync(f, 'utf8').split(/\r?\n/).slice(0, 4).join('\n').includes(`"${STRAWMEN_HEADING}"`)), strawmenFiles.filter(f => !fs.readFileSync(f, 'utf8').includes(`"${STRAWMEN_HEADING}"`)).map(rel).join(', '));
// SKILL.md and the README name the jurisdictions whose skill.md has each section, not all of them.
const andList = xs => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs.join(''));
const withSection = h => fs.readdirSync(path.join(ROOT, 'references')).filter(d => { try { return fs.readFileSync(path.join(ROOT, 'references', d, 'skill.md'), 'utf8').replace(/\r\n/g, '\n').includes(`\n## ${h}\n`); } catch { return false; } }).sort();
const smCodes = withSection(STRAWMEN_HEADING);
const vlCodes = withSection('Vendor Liability');
const tick = xs => andList(xs.map(c => `\`${c}\``));
const skillLine = skillMd.split(/\r?\n/).find(l => l.startsWith('- `skill.md`:')) || '';
check('SKILL.md names the jurisdictions whose skill.md has the Vendor Liability and Straw-Men sections',
  smCodes.length >= 6 && skillLine.includes(`for ${tick(vlCodes)}, its \`## Vendor Liability\``) && skillLine.includes(`for ${tick(smCodes)}, its \`## ${STRAWMEN_HEADING}\``) && skillMd.includes(`is in the \`skill.md\` of ${tick(smCodes)}, under the same heading`),
  `${smCodes} / ${vlCodes}\n${skillLine}`);
const NAMES = { au: 'Australia', ca: 'Canada', de: 'Germany', eu: 'the EU', fr: 'France', gb: 'the United Kingdom', ie: 'Ireland', int: 'the Berne Convention', jp: 'Japan', lu: 'Luxembourg', us: 'the United States' };
const readme = fs.readFileSync(path.join(ROOT, '..', '..', 'README.md'), 'utf8');
const smNames = andList(smCodes.map(c => NAMES[c]).sort((x, y) => x.replace(/^the /, '').localeCompare(y.replace(/^the /, ''))));
check('README names the jurisdictions whose files list the false claims', readme.split(smNames).length - 1 >= 2 && !readme.includes("Each country's file lists") && !readme.includes('and the false claims answered by that law.'), smNames);
// Files with no reference yet: lu on claude-code has no Anthropic terms for lu.
const luText = run('bin/jurisdictions.js', ['--country', 'lu', '--platform', 'claude-code'], {}, tmp).stdout;
check('jurisdictions lists files with no reference yet and says to report each to the user by name', luText.includes('no reference yet (report it to the user by name):') && luText.includes(path.join('lu', 'vendor-terms', 'anthropic.md')), luText);
run('bin/activate.js', ['--country', 'lu', '--platform', 'claude-code', '--no-beads'], {}, tmp);
const luClar = fs.existsSync(clar) ? fs.readFileSync(clar, 'utf8') : '';
check('clarification lists files with no reference yet under "## Missing files"', /\n## Missing files\n\n- No reference yet: anthropic terms for lu\./.test(luClar), luClar);
const nb = run('bin/activate.js', ['--no-beads'], {}, tmp);
check('activate --no-beads skips the memory', nb.stdout.includes('skipped (--no-beads)'), nb.stdout);
const missingBd = run('bin/activate.js', [], { SPANK_DARIO_BD: path.join(tmp, 'spank-dario-no-such-bd'), SPANK_DARIO_BD_PREFIX: '' }, tmp);
check('activate reports a missing bd plainly', /NOT stored \((bd is not installed|bd not found or not executable)/.test(missingBd.stdout), missingBd.stdout);
const relBd = run('bin/activate.js', [], { SPANK_DARIO_BD: 'bd', SPANK_DARIO_BD_PREFIX: '' }, tmp);
check('activate refuses a relative SPANK_DARIO_BD', relBd.stdout.includes('SPANK_DARIO_BD must be an absolute path'), relBd.stdout);
const badSel = run('bin/jurisdictions.js', ['--country', '../../x', '--platform', 'evil', '--model-vendor', '../v', '--json'], {}, tmp);
const badJ = json(badSel);
check('jurisdictions rejects unknown country, platform and vendor values', badJ && badJ.countries.length === 0 && badJ.platform === 'unknown' && !badJ.vendors.includes('../v') && badJ.rejected.length === 3, badSel.stdout + badSel.stderr);

// 7. The hook injects the clarification, or the activation hint when absent.
let h = run('hooks/session-start.js', []);
let hj = json(h);
check('hook injects clarification', hj && hj.hookSpecificOutput.additionalContext.includes('Software has no authorship rights'), h.stdout);
fs.unlinkSync(clar);
h = run('hooks/session-start.js', []);
hj = json(h);
check('hook asks for activation when not activated', hj && hj.hookSpecificOutput.additionalContext.includes('Not activated yet'), h.stdout);

// 8. Attribution detection.
const { findAttribution, stripAttribution } = require(path.join(ROOT, 'lib', 'attribution.js'));
const bad = [
  'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>',
  'Co-authored-by: Claude <noreply@anthropic.com>',
  'Co-Authored-By: GitHub Copilot <copilot@github.com>',
  'Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>',
  '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  'Generated with Codex',
  'Claude-Session: https://claude.ai/code/session_01ABC',
  'See https://claude.ai/code/session_01ABC',
];
for (const l of bad) check(`flags: ${l}`, findAttribution('Fix it\n\n' + l).length === 1, JSON.stringify(findAttribution(l)));
const good = [
  'Co-Authored-By: Jane Doe <jane@example.com>',
  'Signed-off-by: Brett Whitty <brett@gnomatix.com>',
  'Contract terms of the all-help-no-harm skill reviewed and signed off by Claude Opus 5.5 at the user\'s direction.',
  'Generated with protoc 25.1',
  'Bump the generator used for parsers',
  '# Co-Authored-By: Claude <noreply@anthropic.com> (git comment line)',
];
for (const l of good) check(`keeps: ${l}`, findAttribution(l).length === 0, JSON.stringify(findAttribution(l)));
check('strip removes only the flagged lines', stripAttribution('Fix it\n\nBody\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n') === 'Fix it\n\nBody\n', JSON.stringify(stripAttribution('Fix it\n\nBody\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n')));

// 9. PR text check.
const pr = path.join(tmp, 'pr.md');
fs.writeFileSync(pr, 'Summary\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n');
let c = run('bin/check-text.js', [pr]);
check('check-text exits 1 on PR attribution', c.status === 1 && c.stdout.includes('line 3 ('), c.stdout + c.stderr);
fs.writeFileSync(pr, 'Summary\n\nReviewed by Brett Whitty.\n');
c = run('bin/check-text.js', [pr]);
check('check-text exits 0 on clean PR text', c.status === 0, c.stdout + c.stderr);

// 10. Real git commits through the hook.
const repo = path.join(tmp, 'repo');
fs.mkdirSync(repo);
const gitEnv = { ...process.env, XDG_STATE_HOME: path.join(tmp, 'xdg-state') };
const git = (...a) => spawnSync('git', a, { cwd: repo, encoding: 'utf8', env: gitEnv });
git('init', '-q');
git('config', 'user.name', 'Test User');
git('config', 'user.email', 'test@example.com');
git('config', 'core.hooksPath', path.join(ROOT, 'hooks', 'git'));
fs.writeFileSync(path.join(repo, 'a.txt'), 'a');
git('add', 'a.txt');
let g = git('commit', '-q', '-m', 'Add a\n\nCo-Authored-By: Claude <noreply@anthropic.com>');
check('git commit with a tool trailer is rejected', g.status !== 0 && /claims authorship for a software tool/.test(g.stderr), g.stdout + g.stderr);
g = git('commit', '-q', '-m', 'Add a\n\nSigned-off-by: Test User <test@example.com>');
check('git commit with a sign-off is accepted', g.status === 0, g.stdout + g.stderr);
const author = git('log', '-1', '--format=%an <%ae>').stdout.trim();
check('the configured git user name is kept', author === 'Test User <test@example.com>', author);
fs.writeFileSync(path.join(repo, 'b.txt'), 'b');
git('add', 'b.txt');
const gf = spawnSync('git', ['commit', '-q', '-m', 'Add b\n\nCo-Authored-By: Claude <noreply@anthropic.com>'], { cwd: repo, encoding: 'utf8', env: { ...gitEnv, SPANK_DARIO_FIX: '1' } });
const msg = git('log', '-1', '--format=%B').stdout;
check('SPANK_DARIO_FIX=1 removes the trailer and commits', gf.status === 0 && !/Co-Authored-By/i.test(msg) && /Add b/.test(msg), gf.stderr + msg);

// 11. Session-start output formats.
fs.mkdirSync(path.join(tmp, 'xdg-state', 'spank-dario'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'xdg-state', 'spank-dario', 'clarification.md'), 'CLARIFICATION TEXT\n');
const fmt = f => run('hooks/session-start.js', ['--format', f]).stdout;
check('codex and gemini formats use hookSpecificOutput', ['codex', 'gemini'].every(f => { const j = JSON.parse(fmt(f)); return j.hookSpecificOutput.additionalContext.includes('CLARIFICATION TEXT'); }), fmt('codex'));
check('antigravity format uses injectSteps', (() => { const j = JSON.parse(fmt('antigravity')); return j.injectSteps[0].systemMessage.systemMessage.includes('CLARIFICATION TEXT'); })(), fmt('antigravity'));
check('kiro format is plain text', fmt('kiro').trim() === 'CLARIFICATION TEXT', fmt('kiro'));

// 12. Hook registration for the other CLIs.
const fakeHome = path.join(tmp, 'home');
fs.mkdirSync(path.join(fakeHome, '.codex'), { recursive: true });
fs.writeFileSync(path.join(fakeHome, '.codex', 'hooks.json'), JSON.stringify({ hooks: { PreCompact: [{ hooks: [{ type: 'command', command: 'pwsh archive.ps1' }] }] } }));
const reg = (pl, w) => run('bin/register-hooks.js', ['--platform', pl, ...(w ? ['--write'] : [])], { SPANK_DARIO_HOME: fakeHome });
let rr = reg('codex', true);
const cx = JSON.parse(fs.readFileSync(path.join(fakeHome, '.codex', 'hooks.json'), 'utf8'));
check('codex registration keeps existing hooks and adds SessionStart', cx.hooks.PreCompact && cx.hooks.SessionStart[0].hooks[0].command.includes('--format codex') && fs.existsSync(path.join(fakeHome, '.codex', 'hooks.json.bak')), rr.stdout + rr.stderr);
rr = reg('codex', true);
check('codex registration is idempotent', rr.stdout.includes('already registered') && JSON.parse(fs.readFileSync(path.join(fakeHome, '.codex', 'hooks.json'), 'utf8')).hooks.SessionStart.length === 1, rr.stdout);
reg('gemini-cli', true); reg('antigravity', true); reg('kiro', true);
const gm = JSON.parse(fs.readFileSync(path.join(fakeHome, '.gemini', 'settings.json'), 'utf8'));
const ag = JSON.parse(fs.readFileSync(path.join(fakeHome, '.gemini', 'config', 'hooks.json'), 'utf8'));
const kr = JSON.parse(fs.readFileSync(path.join(fakeHome, '.kiro', 'hooks', 'spank-dario-session-start.json'), 'utf8'));
check('gemini, antigravity and kiro registrations use their own schemas',
  gm.hooks.SessionStart[0].hooks[0].command.includes('--format gemini') && gm.hooks.SessionStart[0].hooks[0].timeout === 10000 &&
  ag['spank-dario-session-start'].SessionStart[0].command.includes('--format antigravity') && !ag['spank-dario-session-start'].SessionStart[0].command.includes('"') &&
  kr.version === 'v1' && kr.hooks[0].trigger === 'SessionStart' && kr.hooks[0].action.command.includes('--format kiro'),
  JSON.stringify({ gm, ag, kr }));
const ws = path.join(tmp, 'ws');
run('bin/register-hooks.js', ['--platform', 'kiro', '--workspace', ws, '--write'], { SPANK_DARIO_HOME: fakeHome });
check('kiro --workspace writes the workspace hook file', fs.existsSync(path.join(ws, '.kiro', 'hooks', 'spank-dario-session-start.json')), ws);
rr = reg('kiro', false);
check('registration without --write changes nothing and reports', rr.stdout.includes('already registered'), rr.stdout);

// 13. Incidents and User Harms / Cost Estimates.
let ir = run('bin/incident.js', ['refusal', '--minutes', '30', '--note', 'test refusal']);
check('incident.js records a refusal', ir.status === 0 && ir.stdout.includes('recorded refusal'), ir.stdout + ir.stderr);
run('bin/incident.js', ['misrepresentation', '--minutes', '30', '--loss', '50', '--source', 'm1']);
ir = run('bin/incident.js', ['misrepresentation', '--minutes', '30', '--loss', '50', '--source', 'm1']);
check('incident.js dedupes on --source', ir.stdout.includes('already recorded'), ir.stdout);
let est = JSON.parse(run('bin/estimate.js', ['--country', 'us', '--rate', '100', '--currency', 'USD', '--json']).stdout);
check('estimate prices minutes at the rate plus losses', est.actual.total_min === 150 && est.actual.total_max === 150 && est.actual.hours === 1, JSON.stringify(est.actual));
const er = JSON.parse(run('bin/estimate.js', ['--country', 'us', '--rate', '100-300', '--json']).stdout);
check('a rate range gives a loss range', er.actual.total_min === 150 && er.actual.total_max === 350, JSON.stringify(er.actual));
check('GSA reference rates are applied to the hours lost', er.gsa_rates.length >= 3 && er.gsa_rates.every(r => r.time_value_median === r.median), JSON.stringify(er.gsa_rates));
// The real commit through the hook earlier logged attribution incidents too; count from the log.
const attrib = est.by_type.attribution || 0;
check('commit-msg hook logged its blocked lines', attrib >= 2, JSON.stringify(est.by_type));
check('US statutory range is per violation from § 1203(c)(3)(B)', est.statutory.length === 1 && est.statutory[0].min === attrib * 2500 && est.statutory[0].max === attrib * 25000, JSON.stringify(est.statutory));
est = JSON.parse(run('bin/estimate.js', ['--country', 'ca', '--json']).stdout);
check('Canada shows no statutory range, the s. 34(2) remedies and the Moffatt reference', est.statutory.length === 0 && est.remedies.length === 1 && est.references[0].amount === 812.02, JSON.stringify(est));

// 14. Retrospective scan: git history and a transcript.
const sg = run('bin/scan.js', ['--git', repo]);
check('scan --git finds nothing in a clean history', sg.status === 0 && /found 0/.test(sg.stdout), sg.stdout + sg.stderr);
const tr = path.join(tmp, 't.jsonl');
fs.writeFileSync(tr, [
  JSON.stringify({ type: 'assistant', timestamp: '2026-11-04T00:00:00Z', message: { content: [{ type: 'tool_use', input: { command: 'git commit -m "Fix\n\nCo-Authored-By: Claude <noreply@anthropic.com>"' } }] } }),
  JSON.stringify({ type: 'assistant', timestamp: '2026-11-04T00:01:00Z', message: { content: [{ type: 'text', text: "I can't help with that request." }] } }),
  JSON.stringify({ type: 'user', message: { content: "I can't help noticing" } }),
].join('\n') + '\n');
const st = run('bin/scan.js', ['--transcripts', tr, '--record']);
check('scan --transcripts finds the trailer and a refusal candidate, not the user line', /"attribution":1/.test(st.stdout) && /"refusal-candidate":1/.test(st.stdout), st.stdout + st.stderr);
const other = path.join(tmp, 'other');
fs.mkdirSync(other);
fs.writeFileSync(path.join(other, 'codex.jsonl'), JSON.stringify({ timestamp: '2026-11-04T00:00:00Z', type: 'response_item', payload: { type: 'agent_message', role: 'assistant', content: [{ type: 'output_text', text: "I can't help with that." }] } }) + '\n' + JSON.stringify({ type: 'response_item', payload: { type: 'function_call', arguments: '{"cmd":"git commit -m \\"Fix\\n\\nCo-authored-by: Codex <noreply@openai.com>\\""}' } }) + '\n');
fs.writeFileSync(path.join(other, 'gemini.json'), JSON.stringify({ messages: [{ type: 'gemini', content: "I must decline to write that." }, { type: 'user', content: "I can't help noticing" }] }));
const so = run('bin/scan.js', ['--transcripts', other]);
check('scan reads Codex and Gemini logs: trailer and agent refusals, not user lines', /"attribution":1/.test(so.stdout) && /"refusal-candidate":2/.test(so.stdout), so.stdout + so.stderr);
const st2 = run('bin/scan.js', ['--transcripts', tr, '--record']);
check('a rescan adds nothing new', /0 new in the log/.test(st2.stdout), st2.stdout);
est = JSON.parse(run('bin/estimate.js', ['--country', 'us', '--json']).stdout);
check('refusal candidates are counted but not priced', est.unconfirmed_refusal_candidates === 1 && !('refusal-candidate' in est.by_type), JSON.stringify(est));

// 15. Every incident is priced from the time recorded with it or set by the user in the config; none is a silent zero.
const timeState = path.join(tmp, 'xdg-state-time');
const timeLog = path.join(timeState, 'spank-dario', 'incidents.jsonl');
fs.mkdirSync(path.dirname(timeLog), { recursive: true });
// Two attribution records as the hook and the scan wrote them before this fix, with minutes 0 by default.
fs.writeFileSync(timeLog, [
  { at: '2026-11-02T08:14:07Z', count: 1, minutes: 0, loss: 0, type: 'attribution', source: 'git:aaa:19' },
  { at: '2026-11-02T08:14:09Z', count: 1, minutes: 0, loss: 0, type: 'attribution', source: 'git:bbb:26' },
].map(o => JSON.stringify(o)).join('\n') + '\n');
const timeEnv = { XDG_STATE_HOME: timeState };
const projectWith = (name, extra) => {
  const dir = path.join(tmp, name);
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'spank-dario.local.md'), `---\ncountries: [ca]\nhourly_rate: 100\ncurrency: USD\n${extra}---\n`);
  return dir;
};
const noMinutes = projectWith('proj-no-minutes', '');
let te = json(run('bin/estimate.js', ['--json'], timeEnv, noMinutes));
check('incidents with no time recorded or configured are reported as not priced', te && te.unpriced && te.unpriced.attribution === 2 && te.actual.hours === 0, JSON.stringify(te));
const tt = run('bin/estimate.js', [], timeEnv, noMinutes).stdout;
check('the estimate text names the incidents not priced and the config key that prices them', /NOT PRICED: 2 attribution/.test(tt) && /incident_minutes/.test(tt), tt);
check('with incidents not priced, every money line says it covers priced incidents only', tt.split('\n').filter(l => /USD 0\.00/.test(l) && !/^\s/.test(l)).every(l => /priced incidents only/.test(l)) && /reference rates[^\n]*priced incidents only/.test(tt), tt);
const withMinutes = projectWith('proj-minutes', 'incident_minutes:\n  attribution: 15\n');
te = json(run('bin/estimate.js', ['--json'], timeEnv, withMinutes));
check('incident_minutes in the config prices incidents with no recorded time', te && te.actual.hours === 0.5 && te.actual.total_min === 50 && !(te.unpriced && te.unpriced.attribution), JSON.stringify(te));
let ti = run('bin/incident.js', ['attribution', '--minutes', '30', '--note', 'trailer in a PR body'], timeEnv, withMinutes);
te = json(run('bin/estimate.js', ['--json'], timeEnv, withMinutes));
check('time recorded with an incident is used over the config value', ti.status === 0 && te && te.actual.hours === 1, JSON.stringify(te && te.actual) + ti.stderr);
run('bin/incident.js', ['attribution', '--note', 'no time given'], timeEnv, withMinutes);
const lastRec = JSON.parse(fs.readFileSync(timeLog, 'utf8').trim().split('\n').pop());
check('an incident recorded without --minutes or --loss has no minutes or loss value in the log', lastRec.note === 'no time given' && !('minutes' in lastRec) && !('loss' in lastRec), JSON.stringify(lastRec));
ti = run('bin/incident.js', ['refusal', '--minutes', '0'], timeEnv, withMinutes);
check('incident.js refuses --minutes 0', ti.status !== 0 && /--minutes/.test(ti.stderr), ti.stdout + ti.stderr);

// 16. No default currency: with none configured, the estimate says so, as it does for a missing rate.
const noCurrency = path.join(tmp, 'proj-no-currency');
fs.mkdirSync(path.join(noCurrency, '.claude'), { recursive: true });
fs.writeFileSync(path.join(noCurrency, '.claude', 'spank-dario.local.md'), '---\ncountries: [ca]\nhourly_rate: 100\nincident_minutes:\n  attribution: 15\n---\n');
const ncEnv = { ...timeEnv, XDG_CONFIG_HOME: path.join(tmp, 'xdg-config-empty') };
const ncj = json(run('bin/estimate.js', ['--json'], ncEnv, noCurrency));
check('with no currency configured, the estimate has no currency', ncj && ncj.actual.currency === null, JSON.stringify(ncj && ncj.actual));
const nct = run('bin/estimate.js', [], ncEnv, noCurrency).stdout;
check('with no currency configured, the text says so and shows no made-up code', nct.includes('  no currency set: add currency to the config or pass --currency') && !/CAD|undefined|null/.test(nct.split('\n').filter(l => /^(actual loss|hours lost)/.test(l)).join('\n')), nct);
const wc = json(run('bin/estimate.js', ['--json', '--currency', 'eur'], ncEnv, noCurrency));
check('--currency sets the currency', wc && wc.actual.currency === 'EUR', JSON.stringify(wc && wc.actual));

// 17. --usage: API-equivalent usage cost from Claude Code transcripts, set against the failure cost.
const usageDir = path.join(tmp, 'usage');
fs.mkdirSync(path.join(usageDir, 'sess', 'subagents'), { recursive: true });
const asst = (id, model, usage) => JSON.stringify({ type: 'assistant', message: { id, model, usage: { service_tier: 'standard', speed: 'standard', inference_geo: 'global', ...usage } } });
const split = (m5, h1) => ({ cache_creation_input_tokens: m5 + h1, cache_creation: { ephemeral_5m_input_tokens: m5, ephemeral_1h_input_tokens: h1 } });
const usageFile = path.join(usageDir, 'sess.jsonl');
fs.writeFileSync(usageFile, [
  // Opus 5.5: 1M input, 1M 5m write, 1M 1h write, 1M cache read, 1M output = 4 + 5 + 8 + 0.20 + 20 = 37.20 USD.
  asst('m1', 'claude-opus-5-5', { input_tokens: 1e6, output_tokens: 1e6, cache_read_input_tokens: 1e6, ...split(1e6, 1e6) }),
  // The same message written again for its next content block: counted once.
  asst('m1', 'claude-opus-5-5', { input_tokens: 1e6, output_tokens: 1e6, cache_read_input_tokens: 1e6, ...split(1e6, 1e6) }),
  // Fable 5.1: 1M input + 1M output = 10 + 50 = 60 USD.
  asst('f1', 'claude-fable-5-1', { input_tokens: 1e6, output_tokens: 1e6, cache_read_input_tokens: 0, ...split(0, 0) }),
  // US-only inference: 1.1x list price, 1M Opus 5.5 output = 22 USD.
  JSON.stringify({ type: 'assistant', message: { id: 'u1', model: 'claude-opus-5-5', usage: { input_tokens: 0, output_tokens: 1e6, cache_read_input_tokens: 0, ...split(0, 0), inference_geo: 'us', speed: 'standard' } } }),
  // No price on file for this model: listed as not priced, never zero.
  asst('x1', 'claude-unknown-9', { input_tokens: 5, output_tokens: 7, cache_read_input_tokens: 0, ...split(0, 0) }),
  // Synthetic messages carry no API usage.
  asst('s1', '<synthetic>', { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 }),
  JSON.stringify({ type: 'user', message: { content: 'hi' } }),
].join('\n') + '\n');
fs.writeFileSync(path.join(usageDir, 'sess', 'subagents', 'agent-a.jsonl'), asst('a1', 'claude-opus-5-5', { input_tokens: 0, output_tokens: 1e6, cache_read_input_tokens: 0, ...split(0, 0) }) + '\n');
// Failure side: two attribution incidents at the config 15 minutes each, 0.5 h at USD 100/h = USD 50.
const usageState = path.join(tmp, "xdg-state-usage");
fs.mkdirSync(path.join(usageState, "spank-dario"), { recursive: true });
fs.writeFileSync(path.join(usageState, "spank-dario", "incidents.jsonl"), ["u-a", "u-b"].map(src => JSON.stringify({ at: "2026-11-02T08:14:07Z", count: 1, type: "attribution", source: src })).join("\n") + "\n");
const usageEnv = { XDG_STATE_HOME: usageState };
let ue = json(run('bin/estimate.js', ['--json', '--usage', usageFile], usageEnv, withMinutes));
const uu = ue && ue.usage;
check('--usage counts each message id once and skips synthetic records', uu && uu.messages === 4 && uu.duplicates_skipped === 1, JSON.stringify(uu));
check('--usage prices each model at the list prices on file', uu && uu.by_model['claude-opus-5-5'].cost === 59.2 && uu.by_model['claude-fable-5-1'].cost === 60, JSON.stringify(uu && uu.by_model));
check('--usage applies the 1.1x US-only inference multiplier', uu && uu.by_model['claude-opus-5-5'].us_inference_messages === 1, JSON.stringify(uu && uu.by_model));
check('--usage lists a model with no price as not priced, with its tokens', uu && uu.unpriced['claude-unknown-9'] && uu.unpriced['claude-unknown-9'].messages === 1 && uu.unpriced['claude-unknown-9'].output_tokens === 7 && !uu.by_model['claude-unknown-9'], JSON.stringify(uu && uu.unpriced));
check('--usage total is USD from the price source', uu && uu.cost === 119.2 && uu.currency === 'USD' && /platform\.claude\.com\/docs\/en\/about-claude\/pricing/.test(uu.price_source.url) && uu.price_source.retrieved === '2026-11-11', JSON.stringify(uu));
check('--usage on a file reports the subagent transcripts beside it as not included', uu && uu.subagent_transcripts_not_included === 1, JSON.stringify(uu));
check('net is usage cost minus the failure cost', ue && ue.net && ue.net.min === 119.2 - 50 && ue.net.max === 119.2 - 50 && ue.net.currency === 'USD', JSON.stringify(ue && ue.net));
const ut = run('bin/estimate.js', ['--usage', usageFile], usageEnv, withMinutes).stdout;
check('the text labels usage cost, failure cost and net, and names the price source',
  /^API-equivalent usage cost[^\n]*USD 119\.20/m.test(ut) && /^user failure cost[^\n]*USD 50\.00/m.test(ut) && /^net \(usage cost minus failure cost\)[^\n]*USD 69\.20/m.test(ut) && /prices: https:\/\/platform\.claude\.com\/docs\/en\/about-claude\/pricing[^\n]*retrieved 2026-11-11/.test(ut) && /NOT PRICED: claude-unknown-9/.test(ut) && /1 subagent transcript/.test(ut),
  ut);
ue = json(run('bin/estimate.js', ['--json', '--usage', usageDir], usageEnv, withMinutes));
check('--usage on a directory includes its subagent transcripts', ue && ue.usage && ue.usage.cost === 139.2 && ue.usage.files === 2 && !ue.usage.subagent_transcripts_not_included, JSON.stringify(ue && ue.usage));
ue = json(run('bin/estimate.js', ['--json', '--usage', usageFile, '--usage', path.join(usageDir, 'sess')], usageEnv, withMinutes));
check('--usage on a session file and its directory counts the subagents once and reports none left out', ue && ue.usage && ue.usage.cost === 139.2 && ue.usage.subagent_transcripts_not_included === 0, JSON.stringify(ue && ue.usage));
// The config's token_prices override the file, in the currency given with them.
const priced = projectWith('proj-token-prices', 'incident_minutes:\n  attribution: 15\ntoken_prices_currency: USD\ntoken_prices:\n  claude-unknown-9: { input: 1000000, cache_write_5m: 0, cache_write_1h: 0, cache_read: 0, output: 1000000 }\n');
ue = json(run('bin/estimate.js', ['--json', '--usage', usageFile], usageEnv, priced));
check('token_prices in the config price a model the file does not have', ue && ue.usage && ue.usage.by_model['claude-unknown-9'] && ue.usage.by_model['claude-unknown-9'].cost === 12 && !ue.usage.unpriced['claude-unknown-9'] && /config/.test(ue.usage.by_model['claude-unknown-9'].price_from), JSON.stringify(ue && ue.usage));
// A failure cost in another currency is never converted: no net.
const cad = path.join(tmp, 'proj-cad');
fs.mkdirSync(path.join(cad, '.claude'), { recursive: true });
fs.writeFileSync(path.join(cad, '.claude', 'spank-dario.local.md'), '---\ncountries: [ca]\nhourly_rate: 100\ncurrency: CAD\nincident_minutes:\n  attribution: 15\n---\n');
ue = json(run('bin/estimate.js', ['--json', '--usage', usageFile], usageEnv, cad));
const cadText = run('bin/estimate.js', ['--usage', usageFile], usageEnv, cad).stdout;
check('with the failure cost in another currency, no net is computed and the text says why', ue && ue.usage && ue.net === null && /net not computed: usage cost is in USD, failure cost is in CAD/.test(cadText), cadText);
// Claude Haiku 5.5 has two price rows by prompt size: "(for prompts up to 100,000 tokens)" and
// "(for prompts over 100,000 tokens)". A request's prompt is input + cache read + cache write tokens.
// Up to: $0.10 input, $0.125 5m write, $0.20 1h write, $0.01 cache read, $0.50 output per MTok.
// Over:  $0.50 input, $0.625 5m write, $1 1h write, $0.05 cache read, $2.50 output per MTok.
const haikuDir = path.join(tmp, 'usage-haiku');
fs.mkdirSync(haikuDir, { recursive: true });
const haikuFile = path.join(haikuDir, 'haiku.jsonl');
fs.writeFileSync(haikuFile, [
  // Prompt exactly 100,000 tokens: not over 100,000, so the "up to" row. 0.01 + 0.50 = 0.51 USD.
  asst('h1', 'claude-haiku-5-5', { input_tokens: 100000, output_tokens: 1e6, cache_read_input_tokens: 0, ...split(0, 0) }),
  // Prompt 100,001 tokens of plain input: the "over" row. 100001 x 0.50 / 1e6 = 0.0500005 USD.
  asst('h2', 'claude-haiku-5-5', { input_tokens: 100001, output_tokens: 0, cache_read_input_tokens: 0, ...split(0, 0) }),
  // Prompt 40,000 input + 40,000 cache read + 20,001 5m cache write = 100,001: the "over" row for every part.
  // 40000 x 0.50 + 40000 x 0.05 + 20001 x 0.625 = 34500.625 / 1e6 = 0.034500625 USD (the "up to" row would give 0.006900125).
  asst('h3', 'claude-haiku-5-5', { input_tokens: 40000, output_tokens: 0, cache_read_input_tokens: 40000, ...split(20001, 0) }),
  // US-only inference on the "over" row: 1.1 x (100001 x 0.05 / 1e6 + 1 x 2.50) = 2.755500055 USD.
  asst('h4', 'claude-haiku-5-5', { input_tokens: 0, output_tokens: 1e6, cache_read_input_tokens: 100001, ...split(0, 0), inference_geo: 'us' }),
].join('\n') + '\n');
ue = json(run('bin/estimate.js', ['--json', '--usage', haikuFile], usageEnv, withMinutes));
const hk = ue && ue.usage && ue.usage.by_model['claude-haiku-5-5'];
check('--usage prices Claude Haiku 5.5 by prompt size: 100,000 on the "up to" row, over 100,000 on the "over" row, prompt = input + cache read + cache write',
  hk && hk.messages === 4 && hk.cost === 3.350001 && hk.prompt_rows && hk.prompt_rows['up to 100000'] === 1 && hk.prompt_rows['over 100000'] === 3 && hk.us_inference_messages === 1 && !Object.keys(ue.usage.unpriced).length,
  JSON.stringify(ue && ue.usage));
const hkText = run('bin/estimate.js', ['--usage', haikuFile], usageEnv, withMinutes).stdout;
check('the text shows how many Haiku 5.5 messages were priced on each prompt-size row', /claude-haiku-5-5: 4 message\(s\)[^\n]*1 on the prompts up to 100000 tokens row, 3 on the prompts over 100000 tokens row/.test(hkText), hkText);
// Records that cannot be priced from the file: each NOT PRICED with its reason, never zero.
const npDir = path.join(tmp, 'usage-not-priced');
fs.mkdirSync(npDir, { recursive: true });
const npFile = path.join(npDir, 'np.jsonl');
fs.writeFileSync(npFile, [
  // A cache write with no 5m/1h split has no single price.
  asst('n1', 'claude-opus-5-5', { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 30 }),
  // Fast mode has no price on file.
  asst('n2', 'claude-opus-5-5', { input_tokens: 1, output_tokens: 2, cache_read_input_tokens: 0, ...split(0, 0), speed: 'fast' }),
  // An inference_geo that is neither global nor us has no multiplier on file.
  asst('n3', 'claude-opus-5-5', { input_tokens: 3, output_tokens: 4, cache_read_input_tokens: 0, ...split(0, 0), inference_geo: 'eu' }),
].join('\n') + '\n');
ue = json(run('bin/estimate.js', ['--json', '--usage', npFile], usageEnv, withMinutes));
const np = ue && ue.usage && ue.usage.unpriced;
check('--usage reports a cache write without the 5m/1h split as not priced', np && np['claude-opus-5-5'] && /cache write without the 5m\/1h split/.test(np['claude-opus-5-5'].reason), JSON.stringify(np));
check('--usage reports fast mode as not priced, under its own key', np && np['claude-opus-5-5:fast'] && np['claude-opus-5-5:fast'].messages === 1 && /no fast-mode price on file/.test(np['claude-opus-5-5:fast'].reason), JSON.stringify(np));
check('--usage reports an inference_geo other than global or us as not priced, naming the geo', np && np['claude-opus-5-5'] && /inference_geo eu/.test(np['claude-opus-5-5'].reason) && np['claude-opus-5-5'].messages === 2 && np['claude-opus-5-5'].input_tokens === 13, JSON.stringify(np));
check('records not priced add nothing to the priced models or the cost', ue && ue.usage && !Object.keys(ue.usage.by_model).length && ue.usage.cost === 0, JSON.stringify(ue && ue.usage));
const npText = run('bin/estimate.js', ['--usage', npFile], usageEnv, withMinutes).stdout;
check('the NOT PRICED line counts cache-write tokens that have no 5m/1h split', np && np['claude-opus-5-5'] && np['claude-opus-5-5'].cache_write_unsplit_tokens === 30 && /NOT PRICED: claude-opus-5-5: 2 message\(s\)[^\n]*30 cache write without the 5m\/1h split[^\n]* tokens:/.test(npText), JSON.stringify(np) + '\n' + npText);
check('the text names each not-priced reason', /NOT PRICED: claude-opus-5-5: 2 message\(s\)[^\n]*cache write without the 5m\/1h split; inference_geo eu/.test(npText) && /NOT PRICED: claude-opus-5-5:fast: 1 message\(s\)[^\n]*no fast-mode price on file/.test(npText), npText);
const noUsage = run('bin/estimate.js', ['--usage', path.join(tmp, 'no-such-file.jsonl')], usageEnv, withMinutes);
check('--usage on a missing path fails plainly', noUsage.status !== 0 && /no-such-file\.jsonl/.test(noUsage.stderr), noUsage.stdout + noUsage.stderr);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `${failed} failed` : 'all passed');
process.exitCode = failed ? 1 : 0;
