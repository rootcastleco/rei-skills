#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Auto-builds and runs the native Rust Astryx Design System Server (`astryx-ds-server`).
.EXAMPLE
  ./scripts/astryx-serve.ps1                     # Ensures background HTTP server on http://127.0.0.1:7331
  ./scripts/astryx-serve.ps1 serve --port 7331   # Runs HTTP server in foreground
  ./scripts/astryx-serve.ps1 mcp                 # Runs native MCP JSON-RPC stdio server
  ./scripts/astryx-serve.ps1 component Button    # Queries Button API directly via Rust CLI
#>
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ForwardArgs
)

$ErrorActionPreference = "Stop"
$SkillRoot = Split-Path -Parent $PSScriptRoot
$CrateDir = Join-Path $SkillRoot "rust-server"
$BinPath = Join-Path $CrateDir "target\release\astryx-ds-server.exe"

if (-not $ForwardArgs -or $ForwardArgs.Count -eq 0) {
  $ForwardArgs = @("ensure")
}

$IsMcp = ($ForwardArgs[0] -eq "mcp")

$NeedsBuild = $false
if (-not (Test-Path $BinPath)) {
  $NeedsBuild = $true
} else {
  $BinTime = (Get-Item $BinPath).LastWriteTimeUtc
  $LatestSrc = (Get-ChildItem -Path (Join-Path $CrateDir "src"), (Join-Path $CrateDir "data"), (Join-Path $CrateDir "Cargo.toml") -Recurse -File |
    Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc
  if ($LatestSrc -gt $BinTime) {
    $NeedsBuild = $true
  }
}

if ($NeedsBuild) {
  if ($IsMcp) {
    [Console]::Error.WriteLine("[astryx-ds-server] Building native Rust release binary...")
    Push-Location $CrateDir
    try { cargo build --release --quiet 1>&2 } finally { Pop-Location }
  } else {
    Write-Host "[astryx-ds-server] Building native Rust release binary..."
    Push-Location $CrateDir
    try { cargo build --release --quiet } finally { Pop-Location }
  }
}

& $BinPath @ForwardArgs
exit $LASTEXITCODE
