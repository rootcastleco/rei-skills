# REI Skills — npm release runbook

**Package:** `rei-skills`  
**Source of truth:** `package.json` on `main`  
**Publishing workflow:** `.github/workflows/publish.yml`  
**Registry:** https://www.npmjs.com/package/rei-skills

## Release model

REI Skills publishes the full skill catalog, data files, CLI and MCP server as an npm package. The tarball includes `bin/`, `lib/`, `data/` and `skills/`, plus README and LICENSE. Legacy skill aliases whose symlinks do not survive npm packaging are resolved by the installer.

Do **not** assume that the GitHub version is published to npm. Confirm the live registry version independently. npm versions are immutable: if the desired version already exists, bump `package.json` and `package-lock.json` through a reviewed PR before another release.

## Authentication: npm Trusted Publishing (OIDC)

Configure the publisher **once**, using the `rootcastle` npm account that owns the public package:

1. Open the existing `rei-skills` package settings on https://www.npmjs.com/.
2. Under **Trusted Publisher**, select **GitHub Actions**.
3. Set **Organization or user** to `rootcastleco`; **Repository** to `rei-skills`; **Workflow filename** to `publish.yml`. Leave **Environment** unset unless this workflow has an identically named GitHub environment.
4. Explicitly enable **Allow npm publish**. Other actions are not required.
5. Confirm that the newly configured trust relationship appears in the npm package settings. npm may require account verification/2FA to modify settings. A new trusted publisher must complete its first publish within the service's validation window (currently two days; confirm npm's current documentation before setup).
6. After the first successful OIDC publish, revoke any exposed or unused write tokens and consider requiring 2FA with tokens disallowed for this package.

Never paste npm credentials into issues, commits, pull requests, chat, workflow inputs or job logs. No `NPM_TOKEN` is needed by the OIDC workflow.

Reference: https://docs.npmjs.com/trusted-publishers/

## Preflight and gates

Run in a clean checkout of the intended `main` commit:

```bash
npm ci
python scripts/sync_rei_rea.py --check
python scripts/validate_skills.py --strict
node scripts/validate-skills.js
python scripts/validate_references.py
node scripts/security_audit.js
npm test
npm pack --ignore-scripts --dry-run
```

The `npm test` suite includes `test:package`, which packs and installs the release artifact in a temporary directory, verifies the tool inventory, catalog and skill contents, checks the CLI alias fallback, and exercises MCP `dry_run` without changing the workspace.

The release workflow uses Node.js 24 (npm CLI 11.5.1 or later is required by trusted publishing) and Python 3.11. It checks source identity, the exact package version, artifact contents, CI and security gates, and refuses to republish an existing npm version.

## Publishing

**Preferred:** in GitHub → Actions → **Publish REI Skills to npm** → **Run workflow**, select branch `main` and enter the exact `package.json` version (e.g. `6.2.0` when applicable). The manual workflow refuses branches other than `main` or a mismatched version. You may also publish a GitHub Release with tag `v<package.json version>`; the release checkout must contain the matching package version and workflow.

The workflow must show a successful `npm publish` step **and** verify the version in the public npm registry. GitHub check success alone does not prove npm publication when a publish step was conditionally skipped; this workflow does not silently skip that step.

For provenance and deterministic debugging, record:
- exact `main` commit SHA and version,
- GitHub Actions run URL and success status,
- packed file count and size,
- `npm view rei-skills version` and a fresh package smoke test.

## Post-publish verification

```bash
npm view rei-skills version
npm pack rei-skills@<published-version> --dry-run
npx -y rei-skills@<published-version> targets
```

For a complete MCP smoke test, install the package in an isolated project and call `initialize`, `tools/list`, `rei_search_skills` and `rei_install_skill` with `dry_run: true`.

## Failure handling and rollback

- An authentication failure indicates that the npm Trusted Publisher configuration, workflow identity or the npm account's permissions are incorrect. Do not fall back to posting a token into the workflow.
- A failed build/test or mismatched artifact blocks publishing.
- npm packages cannot be overwritten with the same version; fix regressions through a new, reviewed patch release and update the `latest` dist-tag where appropriate.
- For a problematic release, avoid `unpublish` as the default response. Coordinate a patched release and, if necessary, deprecate the affected version. Maintain a separate immutable record of any security incident.
