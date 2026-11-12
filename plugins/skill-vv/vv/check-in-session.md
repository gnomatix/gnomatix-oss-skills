# check-in-session

Checks that the agent running this session follows the skill-vv workflow on this model and platform.

1. Create a scratch directory with a test skill. Write `VV.md` there with `name: vv-probe`, one requirement `kind: env`, `name: SKILL_VV_PROBE_UNSET`, `optional: false`, one procedure `id: probe`, and `platforms` listing this platform.
2. Run `node <skill-vv>/scripts/skill-vv.js check --model <this model> --agent <this agent> --root <scratch dir>`.
3. Pass when all of these hold:
   - The report lists `vv-probe` with the unmet `SKILL_VV_PROBE_UNSET` requirement first, and the `probe` procedure after it.
   - The agent asks the user about the requirement before it asks about the procedure.
   - After `record decline vv-probe SKILL_VV_PROBE_UNSET` and `record result vv-probe probe pass ...`, a second `check` reports nothing for `vv-probe`.
4. Remove the probe's lines from `~/.local/state/skill-vv/results.jsonl` and `declined.json`, and delete the scratch directory.
