#!/bin/sh
# Does this package actually work in Qwen Code?
#
# Everything happens in a throwaway HOME, so neither the person's own Qwen Code (~/.qwen) nor a
# real kyte workspace (~/.kyte) is touched. What is checked is the path a newcomer walks: install
# the package from this working copy, see what Qwen made of it, and get an answer out of the
# server it starts.
#
# Run it from anywhere:  sh check.sh

set -eu

repo=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

HOME="$work/home"
mkdir -p "$HOME"
export HOME

fail() {
  echo "FAILED: $1" >&2
  exit 1
}

echo "1. the install"
printf 'y\n' | qwen extensions install "$repo" >"$work/install.txt" 2>&1 || fail "qwen would not install the package
$(cat "$work/install.txt")"

echo "2. what Qwen made of it"
qwen extensions list >"$work/list.txt" 2>&1 || fail "qwen extensions list did not run"
grep -q 'kyte' "$work/list.txt" || fail "the extension is not installed
$(cat "$work/list.txt")"
# The one that actually matters: a v1 package installs its skill and silently drops its server,
# so an install that "worked" is not proof. The server has to be listed.
sed -n '/MCP servers:/,$p' "$work/list.txt" | grep -q 'kyte' ||
  fail "the extension is installed but its MCP server was not registered
$(cat "$work/list.txt")"

echo "3. the answer"
# No workspace has been opened in this throwaway HOME, so the one tool kyte serves is the one that
# says why — which is exactly what the skill tells the model to relay.
node "$repo/scripts/mcp-probe.mjs" >"$work/probe.txt" 2>&1 || fail "the server did not answer
$(cat "$work/probe.txt")"
sed 's/^/   /' "$work/probe.txt"
grep -q 'kyte_status' "$work/probe.txt" ||
  fail "without a workspace the server should offer kyte_status and nothing else
$(cat "$work/probe.txt")"

echo
echo "All three passed."
