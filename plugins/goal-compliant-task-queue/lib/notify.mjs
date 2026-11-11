// Post one message to this Claude Code session through its messaging socket (A60-A62).
// The session exports CLAUDE_CODE_MESSAGING_SOCKET (a unix socket path) and CLAUDE_CODE_MESSAGING_TOKEN;
// a client sends the line {"type":"auth","token":"<token>"} first, then the message text.
// Node built-ins only.
import net from 'node:net'

export function notify(text, env = process.env, { timeoutMs = 5000 } = {}) {
  const sock = env.CLAUDE_CODE_MESSAGING_SOCKET, token = env.CLAUDE_CODE_MESSAGING_TOKEN
  if (!sock || !token) return Promise.reject(new Error('CLAUDE_CODE_MESSAGING_SOCKET and CLAUDE_CODE_MESSAGING_TOKEN must be set (they come from the Claude Code session)'))
  if (typeof text !== 'string' || !text.trim()) return Promise.reject(new Error('message text is required'))
  return new Promise((resolve, reject) => {
    const c = net.createConnection(sock)
    const timer = setTimeout(() => { c.destroy(); reject(new Error(`no answer from ${sock} in ${timeoutMs} ms`)) }, timeoutMs)
    c.on('error', e => { clearTimeout(timer); reject(e) })
    c.on('connect', () => {
      c.write(JSON.stringify({ type: 'auth', token }) + '\n')
      c.end(text.endsWith('\n') ? text : text + '\n')
    })
    c.on('close', () => { clearTimeout(timer); resolve({ socket: sock, bytes: Buffer.byteLength(text) }) })
  })
}
