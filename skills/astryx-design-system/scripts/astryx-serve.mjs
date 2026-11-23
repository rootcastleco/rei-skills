#!/usr/bin/env node
/**
 * Auto-build + auto-serve cross-platform launcher for the native Rust
 * Astryx Design System Server (`astryx-ds-server`).
 *
 * Behavior:
 *  - Automatically compiles `rust-server` in `--release` mode if the native
 *    binary is missing or older than `Cargo.toml` / `src/*.rs` / `data/*.json`.
 *  - With no args, runs `ensure` (starts the native Rust HTTP server in the
 *    background if not already running and prints the live URL).
 *  - Any other args (e.g., `mcp`, `serve`, `search Button`, `component Dialog`,
 *    `theme matcha --css`, `doctor ./src`) are forwarded directly to the
 *    native Rust binary.
 */

import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');
const CRATE_DIR = path.join(SKILL_ROOT, 'rust-server');
const BIN_NAME = process.platform === 'win32' ? 'astryx-ds-server.exe' : 'astryx-ds-server';
const BIN_PATH = path.join(CRATE_DIR, 'target', 'release', BIN_NAME);

function latestMtimeMs(dir) {
  let max = 0;
  if (!fs.existsSync(dir)) return max;
  const stat = fs.statSync(dir);
  if (stat.isFile()) return stat.mtimeMs;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'target') continue;
      max = Math.max(max, latestMtimeMs(full));
    } else {
      max = Math.max(max, fs.statSync(full).mtimeMs);
    }
  }
  return max;
}

function needsBuild() {
  if (!fs.existsSync(BIN_PATH)) return true;
  const binMtime = fs.statSync(BIN_PATH).mtimeMs;
  const srcMtime = Math.max(
    latestMtimeMs(path.join(CRATE_DIR, 'Cargo.toml')),
    latestMtimeMs(path.join(CRATE_DIR, 'src')),
    latestMtimeMs(path.join(CRATE_DIR, 'data')),
  );
  return srcMtime > binMtime;
}

function ensureBuilt(isMcpMode) {
  if (!needsBuild()) return;
  const log = isMcpMode ? console.error : console.log;
  log('[astryx-ds-server] Building native Rust release binary...');
  const res = spawnSync('cargo', ['build', '--release', '--quiet'], {
    cwd: CRATE_DIR,
    stdio: isMcpMode ? ['ignore', 'ignore', 'inherit'] : 'inherit',
  });
  if (res.error) {
    console.error(
      `[astryx-ds-server] Failed to run cargo (${res.error.message}). Install Rust from https://rustup.rs`,
    );
    process.exit(1);
  }
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

const forwardedArgs = process.argv.slice(2);
const effectiveArgs = forwardedArgs.length === 0 ? ['ensure'] : forwardedArgs;
const isMcpMode = effectiveArgs[0] === 'mcp';

ensureBuilt(isMcpMode);

const run = spawnSync(BIN_PATH, effectiveArgs, {
  stdio: 'inherit',
});

if (run.error) {
  console.error(`[astryx-ds-server] Execution failed: ${run.error.message}`);
  process.exit(1);
}
process.exit(run.status ?? 0);
