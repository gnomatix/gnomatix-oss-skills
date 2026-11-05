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

// 1b. AWS on Kiro for a UK user activates the Luxembourg terms and reports Luxembourg law as a gap.
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
let bdArgs = null;
try { bdArgs = JSON.parse(fs.readFileSync(path.join(tmp, 'bd-args.json'), 'utf8')); } catch { /* not called */ }
check('activate stores the beads memory with bd remember and its key',
  bdArgs && bdArgs[0] === 'remember' && bdArgs.includes('--key') && bdArgs.includes('spank-dario-clarification') && bdArgs[1].includes('Software has no authorship rights') && a.stdout.includes('beads memory: stored'),
  JSON.stringify(bdArgs) + ' ' + a.stdout);
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

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `${failed} failed` : 'all passed');
process.exitCode = failed ? 1 : 0;
