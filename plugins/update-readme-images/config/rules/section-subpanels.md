# Rules Document — Section & Skills Sub-Panels (`plugins/*/README.md`, `plugins/*/skills/*/SKILL.md`)

- **Rule IDs**: `cui-bono-readme-subpanels`, `agent-darktriad-check-readme-subpanels`, `steering-audit-suite-readme-subpanel`, `pep-readme-subpanel-and-oval-inset`, `skill-markdown-dedicated-subpanels`
- **Applies to (`glob`)**: `plugins/*/README.md` and `plugins/*/skills/*/SKILL.md`
- **Panel Type**: `sub-panel`

## 1. Purpose of Sub-Panels

When a plugin bundles multiple distinct skills, architectural stages, or inspection mechanisms, **Sub-Panels** (`sub-panel`) visually break up dense specification sections (`## Skills`, `## What you get`, `## Contents`, `## Config`) and also serve as the header graphic at the top of the corresponding `skills/<skill>/SKILL.md` file.

## 2. Supported Placement Anchors

1. **`after-heading`** (e.g., `plugins/steering-audit-suite/README.md` under `## Skills`):
   ```markdown
   ## Skills

   ![steering-audit-suite-blueprint](assets/images/steering-audit-suite-blueprint-banner.jpg)
   ```
2. **`after-table-in-section`** (e.g., `plugins/python-elimination-program/README.md` under `## Skills`, and `plugins/agent-darktriad-check/README.md` under `## Contents`):
   - Placed on the line immediately following the Markdown table in the target section, separated by a blank line.
3. **`after-bullet-matching`** (e.g., `plugins/cui-bono/README.md` under `## What you get`):
   - Placed immediately below the specific bullet item describing that sub-skill (`citation-farm-audit`, `source-provenance`), separated by a blank line:
     ```markdown
     - **A network card per claim** (`citation-farm-audit`): ...

     ![citation-farm-audit](assets/images/citation-farm-audit-banner.jpg)
     ```
4. **`end-of-section`** (e.g., `plugins/agent-darktriad-check/README.md` at the end of `## Config`):
   - Placed at the bottom of the named `## <Section>` before the next `##` heading.
5. **`after-h1` in `SKILL.md`** (`plugins/*/skills/*/SKILL.md`):
   - When a sub-skill has its own dedicated panel image in `../../assets/images/<panel>.jpg`, embed it immediately below `# <skill-name>` in `SKILL.md`:
     ```markdown
     # old-willy

     ![old-willy](../../assets/images/old-willy-computer-lab-panel.jpg)
     ```
