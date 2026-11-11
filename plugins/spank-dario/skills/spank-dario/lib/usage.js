'use strict';
// spank-dario: API-equivalent usage cost of Claude Code session transcripts, at the list prices in
// references/us/anthropic-api-prices.json (source and read date in that file and its .md), or at the
// user's token_prices from the config. A model with no price is reported as not priced, never zero.

const fs = require('fs');
const path = require('path');

const FIELDS = ['input', 'cache_write_5m', 'cache_write_1h', 'cache_read', 'output'];
const PRICE_FILE = path.join(__dirname, '..', 'references', 'us', 'anthropic-api-prices.json');

function listJsonl(p) {
  const st = fs.statSync(p);
  if (st.isFile()) return [p];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? listJsonl(path.join(p, d.name)) : /\.jsonl$/.test(d.name) ? [path.join(p, d.name)] : []));
}

// Claude Code keeps a session's subagent transcripts in <session>/subagents/ beside <session>.jsonl.
function subagentsBeside(file) {
  const dir = path.join(file.replace(/\.jsonl$/, ''), 'subagents');
  try { return listJsonl(dir); } catch { return []; }
}

function loadPrices(cfg) {
  let file = null;
  try { file = JSON.parse(fs.readFileSync(PRICE_FILE, 'utf8')); } catch (err) {
    if (err.code !== 'ENOENT') process.stderr.write(`spank-dario: cannot read ${PRICE_FILE}: ${err.message}\n`);
  }
  const prices = {};
  let currency = file ? file.currency : null;
  if (file) for (const [m, p] of Object.entries(file.models)) prices[m] = { ...p, from: `${file.url}, retrieved ${file.retrieved}` };
  const own = cfg.token_prices || {};
  if (Object.keys(own).length) {
    // The config's prices are in token_prices_currency. In any other currency than the file's, the file is not used.
    if (currency && cfg.token_prices_currency !== currency) { for (const k of Object.keys(prices)) delete prices[k]; }
    currency = cfg.token_prices_currency;
    for (const [m, p] of Object.entries(own)) prices[m] = { ...p, from: 'config token_prices' };
  }
  return { prices, currency, source: file ? { url: file.url, retrieved: file.retrieved } : null, us_multiplier: file ? file.us_inference_multiplier : null };
}

// A price entry is one row, or prompt_rows chosen by the request's prompt size (Claude Haiku 5.5).
// The pricing page: "A request's prompt length counts all of its input tokens, including cache reads and
// cache writes." A row with prompt_tokens_up_to takes prompts <= that size; prompt_tokens_over takes prompts > it.
function priceRow(price, promptTokens) {
  if (!Array.isArray(price.prompt_rows)) return { row: price, label: null };
  const r = price.prompt_rows.find(x => (x.prompt_tokens_up_to != null ? promptTokens <= x.prompt_tokens_up_to : x.prompt_tokens_over != null && promptTokens > x.prompt_tokens_over));
  if (!r) return { row: null, label: null };
  return { row: r, label: r.prompt_tokens_up_to != null ? `up to ${r.prompt_tokens_up_to}` : `over ${r.prompt_tokens_over}` };
}

// cache_write_unsplit_tokens: cache-write tokens reported without the 5m/1h split. Such a record is never
// priced, so the field is only nonzero on a not-priced bucket, where it keeps those tokens in the totals.
const zero = () => ({ messages: 0, input_tokens: 0, cache_write_5m_tokens: 0, cache_write_1h_tokens: 0, cache_write_unsplit_tokens: 0, cache_read_tokens: 0, output_tokens: 0 });

function usageCost(paths, cfg) {
  const { prices, currency, source, us_multiplier: usMul } = loadPrices(cfg);
  const files = paths.flatMap(p => listJsonl(path.resolve(p)));
  const seen = new Set();
  const byModel = {};
  const unpriced = {};
  let duplicates = 0;
  let subagents = 0;
  const listed = new Set(files);
  for (const f of files) subagents += subagentsBeside(f).filter(s => !listed.has(s)).length;
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch (err) { process.stderr.write(`spank-dario: cannot read ${f}: ${err.code}\n`); continue; }
    let lineNo = 0;
    for (const line of text.split(/\r?\n/)) {
      lineNo++;
      if (!line) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      const m = o && o.type === 'assistant' && o.message;
      const u = m && m.usage;
      if (!u || !m.model || m.model === '<synthetic>') continue;
      const id = m.id || `${f}:${o.uuid || `line ${lineNo}`}`;
      if (seen.has(id)) { duplicates++; continue; }
      seen.add(id);
      const cw = u.cache_creation;
      const t = {
        input_tokens: Number(u.input_tokens) || 0,
        cache_write_5m_tokens: cw ? Number(cw.ephemeral_5m_input_tokens) || 0 : 0,
        cache_write_1h_tokens: cw ? Number(cw.ephemeral_1h_input_tokens) || 0 : 0,
        cache_write_unsplit_tokens: cw ? 0 : Number(u.cache_creation_input_tokens) || 0,
        cache_read_tokens: Number(u.cache_read_input_tokens) || 0,
        output_tokens: Number(u.output_tokens) || 0,
      };
      const fast = u.speed === 'fast';
      const key = fast ? `${m.model}:fast` : m.model;
      const price = prices[key];
      // A cache write without the 5m/1h split has no single price: not priced, rather than a guessed TTL.
      const noSplit = !cw && Number(u.cache_creation_input_tokens) > 0;
      const us = u.inference_geo != null && u.inference_geo !== 'global';
      const prompt = t.input_tokens + t.cache_read_tokens + t.cache_write_5m_tokens + t.cache_write_1h_tokens;
      // The prompt size is only known with the split, so the split is checked before a row is chosen.
      const { row, label } = price && !noSplit ? priceRow(price, prompt) : { row: null, label: null };
      const reason = !price ? (fast ? 'no fast-mode price on file' : 'no price on file') : noSplit ? 'cache write without the 5m/1h split' : !row ? `no price row for a ${prompt}-token prompt` : us && u.inference_geo !== 'us' ? `inference_geo ${u.inference_geo}` : us && !usMul ? 'no US-only multiplier on file' : null;
      if (reason) {
        const b = (unpriced[key] = unpriced[key] || { ...zero(), reason });
        // One model can be not priced for more than one reason: each is named.
        if (!b.reason.split('; ').includes(reason)) b.reason += `; ${reason}`;
        b.messages++;
        for (const k of Object.keys(t)) b[k] += t[k];
        continue;
      }
      const bucket = (byModel[key] = byModel[key] || { ...zero(), us_inference_messages: 0, cost: 0, price_from: price.from });
      bucket.messages++;
      for (const k of Object.keys(t)) bucket[k] += t[k];
      if (label) { bucket.prompt_rows = bucket.prompt_rows || {}; bucket.prompt_rows[label] = (bucket.prompt_rows[label] || 0) + 1; }
      const mul = us ? usMul : 1;
      if (us) bucket.us_inference_messages++;
      bucket.cost += mul * (t.input_tokens * row.input + t.cache_write_5m_tokens * row.cache_write_5m + t.cache_write_1h_tokens * row.cache_write_1h + t.cache_read_tokens * row.cache_read + t.output_tokens * row.output) / 1e6;
    }
  }
  const round = n => Math.round(n * 1e6) / 1e6;
  for (const b of Object.values(byModel)) b.cost = round(b.cost);
  const cost = round(Object.values(byModel).reduce((a, b) => a + b.cost, 0));
  return { files: files.length, messages: seen.size, duplicates_skipped: duplicates, subagent_transcripts_not_included: subagents, by_model: byModel, unpriced, cost, currency, price_source: source };
}

module.exports = { usageCost, FIELDS, PRICE_FILE };
