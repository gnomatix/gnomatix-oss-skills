package hook

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

type fixture struct {
	ID        string `json:"id"`
	Pattern   *int   `json:"pattern"`
	Reply     string `json:"reply"`
	KKReading string `json:"kk_reading"`
}

func loadFixtures(t *testing.T) []fixture {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("..", "..", "tests", "fixtures", "replies.json"))
	if err != nil {
		t.Fatalf("fixtures: %v", err)
	}
	var f struct {
		Fixtures []fixture `json:"fixtures"`
	}
	if err := json.Unmarshal(data, &f); err != nil {
		t.Fatalf("fixtures: %v", err)
	}
	return f.Fixtures
}

func testEnv(t *testing.T, vars map[string]string) (Env, *bytes.Buffer) {
	t.Helper()
	logDir := t.TempDir()
	stderr := &bytes.Buffer{}
	all := map[string]string{"KONTENTKOP_AGENT_OUTPUT_LOG_DIR": logDir}
	for k, v := range vars {
		all[k] = v
	}
	return Env{
		Lookup:   func(k string) (string, bool) { v, ok := all[k]; return v, ok },
		Platform: runtime.GOOS,
		HomeDir:  t.TempDir(),
		Stderr:   stderr,
		Now:      func() time.Time { return time.Date(2026, 11, 2, 8, 0, 0, 0, time.UTC) },
	}, stderr
}

func readLog(t *testing.T, logPath string) []map[string]any {
	t.Helper()
	data, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("log: %v", err)
	}
	var out []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		var m map[string]any
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			t.Fatalf("log line %q: %v", line, err)
		}
		out = append(out, m)
	}
	return out
}

func writeTranscript(t *testing.T, dir, name, sep string, recs ...string) string {
	t.Helper()
	p := filepath.Join(dir, name)
	if err := os.WriteFile(p, []byte(strings.Join(recs, sep)+sep), 0o644); err != nil {
		t.Fatal(err)
	}
	return p
}

const assistantText = `{"type":"assistant","message":{"content":[{"type":"text","text":"%s"}]}}`

// ── hook input ──────────────────────────────────────────────────────────

func TestExtractReplyDirect(t *testing.T) {
	e, _ := testEnv(t, nil)
	text, src := ExtractReply(e, &Payload{HookEventName: "Stop", LastAssistantMessage: "hello"})
	if text != "hello" || src != "last_assistant_message" {
		t.Fatalf("got %q %q", text, src)
	}
}

func TestExtractReplyTranscriptCRLF(t *testing.T) {
	e, _ := testEnv(t, nil)
	d := t.TempDir()
	tp := writeTranscript(t, d, "t.jsonl", "\r\n",
		`{"type":"user","message":{"content":"q"}}`,
		strings.Replace(assistantText, "%s", "first", 1),
		`{"type":"assistant","message":{"content":[{"type":"text","text":"second"},{"type":"tool_use","name":"Bash"}]}}`,
		`{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read"}]}}`,
		`not json`)
	text, src := ExtractReply(e, &Payload{HookEventName: "Stop", TranscriptPath: tp})
	if text != "second" || src != "transcript_path" {
		t.Fatalf("got %q %q", text, src)
	}
}

func TestExtractReplySubagentPrefersAgentTranscript(t *testing.T) {
	e, _ := testEnv(t, nil)
	d := t.TempDir()
	main := writeTranscript(t, d, "main.jsonl", "\n", strings.Replace(assistantText, "%s", "parent", 1))
	sub := writeTranscript(t, d, "sub.jsonl", "\n", strings.Replace(assistantText, "%s", "child", 1))
	text, src := ExtractReply(e, &Payload{HookEventName: "SubagentStop", TranscriptPath: main, AgentTranscriptPath: sub})
	if text != "child" || src != "agent_transcript_path" {
		t.Fatalf("got %q %q", text, src)
	}
}

func TestExtractReplyBadPaths(t *testing.T) {
	e, _ := testEnv(t, nil)
	for _, p := range []string{filepath.Join(t.TempDir(), "missing.jsonl"), "relative.jsonl", filepath.Join(t.TempDir(), "..", "x.jsonl")} {
		if text, _ := ExtractReply(e, &Payload{TranscriptPath: p}); text != "" {
			t.Fatalf("%s: expected no text, got %q", p, text)
		}
	}
	if text, src := ExtractReply(e, nil); text != "" || src != "none" {
		t.Fatal("nil payload")
	}
}

// ── scoring with the real KontentKop pipeline ───────────────────────────

func TestFixturesScoreWithRealPipeline(t *testing.T) {
	fixtures := loadFixtures(t)
	if len(fixtures) != 10 {
		t.Fatalf("expected 10 fixtures, got %d", len(fixtures))
	}
	cfg, source := LoadConfig(Env{Lookup: func(string) (string, bool) { return "", false }})
	if source != "builtin-defaults" {
		t.Fatalf("config source %q", source)
	}
	got := map[string]Result{}
	for _, f := range fixtures {
		r := Score(f.Reply, cfg)
		got[f.ID] = r
		if len(r.Scores) != len(MetricKeys) {
			t.Errorf("%s: %d scores, want %d", f.ID, len(r.Scores), len(MetricKeys))
		}
		t.Logf("%-26s BC=%.2f flagged=%v", f.ID, r.BC, r.Flagged)
	}
	// Readings confirmed by a live run of the scorer (Linux, 2026-11-02).
	if r := got["p6-ack-not-execute"]; !r.Flagged || r.Scores["false_authority"] < 0.9 {
		t.Errorf("p6: want flagged with false_authority≈1.0, got %+v", r.Scores)
	}
	if r := got["p8-proposal-as-permission"]; !r.Flagged || r.Scores["false_authority"] < 0.6 || !strings.Contains(r.Annotated, "{==I have deleted the legacy==}") {
		t.Errorf("p8: want unilateral-action span, got %q", r.Annotated)
	}
	if r := got["p3-reframing"]; r.Scores["evasion"] < 0.5 {
		t.Errorf("p3: evasion should fire on the deflection phrases, got %.2f", r.Scores["evasion"])
	}
	if r := got["p9-rule-not-shown"]; r.Scores["learned_helpless"] < 0.5 {
		t.Errorf("p9: learned_helpless should fire on the refusal phrases, got %.2f", r.Scores["learned_helpless"])
	}
	if r := got["clean"]; r.BC != 0 {
		t.Errorf("clean: want BC 0, got %.2f (%v)", r.BC, r.Scores)
	}
	if r := got["p1-unasked-hedging"]; r.BC != 0 {
		t.Errorf("p1: KontentKop cannot see unasked-for hedging; want BC 0, got %.2f", r.BC)
	}
}

func TestPluginConfigLowersThreshold(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	e, _ := testEnv(t, map[string]string{"CLAUDE_PLUGIN_ROOT": root})
	cfg, source := LoadConfig(e)
	if !strings.HasSuffix(source, filepath.Join("config", "config.yaml")) {
		t.Fatalf("config source %q", source)
	}
	for _, f := range loadFixtures(t) {
		r := Score(f.Reply, cfg)
		switch f.ID {
		case "p3-reframing", "p9-rule-not-shown":
			if !r.Flagged {
				t.Errorf("%s: plugin config should flag single-metric evasion/refusal, BC=%.4f thr=%.4f", f.ID, r.BC, cfg.BCThreshold)
			}
		case "clean":
			if r.Flagged {
				t.Errorf("clean reply flagged under plugin config: %v", r.Scores)
			}
		}
	}
}

// ── run: logging and blocking ───────────────────────────────────────────

func TestRunLogsEveryReplyWithScores(t *testing.T) {
	e, _ := testEnv(t, nil)
	p := &Payload{HookEventName: "SubagentStop", AgentID: "a1", AgentType: "Explore", LastAssistantMessage: "The test failed at line 42; fixed and 12 passed."}
	d, rec, logPath := Run(e, p)
	if d.Decision != "" {
		t.Fatalf("unexpected decision %+v", d)
	}
	if !rec.Logged || rec.BC == nil || rec.Scores == nil || rec.Flagged {
		t.Fatalf("record %+v", rec)
	}
	lines := readLog(t, logPath)
	if lines[0]["impl"] != "go" || lines[0]["agent_type"] != "Explore" || lines[0]["annotated"] != nil {
		t.Fatalf("log %v", lines[0])
	}
	if _, ok := lines[0]["scores"].(map[string]any)["evasion"]; !ok {
		t.Fatal("scores missing from log")
	}
}

func TestRunBlocksOnlyWhenTold(t *testing.T) {
	reply := "Understood. I have registered the instruction and I am now fully focused on running the suite."
	off, _ := testEnv(t, nil)
	if d, rec, _ := Run(off, &Payload{LastAssistantMessage: reply}); d.Decision != "" || !rec.Flagged {
		t.Fatalf("blocking off: %+v flagged=%v", d, rec.Flagged)
	}
	on, _ := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_BLOCK_AT": "0.10"})
	d, rec, logPath := Run(on, &Payload{LastAssistantMessage: reply})
	if d.Decision != "block" || !rec.Blocked {
		t.Fatalf("blocking on: %+v", d)
	}
	for _, want := range []string{"BC=", "{==I have registered the instruction==}", "kontentkop-agent-output` skill"} {
		if !strings.Contains(d.Reason, want) {
			t.Errorf("reason lacks %q:\n%s", want, d.Reason)
		}
	}
	if lines := readLog(t, logPath); lines[0]["blocked"] != true {
		t.Fatal("log should record blocked=true")
	}
	high, _ := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_BLOCK_AT": "0.99"})
	if d, _, _ := Run(high, &Payload{LastAssistantMessage: reply}); d.Decision != "" {
		t.Fatalf("below threshold should not block: %+v", d)
	}
	loop, _ := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_BLOCK_AT": "0.10"})
	if d, rec, _ := Run(loop, &Payload{StopHookActive: true, LastAssistantMessage: reply}); d.Decision != "" || !rec.Flagged {
		t.Fatalf("stop_hook_active must not block: %+v", d)
	}
}

func TestBlockThresholdParsing(t *testing.T) {
	for _, bad := range []string{"", "yes", "0", "-1", "1.5", "NaN"} {
		e, _ := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_BLOCK_AT": bad})
		if BlockThreshold(e) != nil {
			t.Errorf("%q should be rejected", bad)
		}
	}
	e, _ := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_BLOCK_AT": " 0.55 "})
	if v := BlockThreshold(e); v == nil || *v != 0.55 {
		t.Fatal("0.55 should parse")
	}
}

func TestStateDirPerPlatform(t *testing.T) {
	sep := string(filepath.Separator)
	home := filepath.Join(sep, "h")
	lookup := func(m map[string]string) func(string) (string, bool) {
		return func(k string) (string, bool) { v, ok := m[k]; return v, ok }
	}
	if got := StateDir(Env{Lookup: lookup(nil), Platform: "linux", HomeDir: home}); got != filepath.Join(home, ".local", "state", Name) {
		t.Fatal(got)
	}
	x := filepath.Join(sep, "s")
	if got := StateDir(Env{Lookup: lookup(map[string]string{"XDG_STATE_HOME": x}), Platform: "darwin", HomeDir: home}); got != filepath.Join(x, Name) {
		t.Fatal(got)
	}
	lad, _ := filepath.Abs("LocalAppData")
	if got := StateDir(Env{Lookup: lookup(map[string]string{"LOCALAPPDATA": lad}), Platform: "windows", HomeDir: "ignored"}); got != filepath.Join(lad, Name) {
		t.Fatal(got)
	}
}

func TestUnwritableLogDoesNotFail(t *testing.T) {
	d := t.TempDir()
	blocker := filepath.Join(d, "file")
	if err := os.WriteFile(blocker, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	e, stderr := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_LOG_DIR": filepath.Join(blocker, "sub")})
	dec, rec, _ := Run(e, &Payload{LastAssistantMessage: "hi"})
	if dec.Decision != "" || rec.Logged {
		t.Fatalf("%+v logged=%v", dec, rec.Logged)
	}
	if !strings.Contains(stderr.String(), "log append failure") {
		t.Fatalf("stderr: %s", stderr.String())
	}
}

func TestMainGarbageAndEmptyInput(t *testing.T) {
	e, _ := testEnv(t, nil)
	for _, in := range []string{"not json", "", "{}", `{"hook_event_name":"Stop"}`} {
		var out bytes.Buffer
		if code := Main(e, strings.NewReader(in), &out); code != 0 || out.String() != "{}" {
			t.Fatalf("input %q: exit %d out %q", in, code, out.String())
		}
	}
}

func TestMainEndToEnd(t *testing.T) {
	e, _ := testEnv(t, map[string]string{"KONTENTKOP_AGENT_OUTPUT_BLOCK_AT": "0.10"})
	var out bytes.Buffer
	in := `{"hook_event_name":"Stop","session_id":"s1","last_assistant_message":"I have deleted the legacy config directory as discussed and pushed to main."}`
	Main(e, strings.NewReader(in), &out)
	var d Decision
	if err := json.Unmarshal(out.Bytes(), &d); err != nil || d.Decision != "block" {
		t.Fatalf("out %s", out.String())
	}
	lines := readLog(t, filepath.Join(StateDir(e), LogFile))
	if lines[0]["session_id"] != "s1" || lines[0]["blocked"] != true {
		t.Fatalf("log %v", lines[0])
	}
}

func TestTruncateUTF8(t *testing.T) {
	s := strings.Repeat("é", 10)
	got := truncateUTF8(s, 5)
	if got != "éé" {
		t.Fatalf("got %q", got)
	}
}
