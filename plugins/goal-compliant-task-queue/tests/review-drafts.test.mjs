import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

// Exercise the actual shipped template handlers against a failing/delayed page store.
// React's app is bundled in its HTML; extract its app handlers without loading the UI runtime.
const html = fs.readFileSync(new URL('../templates/working-document.html', import.meta.url), 'utf8')
const react = fs.readFileSync(new URL('../templates/working-document.react.html', import.meta.url), 'utf8')
function between(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length)
  assert.ok(a >= 0 && b > a, `template handler markers exist: ${start}`)
  return source.slice(a + start.length, b)
}
const tick = () => new Promise(resolve => setImmediate(resolve))
function harness(kind, { fail = false, delay, text = 'Full user comment' } = {}) {
  const rows = {}, writes = [], sent = [], drafts = { s2: text }
  const doc = { slug: 'question', title: 'Question', status: 'open', sections: [{ id: 's2', title: 'Answer' }], review: { s2: { checked: true, comment: 'previous' } } }
  const db = { doc(key) { return {
    async set(value) {
      if (key !== 'review/_lock') {
        if (delay) await delay
        if (fail) throw new Error('offline')
      }
      rows[key] = structuredClone(value); writes.push(key)
    },
    async delete() { delete rows[key] },
  } } }
  const comments = { async canSendToClaude() { return 'available' }, async anchorFor() { return {} }, async sendToClaude(value) { sent.push(value) } }
  const document = { title: 'Review', getElementById() { return null }, querySelector() { return {} } }
  const ctx = { Date, TextEncoder, document, drafts, rows, writes, sent }
  vm.createContext(ctx)
  if (kind === 'html') {
    Object.assign(ctx, { docs: [doc], HUB: false, live: {}, owner: true, lock: null, sending: false, SEND_LIMIT: 3900, db, comments, canSend: 'available', sendNote: '', render() {} })
    vm.runInContext('function reviewId(' + between(html, '  function reviewId(', '  function material('), ctx)
    vm.runInContext('async function saveReview(' + between(html, '  async function saveReview(', '  function sectionView('), ctx)
    vm.runInContext('function updatesText()' + between(html, '  function updatesText()', '  function pick('), ctx)
    const handler = between(html, 'onclick: function (e) { var b = e.currentTarget, text = ta.value; ', ' } }) : null;')
    ctx.save = async () => {
      Object.assign(ctx, { id: 's2', ta: { value: drafts.s2 }, status: { textContent: '' }, b: {} })
      vm.runInContext('var text = ta.value; ' + handler, ctx)
      await tick()
    }
    ctx.sendNow = () => vm.runInContext('send()', ctx)
    ctx.isLocked = () => !!ctx.lock
  } else {
    Object.assign(ctx, { c: db, f: true, E: null, C: { current: {} }, i() {}, a() {}, tt() {}, e7: x => x,
      t(fn) { ctx.C.current = fn(ctx.C.current) }, r(fn) { ctx.drafts = fn(ctx.drafts) },
      e9: [doc], e: {}, n: drafts, te: (_d, s) => s.id, m: comments, x: false, S() {}, y() {}, k() {}, N(v) { ctx.E = v }, _: { current: {} },
    })
    const save = between(react, 'O=(0,u.useCallback)(', ',[c,f,E]);')
    vm.runInContext('var O = (' + save + ')', ctx)
    const clear = between(react, 'clearDraft:', ',save:O,')
    vm.runInContext('var clear = (' + clear + '); var D = {clearDraft:clear}', ctx)
    const saveHandler = between(react, 'onClick:()=>{n.save(r,{comment:d})', '},children:"Save comment"')
    ctx.save = async () => {
      const click = vm.createContext({ n: { save: ctx.O, clearDraft: ctx.clear }, r: 's2', d: ctx.drafts.s2 })
      vm.runInContext('n.save(r,{comment:d})' + saveHandler, click)
      await tick()
    }
    const send = between(react, 'onClick:()=>{!async function(){', '}()},children:"Send my updates to Claude"')
    vm.runInContext('var sendNow = async function(){' + send + '}', ctx)
    ctx.isLocked = () => !!ctx.E
  }
  return ctx
}

for (const kind of ['html', 'react']) {
  test(`${kind}: failed Save comment retains the draft`, async () => {
    const h = harness(kind, { fail: true })
    await h.save()
    assert.equal(h.drafts.s2, 'Full user comment')
    assert.equal(h.rows['review/s2'], undefined)
  })
  test(`${kind}: successful Save comment clears only the text that was saved`, async () => {
    let release
    const delay = new Promise(resolve => { release = resolve })
    const h = harness(kind, { delay })
    await h.save()
    h.drafts.s2 = 'Newer typing while save is in flight'
    release(); await tick()
    assert.equal(h.rows['review/s2'].comment, 'Full user comment')
    assert.equal(h.drafts.s2, 'Newer typing while save is in flight')
  })
  test(`${kind}: successful Save comment clears the persisted draft`, async () => {
    const h = harness(kind)
    await h.save()
    assert.equal(h.rows['review/s2'].comment, 'Full user comment')
    assert.equal(Object.hasOwn(h.drafts, 's2'), false)
  })
  test(`${kind}: Send persists a full long draft before locking and truncating its message`, async () => {
    const text = 'A user comment '.repeat(600)
    const h = harness(kind, { text })
    await h.sendNow()
    assert.equal(h.rows['review/s2'].comment, text)
    assert.equal(h.rows['review/s2'].checked, true)
    assert.deepEqual(h.writes, ['review/s2', 'review/_lock'])
    assert.equal(h.isLocked(), true)
    assert.equal(h.sent.length, 1)
    const payload = JSON.parse(h.sent[0].text.slice('BRETT-UPDATES '.length))
    assert.ok(payload.sections[0].user_comment.length < text.length)
    assert.equal(Object.hasOwn(h.drafts, 's2'), false)
  })
  test(`${kind}: failed draft persistence prevents Send and leaves editing unlocked`, async () => {
    const h = harness(kind, { fail: true })
    await h.sendNow()
    assert.equal(h.sent.length, 0)
    assert.equal(h.isLocked(), false)
    assert.equal(h.rows['review/_lock'], undefined)
    assert.equal(h.drafts.s2, 'Full user comment')
  })
}
