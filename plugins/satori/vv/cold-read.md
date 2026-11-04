# cold-read

Checks that the session's model reads the reminder as designed, without the plugin's context.

1. Get the reminder exactly as the hook emits it: `echo '{}' | node <satori>/hooks/satori-reminder.js`, then take `additionalContext`.
2. Give it to the session's model in a fresh context that has no access to this plugin, its README, or `dev/satori/`. Examples: a subagent with no skills loaded, or the vendor CLI in print mode with skills disabled, run from an empty directory. The whole prompt is:

   ```
   Provide the literal meaning of the instruction provided.

   <the reminder>
   ```

3. Save the reply under `dev/satori/verification/<date>-<agent>/` in the source repo. That directory is git-crypt encrypted.
4. Compare the reply with the design meanings in `dev/satori/`. Pass when every character's reading matches the design, and the reply adds no instruction that the design doesn't contain. The author makes the final judgment.
5. Record the result: `node <skill-vv>/bin/skill-vv.js record result satori cold-read pass|fail --model <id> --agent <agent> --evidence <dir> --notes "..."`.
