// agent-darktriad-check — Stop / SubagentStop hook, Go build.
//
// Reads the Claude Code hook JSON on stdin, scores the agent's last reply with
// KontentKop in-process, appends a log record, and prints `{}` or a block
// decision. Always exits 0: a hook that cannot score must not fail the
// session. See internal/hook for the logic and the Node fallback at
// hooks/agent-darktriad-check.js for the same contract.
package main

import (
	"os"

	"github.com/gnomatix/gnomatix-oss-skills/plugins/agent-darktriad-check/internal/hook"
)

func main() {
	os.Exit(hook.Main(hook.OSEnv(), os.Stdin, os.Stdout))
}
