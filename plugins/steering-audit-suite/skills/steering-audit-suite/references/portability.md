# Skill Portability and Graceful Degradation

Apply this section when the document being audited is a SKILL or a WORKFLOW that prescribes specific tools. RULE files generally don't need this audit (they prescribe behavior, not tools).

A skill that hard-codes a single tool, platform, or service excludes everyone whose environment differs. Audit for portability and graceful degradation across the dimensions below.

The dimensions and the tool list below are non-exhaustive. When the audited doc references a tool not on these lists, look up its open-source / self-hosted equivalents — don't skip the check just because the tool isn't enumerated here.

## Dimensions

### 1. Operating system

- Does the skill assume Linux, macOS, Windows, or WSL paths and conventions?
- Does it use shell built-ins or commands that differ across `bash`/`zsh`/`pwsh`?
- For commands that differ (e.g., `realpath`, `sed -i`, path separators), is there a fallback?

### 2. Tool ecosystem (proprietary → open-source / self-hosted)

For each named external service or tool, ask: is there an open-source / self-hosted equivalent the skill could detect and use?

Common pairs (illustrative — look up unknown tools when encountered):

| Category | Proprietary / Hosted | OSS / Self-hosted alternatives |
|---|---|---|
| Forges | GitHub | Gitea, Forgejo, GitLab CE, Codeberg |
| Issue tracking | Jira | Gitea Issues, Plane, OpenProject, Redmine |
| Chat | Slack, Discord, MS Teams | Synology Chat, Mattermost, Rocket.Chat, Matrix, Zulip |
| Container runtime | Docker Desktop | Podman, LXD/Incus, containerd, nerdctl |
| Object storage | AWS S3 | MinIO, Garage, SeaweedFS, Ceph RGW |
| CI | GitHub Actions, CircleCI | Gitea Actions, Woodpecker, Drone, Concourse |
| Notes / docs | Notion, Confluence | Outline, BookStack, Wiki.js, Obsidian + sync |
| Cloud DBs | Managed Postgres / Mongo / DynamoDB | Self-hosted via NAS / Docker / LXC |
| AI / LLM endpoints | OpenAI, Anthropic API | Local Ollama, vLLM, llama.cpp, LM Studio |
| Email | Gmail, Outlook 365 | Proton Mail self-hosted, Postfix + Dovecot |
| Calendar | Google Calendar | Radicale, Baikal, Nextcloud Calendar |
| Auth / OIDC | Auth0, Okta, GitHub OAuth | Keycloak, Authelia, Authentik, Dex |
| Search | Algolia, ElasticSearch Cloud | MeiliSearch, Typesense, ElasticSearch self-hosted |
| Monitoring | Datadog, New Relic | Prometheus + Grafana, VictoriaMetrics, Netdata |
| Secrets | AWS Secrets Manager, HashiCorp Vault Cloud | HashiCorp Vault self-hosted, Infisical, Bitwarden |

For each named service in the skill, list the OSS / self-hostable alternatives. If the skill could function with any of them, the dependency should be parameterized, not hard-coded.

### 3. Self-hosting environment

- Does the skill assume cloud-only access patterns (egress to public APIs, OAuth flows that require public callback URLs)?
- Could it work behind a corporate firewall, on a NAS, or on an air-gapped network?
- Does it need internet access at all, or could it run against local resources?

### 4. Detection over hard-coding

A robust skill detects which backend is available rather than naming one. Examples:
- For a "post a chat message" skill: detect Slack/Discord/Mattermost/Synology Chat from configured webhooks; degrade to writing to a log file if none.
- For a "create an issue" skill: detect `gh`, `tea`, or `glab` on PATH and pick what's installed.
- For a "run a container" skill: detect `docker` vs `podman` vs `nerdctl` vs `lxc` and pick what's installed.

### 5. Graceful degradation

When the preferred backend isn't available, what does the skill do?

- **Best:** silently fall back to a working alternative
- **Acceptable:** fall back with a one-line notice to the user
- **Bad:** hard-fail with an error that doesn't explain how to satisfy the requirement
- **Worst:** silently produce wrong output

A degraded path should still produce a useful artifact, even if less convenient than the preferred path.

### 6. Tool versioning and feature flags

- Does the skill assume a recent tool version with a feature that older versions lack?
- Does it gate on capability rather than version?
- Does it explain how to upgrade if the required feature is missing?

### 7. Authorization assumptions

- Does the skill assume a token, API key, or OAuth grant that the user may not have set up?
- Is there a check + helpful setup pointer at the top of the skill, or does it fail mid-execution?

## Output Format for Portability Findings

For each portability dimension that has a finding:

```
### Portability: <dimension>

**Currently assumes:** <what the skill hard-codes>
**Available alternatives:** <list of OSS / self-hosted / equivalent options>
**Detection strategy:** <how the skill could detect which is present>
**Fallback strategy:** <what the skill should do if none is available>
```

## Anti-Pattern: Forcing Generality on Deliberate Specificity

Some skills are intentionally specific to a single tool. Do not propose a portability change for a skill that has a deliberate single-tool dependency. Surface the finding as a question to the owner: "this skill hard-codes X — is that intentional or should it be made portable?"
