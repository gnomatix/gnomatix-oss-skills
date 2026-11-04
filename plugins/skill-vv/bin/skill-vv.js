#!/usr/bin/env node
// skill-vv CLI — the same commands for every vendor's agent.
//
//   skill-vv check  --model <id> --agent <agent> [--root <dir>]... [--project <dir>] [--json]
//   skill-vv status <skill> --model <id> --agent <agent> [--root <dir>]...
//   skill-vv record result  <skill> <procedure> pass|fail|deferred --model <id> --agent <agent>
//                           [--notes "..."] [--evidence <path>] [--by <who>] [--into <VV.md>]
//   skill-vv record decline <skill> <requirement>
//
// <agent>: claude-code | gemini-cli | antigravity | codex | kiro

'use strict';

const path = require('path');
const vv = require('../lib/vv');

function opts(args) {
  const o = { _: [], root: [] };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (k === 'json') { o.json = true; continue; }
      const val = args[i + 1];
      i += 1;
      if (k === 'root') o.root.push(val); else o[k] = val;
    } else o._.push(a);
  }
  return o;
}

function main(argv) {
  const o = opts(argv);
  const [cmd, sub, ...rest] = o._;
  const cli = path.resolve(__filename);
  try {
    if (cmd === 'check') {
      const report = vv.check({ model: o.model, agent: o.agent, roots: o.root, projectDir: o.project });
      if (o.json) console.log(JSON.stringify(report, null, 2));
      else { const t = vv.formatReport(report, cli); if (t) console.log(t); }
      return 0;
    }
    if (cmd === 'status') {
      const report = vv.check({ model: o.model, agent: o.agent, roots: o.root, projectDir: o.project });
      const s = report.skills.find((x) => x.name === sub);
      if (!s) { console.error(`no VV.md found for ${sub}`); return 1; }
      console.log(JSON.stringify(Object.assign({ model: report.model, platform: report.platform }, s), null, 2));
      return 0;
    }
    if (cmd === 'record' && sub === 'result') {
      const [name, procedure, result] = rest;
      if (!name || !procedure || !result) throw new Error('usage: record result <skill> <procedure> pass|fail|deferred --model <id> --agent <agent>');
      const e = vv.recordResult({ name, procedure, result, model: o.model, agent: o.agent, notes: o.notes, evidence: o.evidence, by: o.by, into: o.into });
      console.log(`recorded ${e.result}: ${name}/${procedure} on ${e.model}, ${e.platform}${o.into ? ` (also written to ${o.into})` : ''}`);
      return 0;
    }
    if (cmd === 'record' && sub === 'decline') {
      const [name, requirement] = rest;
      if (!name || !requirement) throw new Error('usage: record decline <skill> <requirement>');
      vv.recordDecline(name, requirement);
      console.log(`recorded: ${name} requirement ${requirement} declined`);
      return 0;
    }
    console.error('usage: skill-vv check | status <skill> | record result ... | record decline ...');
    return 2;
  } catch (err) {
    console.error(`skill-vv: ${err.message}`);
    return err.code === 'SKILL_VV_NO_YAML' ? 3 : 1;
  }
}

process.exitCode = main(process.argv.slice(2));
