#!/bin/sh
# deps/mise.sh: check for mise and install it on Linux or macOS (the deps/ contract, deps/README.md).
# Installs with mise's official installer (https://mise.run), which checks the download against
# the release's published SHA-256 checksums. Opinionated: no cargo, npm or distro packages.
#
# If mise is already installed anywhere (on PATH or in a usual place), it lists what it found
# and stops. In a terminal it asks before installing another copy; without a terminal it never
# does, unless --yes is given.
#
#   sh deps/mise.sh [--check] [--yes] [--activate]
#     --check     only report the copies found (exit 0 if any, 1 if none); install nothing
#     --yes       install even if a copy exists, without asking
#     --activate  add the activation line for your login shell (zsh, bash or fish) if it isn't there

set -u
CHECK=0; YES=0; ACTIVATE=0
for a in "$@"; do
  case "$a" in
    --check) CHECK=1 ;;
    --yes|-y) YES=1 ;;
    --activate) ACTIVATE=1 ;;
    -h|--help) sed -n '2,13p' "$0" 2>/dev/null || echo "usage: sh deps/mise.sh [--check] [--yes] [--activate]"; exit 0 ;;
    *) echo "deps/mise: unknown option $a" >&2; exit 2 ;;
  esac
done

found=""
add() {
  [ -x "$1" ] || return 0
  case " $found " in *" $1 "*) return 0 ;; esac
  found="$found $1"
}
command -v mise >/dev/null 2>&1 && add "$(command -v mise)"
for p in "$HOME/.local/bin/mise" /usr/local/bin/mise /usr/bin/mise /opt/homebrew/bin/mise \
  /home/linuxbrew/.linuxbrew/bin/mise /opt/local/bin/mise "$HOME/.cargo/bin/mise" /snap/bin/mise \
  "$HOME/.nix-profile/bin/mise"; do
  add "$p"
done

activate() {
  [ "$ACTIVATE" -eq 1 ] || return 0
  m=$(command -v mise 2>/dev/null || echo "$HOME/.local/bin/mise")
  case "$(basename "${SHELL:-sh}")" in
    zsh) rc="${ZDOTDIR:-$HOME}/.zshrc"; line="eval \"\$($m activate zsh)\"" ;;
    bash) rc="$HOME/.bashrc"; line="eval \"\$($m activate bash)\"" ;;
    fish) rc="$HOME/.config/fish/config.fish"; line="$m activate fish | source" ;;
    *) echo "deps/mise: no activation for ${SHELL:-this shell}; see https://mise.jdx.dev/getting-started.html" >&2; return 0 ;;
  esac
  if [ -f "$rc" ] && grep -q 'mise activate' "$rc"; then
    echo "deps/mise: $rc already activates mise; left alone."
  else
    mkdir -p "$(dirname "$rc")"
    printf '\n# mise (added by gnomatix-oss-skills deps/mise.sh)\n%s\n' "$line" >> "$rc"
    echo "deps/mise: added mise activation to $rc (takes effect in a new shell)."
  fi
}

ask() {  # $1 = question; reads the answer from the terminal even when this script is piped in
  ( : < /dev/tty ) 2>/dev/null || return 1
  printf '%s [y/N] ' "$1" > /dev/tty
  read -r ans < /dev/tty
  case "$ans" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

if [ -n "$found" ]; then
  echo "deps/mise: mise is already installed:"
  for p in $found; do echo "  $p  ($("$p" --version 2>/dev/null | head -n 1))"; done
  if [ "$CHECK" -eq 1 ]; then exit 0; fi
  if [ "$YES" -ne 1 ] && ! ask "Install another copy at $HOME/.local/bin/mise anyway?"; then
    echo "deps/mise: nothing installed."
    activate
    exit 0
  fi
elif [ "$CHECK" -eq 1 ]; then
  echo "deps/mise: no mise found."
  exit 1
fi

fetch() {
  if command -v curl >/dev/null 2>&1; then curl -fsSL https://mise.run
  elif command -v wget >/dev/null 2>&1; then wget -qO- https://mise.run
  else echo "deps/mise: needs curl or wget" >&2; return 1
  fi
}

# Download the whole installer before running it, so a cut-off download never runs; retry twice.
n=1
while :; do
  script=$(fetch) && printf '%s\n' "$script" | MISE_INSTALL_HELP=0 sh && break
  if [ "$n" -ge 3 ]; then echo "deps/mise: the installer failed 3 times" >&2; exit 1; fi
  n=$((n + 1)); echo "deps/mise: retrying ($n of 3) ..." >&2; sleep $((n * 5))
done

if ! "$HOME/.local/bin/mise" --version; then
  echo "deps/mise: installed, but $HOME/.local/bin/mise does not run" >&2
  exit 1
fi
activate
echo "deps/mise: done. Check it with: mise doctor"
