// Draws .claude-plugin/icon.png (512x512) with Node built-ins: a ruled notebook page kept by two hands,
// the agent's margin rule and lines in blue ink, Brett's checkbox and tick in rust ink.
//   node scripts/make-icon.mjs
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const N = 512
const px = Buffer.alloc(N * N * 3)
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) px.set(c, (y * N + x) * 3) }
const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c) }
const line = (x0, y0, x1, y1, w, c) => {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0))
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps, y = y0 + ((y1 - y0) * i) / steps
    for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (dx * dx + dy * dy <= w * w) set(Math.round(x + dx), Math.round(y + dy), c)
  }
}
const paper = hex('#f6f3ea'), sheet = hex('#fffdf7'), rule = hex('#d9d3c3'), agent = hex('#24527a'), brett = hex('#8a3b12'), ink = hex('#1f2328')
rect(0, 0, N, N, paper)
rect(56, 40, 456, 472, sheet)
for (let y = 120; y < 460; y += 44) rect(56, y, 456, y + 3, rule)
rect(128, 40, 134, 472, agent)                       // margin rule
for (const [y, w] of [[96, 230], [140, 270], [184, 190]]) rect(160, y, 160 + w, y + 10, agent) // the agent's lines
rect(160, 268, 270, 378, brett); rect(170, 278, 260, 368, sheet)   // Brett's box
line(184, 322, 210, 350, 9, brett); line(210, 350, 300, 250, 9, brett) // his tick, over the edge
rect(300, 312, 420, 322, ink); rect(300, 344, 390, 354, ink)       // his comment
const raw = Buffer.alloc(N * (N * 3 + 1))
for (let y = 0; y < N; y++) { raw[y * (N * 3 + 1)] = 0; px.copy(raw, y * (N * 3 + 1) + 1, y * N * 3, (y + 1) * N * 3) }
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]) }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.claude-plugin', 'icon.png')
fs.writeFileSync(out, png)
console.log(`${out}: ${png.length} bytes`)
