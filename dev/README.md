# dev/

This directory contains *dirty bits* — work-in-progress agent skills, plugin prototypes, raw research artefacts, vocabularies, and corpus-mining harnesses that aren't yet fit for public consumption.

The contents are encrypted at rest with [`git-crypt`](https://github.com/AGWA/git-crypt) and are unreadable to anyone without the project owner's GPG private key. The `.gitattributes` rule that encrypts this directory exempts this README, so visitors to the public repo see this note instead of opaque blobs.

## Why this is encrypted

- Some of these are skills under active iteration — frameworks, vocabularies, and patterns are still being refined, and pushing them out half-baked would do more harm than good.
- Some include personal data drawn from the project owner's own usage transcripts, lexicons, and workflow patterns. Publishing that raw is not appropriate.
- Some are experimental enough that releasing them under the GNOMATIX marketplace banner before they have been validated would damage the reputation of the public plugins.

## Promotion path

When a `dev/<thing>/` artefact is mature enough to publish, it moves to `plugins/<thing>/` (and gets an entry in `.claude-plugin/marketplace.json`), the `dev/<thing>/` copy is removed, and the encryption rule no longer applies to it.

If you found this README and were hoping for the contents — they're either not ready, or not yours to read. Both are fine.
