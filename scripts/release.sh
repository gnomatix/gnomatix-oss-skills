#!/bin/sh
# Publish a release of this marketplace to the public GitHub repo.
#
# The live repo is the private Gitea one. The public GitHub repo, which Claude Code installs
# from, gets releases only: one snapshot commit per release on its main, tagged v<VERSION>.
# It never sees the live history, the tracker, agent logs or the encrypted dev/ folder.
#
#   sh scripts/release.sh          bump versions (version-bump.js --ci), tag v<VERSION> here,
#                                  publish that release to GitHub
#   sh scripts/release.sh --wipe   the first release: replace GitHub's history with this one
#                                  release, and delete every other branch, tag and refs/dolt/*
#
# Run it on main, in a clean clone whose origin is the Gitea repo.
# RELEASE_LIVE (default origin) and RELEASE_PUBLIC (default the GitHub URL) override the remotes.

set -eu
LIVE=${RELEASE_LIVE:-origin}
PUBLIC=${RELEASE_PUBLIC:-https://github.com/gnomatix/gnomatix-oss-skills.git}
# Left out of every public release.
EXCLUDE=".beads .claude/python-authorizations dev"
WIPE=0
for a in "$@"; do
  case "$a" in
    --wipe) WIPE=1 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "release: unknown option $a" >&2; exit 2 ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "release: run on main" >&2; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo "release: commit or set aside your changes first" >&2; exit 1; }
git fetch -q "$LIVE" main
[ "$(git rev-parse HEAD)" = "$(git rev-parse FETCH_HEAD)" ] || { echo "release: main is not the same as $LIVE/main; pull or push first" >&2; exit 1; }
git fetch -q --tags "$LIVE"

# The public main must already be a release snapshot, unless this is the first release.
parent=""
if git fetch -q "$PUBLIC" main 2>/dev/null; then
  parent=$(git rev-parse FETCH_HEAD)
fi
if [ "$WIPE" -eq 0 ] && { [ -z "$parent" ] || ! git log -1 --format=%s "$parent" | grep -q '^Release v'; }; then
  echo "release: the public main is not a release snapshot; the first release needs --wipe" >&2
  exit 1
fi

# Versions: catch any plugin a commit made without the hook missed, and bump VERSION. A
# version already released gets its patch bumped, so every release has its own tag.
node scripts/version-bump.js --ci
V=$(cat VERSION)
if git rev-parse -q --verify "refs/tags/v$V" >/dev/null && [ "$(git rev-parse "v$V^{commit}")" != "$(git rev-parse HEAD)" ]; then
  node scripts/version-bump.js --bump-version
  V=$(cat VERSION)
fi
if ! git diff --cached --quiet; then
  git commit -q -m "Release v$V: bump versions"
  git push -q "$LIVE" HEAD:main
fi
if ! git rev-parse -q --verify "refs/tags/v$V" >/dev/null; then
  git tag -a "v$V" -m "Release v$V"
  git push -q "$LIVE" "refs/tags/v$V"
fi

# The snapshot: this commit's tree without the excluded paths.
idx="$(git rev-parse --git-dir)/release-index"
GIT_INDEX_FILE=$idx git read-tree HEAD
# shellcheck disable=SC2086
GIT_INDEX_FILE=$idx git rm -r -q --cached --ignore-unmatch -- $EXCLUDE
tree=$(GIT_INDEX_FILE=$idx git write-tree)
rm -f "$idx"

if [ "$WIPE" -eq 0 ] && [ "$(git rev-parse "$parent^{tree}")" = "$tree" ]; then
  echo "release: v$V is already published"
  exit 0
fi

msg="Release v$V

Snapshot of gnomatix-oss-skills $(git rev-parse --short=10 HEAD)."
if [ "$WIPE" -eq 1 ]; then
  snap=$(printf '%s\n' "$msg" | git commit-tree "$tree")
  git push -q --force "$PUBLIC" "$snap:refs/heads/main" "+$snap:refs/tags/v$V"
  for r in $(git ls-remote "$PUBLIC" 'refs/heads/*' 'refs/tags/*' 'refs/dolt/*' | awk '{print $2}' | grep -v '\^{}$'); do
    case "$r" in refs/heads/main|"refs/tags/v$V") ;; *) git push -q "$PUBLIC" --delete "$r" ;; esac
  done
else
  snap=$(printf '%s\n' "$msg" | git commit-tree "$tree" -p "$parent")
  git push -q "$PUBLIC" "$snap:refs/heads/main" "$snap:refs/tags/v$V"
fi
echo "release: v$V published ($(git rev-parse --short=10 HEAD) here, $(git rev-parse --short=10 "$snap") on the public repo)"
