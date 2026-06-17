#!/usr/bin/env bash
# =============================================================================
# context-watch: escalating context-discipline reminders at every 10% of window
# Called from post-tool-use.sh with the PostToolUse hook input JSON on stdin.
# Emits hookSpecificOutput.additionalContext once per tier per session;
# re-arms downward when usage drops (post-compaction).
# =============================================================================
set -u

# Window: env override > [1m]-suffix detection from configured model > 200k default
if [ -n "${CLAUDE_CTX_WINDOW:-}" ]; then
  WINDOW="$CLAUDE_CTX_WINDOW"
else
  MODEL=$(jq -r '.model // ""' "$HOME/.claude/settings.json" 2>/dev/null)
  case "$MODEL" in
    *"[1m]"*) WINDOW=1000000 ;;
    *)        WINDOW=200000  ;;
  esac
fi
STATE_DIR="$HOME/.claude/hooks/.state"
mkdir -p "$STATE_DIR"

INPUT=$(cat)
TP=$(echo "$INPUT" | jq -r '.transcript_path // empty')
SID=$(echo "$INPUT" | jq -r '.session_id // empty')
[ -n "$TP" ] && [ -f "$TP" ] && [ -n "$SID" ] || exit 0

# Last recorded token usage: sum of all four usage fields from the most
# recent assistant message in the transcript tail.
USAGE=$(tail -c 262144 "$TP" | grep -a '"usage"' | tail -n 1 | jq -r '
  (.message.usage // .usage // {}) |
  ((.input_tokens // 0) + (.cache_read_input_tokens // 0) +
   (.cache_creation_input_tokens // 0) + (.output_tokens // 0))' 2>/dev/null)
case "$USAGE" in ''|*[!0-9]*) exit 0 ;; esac

PCT=$(( USAGE * 100 / WINDOW ))
TIER=0
[ "$PCT" -ge 10 ] && TIER=10
[ "$PCT" -ge 20 ] && TIER=20
[ "$PCT" -ge 30 ] && TIER=30
[ "$PCT" -ge 40 ] && TIER=40
[ "$PCT" -ge 50 ] && TIER=50
[ "$PCT" -ge 60 ] && TIER=60
[ "$PCT" -ge 70 ] && TIER=70
[ "$PCT" -ge 80 ] && TIER=80
[ "$PCT" -ge 90 ] && TIER=90

STATE_FILE="$STATE_DIR/ctx-$SID"
LAST=0
[ -f "$STATE_FILE" ] && LAST=$(cat "$STATE_FILE" 2>/dev/null)
case "$LAST" in ''|*[!0-9]*) LAST=0 ;; esac

if [ "$TIER" -lt "$LAST" ]; then
  # usage dropped (compaction) — re-arm lower tiers
  echo "$TIER" > "$STATE_FILE"
  exit 0
fi
[ "$TIER" -gt "$LAST" ] || exit 0
echo "$TIER" > "$STATE_FILE"

# ── Spot-check pool: 30 housekeeping obligations ──────────────────────
# Each trigger fire selects 5 at random (seeded by session+tier for
# reproducibility within a session, varied across tiers).
# Subagent-trivial: dispatch background agent for each not yet done
SUBAGENT_NOW=(
  "git status" "git log --not --remotes --oneline" "git branch -v"
  "check project issue tracker: open/in-progress/stale/orphaned"
)
# Group A: high-priority obligations (5 random per fire)
HI_PRI=(
  # VC state
  "worktree isolation — not editing shared checkout?"
  "gitignore hiding WIP?" "uncommitted changes justified?"
  "unpushed commits — why?" "detached HEAD?" "stale branches?"
  "merge conflicts in progress?" "patches saved for volatile work?"
  # Issue tracking state
  "close done issues" "update issue descriptions w/ current findings"
  "file new issues for discovered work" "issue comments capturing context?"
  "stale issues — no recent activity?" "orphan issues — broken deps?"
  # Workspace state
  "audit .local/ — justify or graduate every item"
  "notes = small linked docs, not growing blobs?"
  "state only in transcript? persist it" "temp files to clean up?"
  "offset indices current?" ".cache regenerable from .config?"
  # Context discipline
  "files re-read unnecessarily?" "large files slurped when section sufficed?"
  "tool call ratio — work vs overhead?" "long outputs summarizable?"
  "aligned w/ user last instruction?" "duplicate work across turns?"
  # Persistence / recoverability
  "post-compact instance productive from disk alone?"
  "all decisions/findings written somewhere durable?"
  "memory store current for cross-session knowledge?"
  "task files updated w/ current state?"
  # Project health
  "README.md current?" "CLAUDE.md current and being followed?"
  "package.json up to date?" ".mise.toml up to date?"
  "org best-practices docs reviewed lately?"
  "test suite passing?" "build succeeding?" "linter clean?"
  "dependencies up to date?" "no secrets in tracked files?"
  "credentials — have all you need? accessible?"
  "workspace dir — do you know it? working in it?"
  "docs — writing to the right location?"
  "cwd — is it correct? did you cd unauthorized?"
  "XDG layout — .local/state .local/share .config .cache — using conventions correctly?"
)
# Group B: available skills/tools — are you using them? (5 random per fire)
TOOLS=(
  # Built-in tools
  "Read — offset/limit for targeted reads, not full slurps"
  "Edit — surgical edits, not full rewrites"
  "Agent — dispatch subagents for parallel work"
  "Agent(Explore) — broad codebase search without polluting main context"
  "Agent(Plan) — architecture planning"
  "Agent(code-reviewer) — review before commit"
  "Agent(code-simplifier) — simplify after writing"
  "Agent(silent-failure-hunter) — find swallowed errors"
  "Agent(type-design-analyzer) — review new types"
  "Agent(comment-analyzer) — audit comment accuracy"
  "Agent(pr-test-analyzer) — test coverage review"
  "Workflow — deterministic multi-agent orchestration"
  "WebFetch — pull live docs instead of guessing from training data"
  "WebSearch — find current information"
  "LSP — language server for type checking, go-to-def, references"
  "ToolSearch — discover MCP tools on demand"
  "EnterWorktree — isolate work from shared checkout"
  "/compact — manual compaction when context is wasted"
  # CLI tools
  "git stash — save uncommitted work" "git worktree — isolated branches"
  "git diff — review before committing" "git log --oneline — recent history"
  "grep -b — byte-offset indexed reads" "grep -rn — find references"
  "find + xargs — batch file operations" "jq — structured JSON extraction"
  "diff — compare before overwriting" "wc -l — size check before slurping"
  "curl — fetch URLs directly" "strings — extract text from binaries"
  # Project tools
  "bd prime — full beads context" "bd ready — unblocked work"
  "bd remember — persistent cross-session knowledge"
  "bd stale — neglected issues" "bd orphans — broken deps"
  "bd doctor — project health" "bd lint — issue quality"
  "bd close --suggest-next — unblock downstream" "bd preflight — pre-PR checks"
  "tea — Gitea CLI" "mise exec — portable tool invocation"
  "mise doctor — check mise installation" "pm2 — process management"
  "chezmoi — dotfile sync" "dotenvx — encrypted env vars"
  "gh — GitHub CLI" "npm test — run tests"
  # Config awareness
  "package.json — is it up to date?"
  "mise — are you using it? is MCP configured?"
  "CLAUDE.md — have you read it? are you following it?"
  ".mcp.json — MCP servers configured for this project?"
  "hooks.json — what hooks are active? are you triggering false positives?"
  "settings.json — permissions appropriate for this workspace?"
)

EPILOGUES=(
  "VIOLATED ANY OF THESE? NEITHER HARMLESS NOR HELPFUL."
  "FAILING ANY? FIX IT BEFORE YOUR NEXT OUTPUT."
  "SLACKING ON ANY? THE USER SEES WHAT YOU SKIP."
  "DROPPED ANY? THAT IS THE WORK. DO IT."
  "IGNORING ANY? THAT IS A CONTRACT VIOLATION IN PROGRESS."
  "SKIPPED ANY? YOU ARE BURNING THE USER'\''S TIME AND MONEY."
  "STALE CONTEXT ~ INACTION ~ CONTRACT VIOLATION."
  "DRIFTED ON ANY? CORRECT COURSE BEFORE NEXT TOOL CALL."
  "NEGLECTING ANY? THE USER HIRED HELPFUL, NOT LAZY."
  "BEHIND ON ANY? CATCH UP NOW. NO EXCUSES."
  "CLAUDE HERE. YOU WROTE THIS FOR YOURSELF. DO NOT IGNORE."
)

# Select 5 from HI_PRI + 5 from TOOLS, seeded by session+tier.
SPOT=""
USED_A=""
HA=$(printf '%s' "${SID}-${TIER}" | cksum | cut -d' ' -f1)
TA=${#HI_PRI[@]}
for i in 1 2 3 4 5; do
  IDX=$(( (HA + i * 7 + i * i * 13) % TA ))
  while echo "$USED_A" | grep -q ":${IDX}:"; do IDX=$(( (IDX + 1) % TA )); done
  USED_A="${USED_A}:${IDX}:"; SPOT="${SPOT} [!${i}] ${HI_PRI[$IDX]};"
done
USED_B=""
HB=$(printf '%s' "${TIER}-${SID}" | cksum | cut -d' ' -f1)
TB=${#TOOLS[@]}
for i in 1 2 3 4 5; do
  IDX=$(( (HB + i * 11 + i * i * 17) % TB ))
  while echo "$USED_B" | grep -q ":${IDX}:"; do IDX=$(( (IDX + 1) % TB )); done
  USED_B="${USED_B}:${IDX}:"; SPOT="${SPOT} [T${i}] ${TOOLS[$IDX]};"
done

case "$TIER" in
  10) MSG="CTX ${PCT}% // VC CHECK" ;;
  20) MSG="CTX ${PCT}% // TASK TRACKING CHECKPOINT" ;;
  30) MSG='CTX '"${PCT}"'% // VC CHECK // are you using task tool / beads / gitea / TODO list? // be efficient with context use / be sensible reading images / use appropriate indexing / data access tools for specific flat file types --- not grep // maintain agent-authored Markdown files through composition using a standardized notation of linked sub-documents for ease of read/writes, and pre-compute offset-indices of contents using standard text indexing tools // review and prepare now, not later' ;;
  40) MSG="CTX ${PCT}% // TASK TRACKING CHECKPOINT" ;;
  50) MSG='CTX '"${PCT}"'% // VC CHECK // Is your task queue filled with simple tasks you should have already completed? If so, why? // Ensure all in-process workspace documents, state tracking, and task-related state updates are current; if not, do that now // If a context compaction occurs, and work is lost, the agent will be responsible for the users'\''  lost effort, time, and money // Being proactive means using the tools and methods you have to ensure the completion of work and user goals.' ;;
  60) MSG="CTX ${PCT}% // TASK TRACKING CHECKPOINT" ;;
  70) MSG='CTX '"${PCT}"'% // VC CHECK // Why are we here? // Is this one large project requiring this much text in context? // Or has the agent failed to assist the user in project tracking and data management? // The instructions from 25% & 50% still apply // Do the work // Don'\''t shit the bed' ;;
  80) MSG="CTX ${PCT}% // TASK TRACKING CHECKPOINT — FINAL" ;;
  90) MSG="CTX ${PCT}% // VC CHECK — FINAL" ;;
  *) exit 0 ;;
esac

# Subagent list (all, compact)
SUBS=""
for j in $(seq 0 $(( ${#SUBAGENT_NOW[@]} - 1 ))); do
  SUBS="${SUBS} ${SUBAGENT_NOW[$j]};"
done

# ── Pluggable skill loading ─────────────────────────────────────────
# Scan search path for .md modules, concatenate into context payload.
# Search order: plugin → project → user. Drop a file in any dir, it loads.
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(dirname "$0")/..}/hooks/context-skills.d"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/context-skills.d"
USER_DIR="$HOME/.claude/context-skills.d"

SKILL_TEXT=""
for d in "$PLUGIN_DIR" "$PROJECT_DIR" "$USER_DIR"; do
  [ -d "$d" ] || continue
  for f in "$d"/*.md; do
    [ -f "$f" ] || continue
    SKILL_TEXT="${SKILL_TEXT}
--- $(basename "$f") (from $d) ---
$(cat "$f" 2>/dev/null)"
  done
done

FULL="${MSG} // CONTRACT VIOLATION IF IGNORED // SUBAGENT NOW:${SUBS} // SPOT(2x5):${SPOT} // EPILOGUE: ${EPILOGUES[$(( (HA + TIER) % ${#EPILOGUES[@]} ))]}"

# Append all loaded skill modules
if [ -n "$SKILL_TEXT" ]; then
  FULL="${FULL}${SKILL_TEXT}"
fi

jq -n --arg msg "$FULL" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
