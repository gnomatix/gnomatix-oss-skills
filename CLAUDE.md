# Repository guidance for Claude Code sessions in gnomatix-oss-skills

This file loads at every Claude Code session that opens this repository. The directives below apply to all work done in this repository.

## Hook portability requirement

Hook scripts in this marketplace MUST be cross-platform runnable on the platforms Claude Code supports (Linux, macOS, Windows). Avoid reaching for shell calls, Unix-only paths, or platform-specific APIs unless cross-platform behavior has been verified.

### Default: pure Node ECMAScript

Author hook scripts in pure Node.js using only:

- `require('fs')` — `fs.readFileSync`, `fs.writeFileSync`, `fs.existsSync`, `fs.mkdirSync({ recursive: true })`, and other native fs methods that have consistent behavior across platforms
- `require('path')` — `path.join`, `path.basename`, `path.dirname`, `path.sep`, `path.extname` for all path construction and manipulation; never hardcode `/` or `\\` as separators
- `process.stdin`, `process.stdout`, `process.cwd()`, `process.platform`, `process.env`
- `JSON.parse`, `JSON.stringify` for serialization
- Native JavaScript built-ins: `Array`, `String`, `RegExp`, `Date`, `Map`, `Set`, `Promise`, async/await, template literals, destructuring

### Prohibited by default

- `require('child_process')` and any subprocess invocation (`exec`, `spawn`, `execSync`, etc.). Shell semantics differ across platforms; subprocess calls leak platform assumptions.
- Hardcoded Unix paths: `/tmp`, `/var/log`, `/usr/local`, `/home/<user>`, etc. Use `os.tmpdir()`, `os.homedir()`, or `process.env.HOME || process.env.USERPROFILE` if a home-directory equivalent is required.
- Hardcoded path separators in string literals. Always use `path.join` or `path.sep`.
- Line-splitting that assumes one EOL convention. Always tolerate CRLF: `text.split(/\r?\n/)`.
- File-extension matching that ignores Windows executable suffixes. When parsing command tokens, strip `.exe`, `.bat`, `.cmd`, `.com`, `.ps1`, `.sh` extensions before comparing.
- Reliance on shell features (glob expansion, environment variable interpolation, pipe semantics) — handle these in JavaScript directly.
- Shebang lines `#!/usr/bin/env node` as the invocation mechanism. Shebangs are decorative on Windows. The actual invocation must be via `node ${CLAUDE_PLUGIN_ROOT}/hooks/<file>.js` in the `hooks.json` command field, which is platform-neutral.

### Performance escape hatch: Go binary fallback

If a hook script requires performance beyond what pure Node can provide (e.g., a PreToolUse hook invoked on every Bash call that becomes a bottleneck, or pattern-matching against very large log corpora), author an equivalent Go implementation, cross-compile binaries for all supported platforms, and distribute them alongside the JS in the plugin's `hooks/` directory:

```
hooks/
  my-hook.js              # Pure Node fallback (always present)
  bin/
    my-hook-linux-amd64
    my-hook-linux-arm64
    my-hook-darwin-amd64
    my-hook-darwin-arm64
    my-hook-windows-amd64.exe
    my-hook-windows-arm64.exe
```

The `hooks.json` command field selects the appropriate binary per platform, or falls back to the JS:

```json
{
  "command": "${CLAUDE_PLUGIN_ROOT}/hooks/bin/my-hook-${platform}-${arch}${exe} || node ${CLAUDE_PLUGIN_ROOT}/hooks/my-hook.js"
}
```

Cross-compilation uses Go's native `GOOS` and `GOARCH` targeting:

```bash
GOOS=linux  GOARCH=amd64 go build -o hooks/bin/my-hook-linux-amd64  ./cmd/my-hook
GOOS=linux  GOARCH=arm64 go build -o hooks/bin/my-hook-linux-arm64  ./cmd/my-hook
GOOS=darwin GOARCH=amd64 go build -o hooks/bin/my-hook-darwin-amd64 ./cmd/my-hook
GOOS=darwin GOARCH=arm64 go build -o hooks/bin/my-hook-darwin-arm64 ./cmd/my-hook
GOOS=windows GOARCH=amd64 go build -o hooks/bin/my-hook-windows-amd64.exe ./cmd/my-hook
GOOS=windows GOARCH=arm64 go build -o hooks/bin/my-hook-windows-arm64.exe ./cmd/my-hook
```

The Go binaries are statically linked, have no runtime dependencies, and are committed to the repository. The pure-Node version is retained as a fallback for platforms not pre-built or for users who prefer Node.

Go is the only language permitted as the performance fallback. Do NOT fall back to Python, Rust (because of compile-time and toolchain weight), Bash (because of platform-non-portability), or any other language without explicit user authorization.

## Filesystem-operation robustness requirement

Filesystem-related issues are the most common source of plugin failures across platforms. Hook scripts MUST handle filesystem operations with redundancy, defensive checks, and proper error-handling and recovery. Avoid happy-path code that assumes files exist, directories are writable, paths resolve cleanly, and operations complete atomically.

### Required patterns

- **Every `fs.*` call wrapped in try/catch.** No exceptions. A failed filesystem operation must not crash the hook process. The hook returns a pass-through decision and logs the error to stderr; it does not abort.
- **Idempotent directory creation** via `fs.mkdirSync(dir, { recursive: true })`. The `recursive: true` flag is required — it tolerates EEXIST, creates intermediate directories, and is idempotent across concurrent invocations. Never use plain `fs.mkdirSync(dir)` without the recursive flag.
- **Atomic writes** via temp-file-plus-rename. To write a file safely:

    ```javascript
    function atomicWrite(targetPath, contents) {
      const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
      try {
        fs.writeFileSync(tmpPath, contents, 'utf8');
        fs.renameSync(tmpPath, targetPath);
        return true;
      } catch (err) {
        try { fs.unlinkSync(tmpPath); } catch { /* cleanup best-effort */ }
        return false;
      }
    }
    ```

  Partial writes from a crashed hook must not leave the target file in a corrupt state. Rename is atomic on POSIX and atomic-enough on Windows for the common cases.
- **Existence checks before reads.** Use `fs.existsSync(p)` before `fs.readFileSync(p)`, OR wrap the read in try/catch that handles ENOENT explicitly. Do not assume a file exists because it existed on the previous check — TOCTOU races are real.
- **Explicit error-code handling.** When catching, check the error code and handle the predictable ones explicitly:

    | Code | Meaning | Default handling |
    |---|---|---|
    | `ENOENT` | File or directory does not exist | Treat as "not found"; do not propagate |
    | `EACCES` / `EPERM` | Permission denied | Log to stderr; pass-through hook decision |
    | `EEXIST` | File / directory already exists | If during mkdir, ignore; if during write, treat as conflict |
    | `EBUSY` / `ETXTBSY` | File is locked or in use (Windows-common) | Brief retry with exponential backoff up to 3 attempts |
    | `EMFILE` / `ENFILE` | Too many open files | Log and pass through |
    | `ENOSPC` | No space left on device | Log and pass through |
    | `ENAMETOOLONG` | Path exceeds platform limit (Windows: 260 chars) | Log with full path; pass through |

- **Windows path-length tolerance.** Windows has a default 260-character MAX_PATH limit (unless long-path support is enabled in registry). Construct paths conservatively. If a constructed path approaches 240 chars, log a warning. Do not assume long paths work.
- **Case sensitivity awareness.** Linux is case-sensitive; macOS APFS is configurable but defaults case-insensitive; Windows NTFS is case-insensitive by default. Do not assume two paths that differ only in case point to different files. When matching paths against allowlists or denylists, normalize to lowercase on Windows / macOS, exact-match on Linux.
- **No assumptions about working directory.** Always use absolute paths constructed from `process.cwd()`, `payload.cwd`, or `os.homedir()`. Never assume the hook is invoked with a particular `cwd`.
- **Graceful degradation.** If a filesystem operation fails, the hook degrades to a safer mode (e.g., pass-through decision) rather than crashing. The hook's role is to inform the harness, not to enforce filesystem invariants.

### Recovery patterns

- Reads that may race against writes: retry once after a 50ms delay, then fail gracefully.
- Writes that hit EBUSY (Windows): exponential backoff with up to 3 attempts at 50ms / 200ms / 1000ms.
- Missing directories: attempt `fs.mkdirSync(dir, { recursive: true })` and retry the operation once.
- Stale lock files: detect by mtime > 60s old and clean up before retrying.

### Pre-flight validation

Before any filesystem operation, validate:

- Path is non-empty and is a string
- Path does not contain `..` traversal that would escape the intended scope
- Path is absolute (or explicitly relative to a known root)
- Path length is within platform limits

### Audit existing hooks

When editing an existing hook, audit it against this requirement and add missing protections.

### Reusable module / production-ready standard

When the same filesystem-robustness patterns appear in multiple plugins, do not duplicate the implementation per plugin. Two acceptable approaches, in order of preference:

1. **Vendor a production-ready npm package.** The battle-tested standards for this domain:
   - **`graceful-fs`** (Isaac Schlueter; powers npm itself) — drop-in `fs` replacement handling EMFILE backoff, EBUSY retries on Windows, etc. Tiny (~3 KB), zero runtime dependencies, used at industrial scale.
   - **`write-file-atomic`** (Isaac Schlueter) — atomic file writes via temp-file + rename, with the cross-platform corner cases handled correctly.
   - **`proper-lockfile`** — production-ready cross-platform file locking when actual mutual exclusion is required.

   Vendor these into the plugin's `hooks/node_modules/` directory so the plugin is self-contained. Node's `require()` resolution finds them automatically. Commit the vendored `node_modules/` to the repo (this is a legitimate vendoring pattern for distributed CLI tools and is how Electron apps, standalone Node binaries via `pkg`, and similar tools ship).

2. **Author a shared utility module within this repo.** Create the canonical version at `lib/fs-safe.js` at the marketplace root. Each plugin vendors a copy at `<plugin>/hooks/lib/fs-safe.js` (a sync script in `lib/sync.sh` or similar maintains the copies). Hooks import via `require('./lib/fs-safe')`. The module uses only Node built-ins; it is the marketplace's own production-ready standard implementing the patterns documented above.

The choice between the two depends on the pattern complexity. For small numbers of well-understood operations (one or two `fs` calls per hook), inline implementations following the patterns in the previous sections are acceptable and avoid the vendoring/sync complexity. For complex filesystem workflows (multi-stage atomic operations, file locking, race-condition handling), the production-ready package is the right tool — do not author novel filesystem-coordination code when battle-tested packages exist.

Avoid the reach for "I'll write my own retry loop" or "I'll handle the temp-file rename inline" — use the production-ready standard, vendor it if necessary, and document the choice in the plugin's README so users and future sessions can audit the implementation.

## Per-plugin scope

This file is repo-level engineering guidance only. Each plugin in this marketplace has its own scope, purpose, and behavior governed by that plugin's own documentation (its `CLAUDE.md`, `README.md`, and `SKILL.md` files). Do not assume that any one plugin's directives apply across other plugins, or that the plugins in this marketplace form a unified system. Refer to each plugin's own documentation for that plugin's specific scope.
