# Changelog

All notable changes to the GNOMATIX Skills VS Code extension will be
documented in this file.

The format is based on Keep a Changelog, and this project adheres to
Semantic Versioning.

## [0.1.0] - 2026-05-28

### Added

- Initial scaffold.
- Status bar item showing contract state (active / pending / declined)
  with the DNA-helix glyph U+1F9EC mirroring the GNOMATIX wordmark.
- Activity Bar view container with tree of installed plugins and their
  skills, with per-skill enable / disable state persisted in workspace
  state.
- Command palette commands:
  - `GNOMATIX: Install skills suite`
  - `GNOMATIX: Enable/disable skill`
  - `GNOMATIX: Open contract`
  - `GNOMATIX: View violations log`
  - `GNOMATIX: Reset session contract`
  - `GNOMATIX: Show licensing`
  - `GNOMATIX: Refresh skills view`
- About webview with licensing, GNOMATIX LinkedIn placeholder, Buy Me A
  Coffee widget placeholder, and brand art.
- Configuration schema covering side-hook path, local model path, custom
  criteria file path, log directory, status-bar opt-out, contract
  enforcement strictness, and marketplace root.
- `scripts/copy-assets.js` helper for one-time brand-asset copy.
