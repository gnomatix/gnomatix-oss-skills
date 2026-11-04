#!/usr/bin/env node
// citation-farm-audit: one author's citation profile from OpenAlex.
// Usage: node openalex-profile.mjs <OpenAlex author id, e.g. A5042046671>
// Prints top works, top co-authors, total and self-citing works of the top works, top citing
// authors marked [co-author] when they are one, citing fields, and funders. Node 18+ (built-in fetch).
const id = process.argv[2];
if (!/^A\d+$/.test(id || '')) { console.error('usage: node openalex-profile.mjs <OpenAlex author id, e.g. A5042046671>'); process.exit(2); }
const B = 'https://api.openalex.org/';
const g = async u => { const r = await fetch(B + u); if (!r.ok) throw new Error(`OpenAlex ${r.status} for ${u}`); return r.json(); };
const top = await g(`works?filter=author.id:${id}&sort=cited_by_count:desc&per_page=5&select=id,title,publication_year,cited_by_count,doi`);
const w = top.results.map(x => x.id.split('/').pop()).join('|');
const co = await g(`works?filter=author.id:${id}&group_by=authorships.author.id`);
const citers = await g(`works?filter=cites:${w}&group_by=authorships.author.id`);
const total = (await g(`works?filter=cites:${w}&per_page=1&select=id`)).meta.count;
const self = (await g(`works?filter=cites:${w},author.id:${id}&per_page=1&select=id`)).meta.count;
const fields = await g(`works?filter=cites:${w}&group_by=primary_topic.field.id`);
const funders = await g(`works?filter=author.id:${id}&group_by=funders.id`);
const coset = new Set(co.group_by.slice(0, 40).map(x => x.key));
console.log(JSON.stringify({
  author: id,
  retrieved: new Date().toISOString().slice(0, 10),
  top: top.results.map(x => `${x.publication_year} | cited ${x.cited_by_count} | ${x.title} | ${x.doi}`),
  coauthors: co.group_by.filter(x => !x.key.endsWith(id)).slice(0, 10).map(x => `${x.key_display_name} (${x.count})`),
  citingWorks: total, selfCiting: self,
  topCiters: citers.group_by.filter(x => !x.key.endsWith(id)).slice(0, 10).map(x => `${x.key_display_name}${coset.has(x.key) ? ' [co-author]' : ''} (${x.count})`),
  citerFields: fields.group_by.slice(0, 5).map(x => `${x.key_display_name} ${x.count}`),
  funders: funders.group_by.filter(x => x.key !== 'unknown').slice(0, 6).map(x => `${x.key_display_name} (${x.count})`),
}, null, 1));
