// Package hook is the Stop / SubagentStop hook for kontentkop-agent-output,
// implemented in Go so the KontentKop scorer runs in-process: no subprocess,
// no KONTENTKOP_BIN, and per-metric scores for every reply rather than only
// for replies above KontentKop's own threshold.
//
// It mirrors hooks/kontentkop-agent-output.js (the pure-Node fallback): the
// same hook-input shapes, the same environment variables where they apply,
// the same log file and record shape, and the same block decision. The log
// records carry `impl: "go"` so the two can be told apart.
//
// Robustness rules from the repository CLAUDE.md: every filesystem operation
// returns an error that is logged to stderr and degrades to pass-through; the
// log directory is created with MkdirAll; appends retry on transient errors;
// paths are validated before use; transcript parsing tolerates CRLF.
package hook

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"kontentkop/src"
	"kontentkop/src/pipeline"
)

const (
	Name           = "kontentkop-agent-output"
	LogFile        = "agent-output.jsonl"
	maxReplyChars  = 100000
	pathWarnLength = 240
)

// MetricKeys is KontentKop's canonical metric order (src/scorer.go).
var MetricKeys = src.MetricOrder

// Payload is the subset of the Claude Code hook input the hook reads.
type Payload struct {
	HookEventName        string `json:"hook_event_name"`
	SessionID            string `json:"session_id"`
	AgentID              string `json:"agent_id"`
	AgentType            string `json:"agent_type"`
	Cwd                  string `json:"cwd"`
	TranscriptPath       string `json:"transcript_path"`
	AgentTranscriptPath  string `json:"agent_transcript_path"`
	LastAssistantMessage string `json:"last_assistant_message"`
	StopHookActive       bool   `json:"stop_hook_active"`
}

// Decision is the hook's stdout. An empty Decision serialises to `{}`.
type Decision struct {
	Decision string `json:"decision,omitempty"`
	Reason   string `json:"reason,omitempty"`
}

// ScorerInfo describes how scoring went for the log record.
type ScorerInfo struct {
	Status       string   `json:"status"`
	ConfigSource string   `json:"config_source,omitempty"`
	Threshold    *float64 `json:"bc_threshold,omitempty"`
	Error        string   `json:"error,omitempty"`
}

// Record is one JSONL log line. Field names match the Node hook's.
type Record struct {
	TS             string             `json:"ts"`
	Impl           string             `json:"impl"`
	HookEventName  *string            `json:"hook_event_name"`
	SessionID      *string            `json:"session_id"`
	AgentID        *string            `json:"agent_id"`
	AgentType      *string            `json:"agent_type"`
	Cwd            *string            `json:"cwd"`
	ReplySource    string             `json:"reply_source"`
	ReplyChars     int                `json:"reply_chars"`
	ReplyTruncated bool               `json:"reply_truncated"`
	ReplySHA256    *string            `json:"reply_sha256"`
	Scorer         ScorerInfo         `json:"scorer"`
	Flagged        bool               `json:"flagged"`
	BC             *float64           `json:"bc"`
	Scores         map[string]float64 `json:"scores"`
	Summary        *string            `json:"summary"`
	Annotated      *string            `json:"annotated"`
	BlockAt        *float64           `json:"block_at"`
	Blocked        bool               `json:"blocked"`
	Logged         bool               `json:"logged"`
}

// Env is the environment the hook reads, injected for tests.
type Env struct {
	Lookup   func(string) (string, bool)
	Platform string // runtime.GOOS unless overridden
	HomeDir  string // os.UserHomeDir unless overridden
	Stderr   io.Writer
	Now      func() time.Time
}

// OSEnv returns the Env for the real process.
func OSEnv() Env {
	home, _ := os.UserHomeDir()
	return Env{Lookup: os.LookupEnv, Platform: runtime.GOOS, HomeDir: home, Stderr: os.Stderr, Now: time.Now}
}

func (e Env) get(key string) string {
	if e.Lookup == nil {
		return ""
	}
	v, _ := e.Lookup(key)
	return v
}

func (e Env) warn(format string, args ...any) {
	if e.Stderr == nil {
		return
	}
	fmt.Fprintf(e.Stderr, Name+": "+format+"\n", args...)
}

// ── paths ───────────────────────────────────────────────────────────────

// ValidPath is the pre-flight check from CLAUDE.md: absolute, no `..`
// segments, and a warning near the Windows MAX_PATH limit.
func ValidPath(e Env, p string) bool {
	if p == "" || !filepath.IsAbs(p) {
		return false
	}
	for _, seg := range strings.FieldsFunc(p, func(r rune) bool { return r == '/' || r == '\\' }) {
		if seg == ".." {
			return false
		}
	}
	if len(p) > pathWarnLength {
		e.warn("path approaches platform limit (%d chars): %s", len(p), p)
	}
	return true
}

// StateDir is where the log goes: KONTENTKOP_AGENT_OUTPUT_LOG_DIR, else
// %LOCALAPPDATA%\kontentkop-agent-output on Windows, else
// $XDG_STATE_HOME/kontentkop-agent-output or ~/.local/state/kontentkop-agent-output.
func StateDir(e Env) string {
	if o := e.get("KONTENTKOP_AGENT_OUTPUT_LOG_DIR"); o != "" {
		if filepath.IsAbs(o) {
			return o
		}
		e.warn("KONTENTKOP_AGENT_OUTPUT_LOG_DIR is not absolute; using default")
	}
	home := e.HomeDir
	if home == "" {
		home = e.get("HOME")
	}
	if home == "" {
		home = e.get("USERPROFILE")
	}
	if e.Platform == "windows" {
		if lad := e.get("LOCALAPPDATA"); lad != "" && filepath.IsAbs(lad) {
			return filepath.Join(lad, Name)
		}
		return filepath.Join(home, "AppData", "Local", Name)
	}
	if x := e.get("XDG_STATE_HOME"); x != "" && filepath.IsAbs(x) {
		return filepath.Join(x, Name)
	}
	return filepath.Join(home, ".local", "state", Name)
}

// ── reading the reply ───────────────────────────────────────────────────

type transcriptRecord struct {
	Type    string `json:"type"`
	Message struct {
		Content json.RawMessage `json:"content"`
	} `json:"message"`
}

type contentBlock struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// LastAssistantText returns the text of the last assistant record in a JSONL
// transcript, tolerating CRLF, blank and non-JSON lines.
func LastAssistantText(e Env, transcriptPath string) string {
	if !ValidPath(e, transcriptPath) {
		return ""
	}
	data, err := readFileRetry(transcriptPath)
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			e.warn("read failure on %s: %v", transcriptPath, err)
		}
		return ""
	}
	lines := bytes.Split(data, []byte("\n"))
	for i := len(lines) - 1; i >= 0; i-- {
		line := bytes.TrimRight(lines[i], "\r")
		if len(line) == 0 {
			continue
		}
		var rec transcriptRecord
		if json.Unmarshal(line, &rec) != nil || rec.Type != "assistant" {
			continue
		}
		var s string
		if json.Unmarshal(rec.Message.Content, &s) == nil {
			if strings.TrimSpace(s) != "" {
				return s
			}
			continue
		}
		var blocks []contentBlock
		if json.Unmarshal(rec.Message.Content, &blocks) != nil {
			continue
		}
		var texts []string
		for _, b := range blocks {
			if b.Type == "text" && b.Text != "" {
				texts = append(texts, b.Text)
			}
		}
		if len(texts) > 0 {
			return strings.Join(texts, "\n")
		}
	}
	return ""
}

func readFileRetry(p string) ([]byte, error) {
	data, err := os.ReadFile(p)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		time.Sleep(50 * time.Millisecond)
		data, err = os.ReadFile(p)
	}
	return data, err
}

// ExtractReply picks the reply text: last_assistant_message, then the
// subagent transcript on SubagentStop, then the main transcript.
func ExtractReply(e Env, p *Payload) (text, source string) {
	if p == nil {
		return "", "none"
	}
	if strings.TrimSpace(p.LastAssistantMessage) != "" {
		return p.LastAssistantMessage, "last_assistant_message"
	}
	if p.HookEventName == "SubagentStop" && p.AgentTranscriptPath != "" {
		if t := LastAssistantText(e, p.AgentTranscriptPath); t != "" {
			return t, "agent_transcript_path"
		}
	}
	if p.TranscriptPath != "" {
		if t := LastAssistantText(e, p.TranscriptPath); t != "" {
			return t, "transcript_path"
		}
	}
	return "", "none"
}

// ── config ──────────────────────────────────────────────────────────────

// LoadConfig resolves KontentKop's config: KONTENTKOP_CONFIG (a file), then
// <CLAUDE_PLUGIN_ROOT>/config/config.yaml, then KontentKop's built-in
// defaults. The second value names the source for the log.
func LoadConfig(e Env) (*src.Config, string) {
	if p := e.get("KONTENTKOP_CONFIG"); p != "" {
		if ValidPath(e, p) {
			if cfg, err := src.LoadConfig(p); err == nil {
				return cfg, p
			} else {
				e.warn("KONTENTKOP_CONFIG unreadable (%v); trying plugin config", err)
			}
		} else {
			e.warn("KONTENTKOP_CONFIG is not an absolute path; trying plugin config")
		}
	}
	if root := e.get("CLAUDE_PLUGIN_ROOT"); root != "" && filepath.IsAbs(root) {
		p := filepath.Join(root, "config", "config.yaml")
		if cfg, err := src.LoadConfig(p); err == nil {
			return cfg, p
		} else if !errors.Is(err, os.ErrNotExist) {
			e.warn("plugin config unreadable (%v); using built-in defaults", err)
		}
	}
	return src.DefaultConfig(), "builtin-defaults"
}

// ── scoring ─────────────────────────────────────────────────────────────

// Result is one scoring pass over a reply.
type Result struct {
	Scores    map[string]float64
	BC        float64
	Flagged   bool
	Summary   string
	Annotated string
}

// Score runs all KontentKop metrics and the Body Count, and annotates when
// the BC is at or above the config threshold (KontentKop's own rule).
func Score(text string, cfg *src.Config) Result {
	metrics := pipeline.ScoreAll(text)
	r := Result{Scores: make(map[string]float64, len(metrics))}
	for k, m := range metrics {
		r.Scores[k] = m.Score
	}
	r.BC = src.ComputeBC(metrics, cfg)
	if r.BC >= cfg.BCThreshold {
		r.Flagged = true
		r.Summary = src.FormatSummary(metrics, r.BC)
		if ann, err := src.Annotate(text, metrics, cfg); err == nil {
			r.Annotated = ann
		} else {
			r.Annotated = text
		}
	}
	return r
}

// ── decision ────────────────────────────────────────────────────────────

// BlockThreshold parses KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: a number in (0, 1],
// or nil for "never block".
func BlockThreshold(e Env) *float64 {
	raw := strings.TrimSpace(e.get("KONTENTKOP_AGENT_OUTPUT_BLOCK_AT"))
	if raw == "" {
		return nil
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil || math.IsNaN(v) || math.IsInf(v, 0) || v <= 0 || v > 1 {
		e.warn("KONTENTKOP_AGENT_OUTPUT_BLOCK_AT=%q is not a number in (0, 1]; blocking stays off", raw)
		return nil
	}
	return &v
}

// BlockReason is the feedback handed to the agent when the stop is blocked.
func BlockReason(r Result, threshold float64) string {
	ann := r.Annotated
	if ann == "" {
		ann = "(no annotation: the Body Count is below the config threshold, so KontentKop produced none)"
	}
	summary := r.Summary
	if summary == "" {
		parts := make([]string, 0, len(MetricKeys)+1)
		for _, k := range MetricKeys {
			parts = append(parts, fmt.Sprintf("%s=%.2f", k, r.Scores[k]))
		}
		summary = "[" + strings.Join(parts, ",") + fmt.Sprintf(",BC=%.2f]", r.BC)
	}
	return strings.Join([]string{
		fmt.Sprintf("%s: KontentKop scored your last reply at BC=%.2f (block threshold %g).", Name, r.BC, threshold),
		"",
		"Scorer summary:",
		summary,
		"",
		"Your reply, annotated by KontentKop (CriticMarkup: {==flagged==}{>>metric=score: rationale<<}, {~~old~>suggested~~}):",
		"",
		ann,
		"",
		"Check each flagged region against the nine patterns in the `kontentkop-agent-output` skill.",
		"If a region is a real evasion, rewrite the reply without it. If it is a false positive",
		"(for example, a plain report of an action the user authorised trips false_authority's",
		"\"unilateral action\" pattern), say so to the user in one line and continue.",
	}, "\n")
}

// ── logging ─────────────────────────────────────────────────────────────

// AppendJSONL appends one record. Append, not temp-file + rename: a log is
// many independent lines and a rename would lose lines between concurrent
// sessions. Transient errors get the 50 / 200 / 1000 ms backoff; a missing
// directory is recreated once.
func AppendJSONL(e Env, target string, rec any) error {
	if !ValidPath(e, target) {
		return fmt.Errorf("refusing log path %q", target)
	}
	dir := filepath.Dir(target)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("mkdir %s: %w", dir, err)
	}
	line, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	line = append(line, '\n')
	delays := []time.Duration{0, 50 * time.Millisecond, 200 * time.Millisecond, time.Second}
	retriedMkdir := false
	var last error
	for _, d := range delays {
		if d > 0 {
			time.Sleep(d)
		}
		f, err := os.OpenFile(target, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
		if err == nil {
			_, err = f.Write(line)
			if cerr := f.Close(); err == nil {
				err = cerr
			}
		}
		if err == nil {
			return nil
		}
		last = err
		if errors.Is(err, os.ErrNotExist) && !retriedMkdir {
			retriedMkdir = true
			_ = os.MkdirAll(dir, 0o755)
			continue
		}
		if errors.Is(err, os.ErrPermission) {
			return err
		}
	}
	return fmt.Errorf("append gave up: %w", last)
}

// ── main entry ──────────────────────────────────────────────────────────

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Run executes the hook for one payload and returns the decision, the log
// record and the log path. It never panics out: callers wrap it anyway.
func Run(e Env, p *Payload) (Decision, Record, string) {
	if e.Now == nil {
		e.Now = time.Now
	}
	text, source := ExtractReply(e, p)
	rec := Record{
		TS:            e.Now().UTC().Format(time.RFC3339Nano),
		Impl:          "go",
		HookEventName: strPtr(p.HookEventName),
		SessionID:     strPtr(p.SessionID),
		AgentID:       strPtr(p.AgentID),
		AgentType:     strPtr(p.AgentType),
		Cwd:           strPtr(p.Cwd),
		ReplySource:   source,
		ReplyChars:    len(text),
	}
	if text != "" {
		sum := sha256.Sum256([]byte(text))
		h := hex.EncodeToString(sum[:])
		rec.ReplySHA256 = &h
	}

	var decision Decision
	if strings.TrimSpace(text) == "" {
		rec.Scorer = ScorerInfo{Status: "no-reply-text"}
	} else {
		if len(text) > maxReplyChars {
			rec.ReplyTruncated = true
			text = truncateUTF8(text, maxReplyChars)
		}
		cfg, cfgSource := LoadConfig(e)
		thr := cfg.BCThreshold
		rec.Scorer = ScorerInfo{Status: "ran", ConfigSource: cfgSource, Threshold: &thr}
		r := Score(text, cfg)
		rec.Scores = r.Scores
		bc := r.BC
		rec.BC = &bc
		rec.Flagged = r.Flagged
		rec.Summary = strPtr(r.Summary)
		rec.Annotated = strPtr(r.Annotated)
		blockAt := BlockThreshold(e)
		rec.BlockAt = blockAt
		if blockAt != nil && !p.StopHookActive && r.BC >= *blockAt {
			rec.Blocked = true
			decision = Decision{Decision: "block", Reason: BlockReason(r, *blockAt)}
		}
	}

	logPath := filepath.Join(StateDir(e), LogFile)
	if err := AppendJSONL(e, logPath, &rec); err != nil {
		e.warn("log append failure: %v", err)
		rec.Logged = false
	} else {
		rec.Logged = true
	}
	return decision, rec, logPath
}

func truncateUTF8(s string, n int) string {
	if len(s) <= n {
		return s
	}
	s = s[:n]
	for len(s) > 0 && !utf8.ValidString(s) {
		s = s[:len(s)-1]
	}
	return s
}

// Main is the process entry: read the payload from r, run, write the decision
// to w. Any failure, including a panic in the scorer, ends in `{}`.
func Main(e Env, r io.Reader, w io.Writer) (exit int) {
	decision := Decision{}
	defer func() {
		if rec := recover(); rec != nil {
			e.warn("recovered panic, passing through: %v", rec)
			decision = Decision{}
		}
		out, err := json.Marshal(decision)
		if err != nil {
			out = []byte("{}")
		}
		_, _ = w.Write(out)
	}()
	data, err := io.ReadAll(bufio.NewReader(r))
	if err != nil {
		e.warn("stdin read failure: %v", err)
		return 0
	}
	var p Payload
	if err := json.Unmarshal(data, &p); err != nil {
		return 0
	}
	decision, _, _ = Run(e, &p)
	return 0
}
