#!/usr/bin/env sh
# Auto-builds and runs the native Rust Astryx Design System Server (`astryx-ds-server`).
#
# Usage:
#   sh scripts/astryx-serve.sh                     # Ensures background HTTP server on http://127.0.0.1:7331
#   sh scripts/astryx-serve.sh serve --port 7331   # Runs HTTP server in foreground
#   sh scripts/astryx-serve.sh mcp                 # Runs native MCP JSON-RPC stdio server
#   sh scripts/astryx-serve.sh component Button    # Queries Button API directly via Rust CLI

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SKILL_ROOT=$(dirname -- "$SCRIPT_DIR")
CRATE_DIR="$SKILL_ROOT/rust-server"
BIN_PATH="$CRATE_DIR/target/release/astryx-ds-server"

if [ "$#" -eq 0 ]; then
  set -- ensure
fi

IS_MCP=0
if [ "$1" = "mcp" ]; then
  IS_MCP=1
fi

NEEDS_BUILD=0
if [ ! -x "$BIN_PATH" ]; then
  NEEDS_BUILD=1
elif [ -n "$(find "$CRATE_DIR/src" "$CRATE_DIR/data" "$CRATE_DIR/Cargo.toml" -newer "$BIN_PATH" 2>/dev/null | head -n 1)" ]; then
  NEEDS_BUILD=1
fi

if [ "$NEEDS_BUILD" -eq 1 ]; then
  if [ "$IS_MCP" -eq 1 ]; then
    printf '%s\n' "[astryx-ds-server] Building native Rust release binary..." >&2
    (cd "$CRATE_DIR" && cargo build --release --quiet >&2)
  else
    printf '%s\n' "[astryx-ds-server] Building native Rust release binary..."
    (cd "$CRATE_DIR" && cargo build --release --quiet)
  fi
fi

exec "$BIN_PATH" "$@"
