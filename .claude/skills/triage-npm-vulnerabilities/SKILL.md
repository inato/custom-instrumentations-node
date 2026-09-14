---
name: triage-npm-vulnerabilities
description: Triage open npm vulnerabilities reported by `pnpm audit` and decide fix-vs-accept for each. Use when asked to handle, list, fix, or accept npm/dependency vulnerabilities, security audit findings, CVEs, GHSAs, Dependabot alerts, or Renovate security PRs in this repo.
allowed-tools: Bash(pnpm audit:*), Bash(pnpm why:*), Bash(pnpm update:*), Bash(pnpm install:*), Bash(pnpm build:*), Bash(npm view:*), Bash(grep:*), Bash(gh api:*), Bash(gh pr list:*), Read, Edit
---

# Triage npm vulnerabilities

This repo is a **published library** (`@inato/custom-instrumentations-node`). Anything under `dependencies` ships to every consumer, so runtime-scope vulnerabilities are the priority. `devDependencies` (changesets, typescript, `@types/node`) never reach consumers: limited exposure by construction.

Policy: **fix high & critical runtime deps**. Accept only when no upstream fix is reachable AND exposure is limited (dev-only, or unreachable code path).

## Repo conventions

- Single package: the only manifest is the root `package.json`. No `packages/*`.
- Versions are **pinned exactly** (Renovate `rangeStrategy: pin`). Bump to an exact version, not a range.
- pnpm settings (`allowBuilds`, `auditConfig`) live in `pnpm-workspace.yaml`, not in a `pnpm` block in `package.json`.
- Renovate raises PRs **only for security fixes** (routine updates are disabled). Check `gh pr list --label security` before fixing by hand; if a Renovate PR already covers the advisory, review/merge that instead.
- A change to a **runtime** dependency in `package.json` changes the published package: add a patch changeset (`.changeset/*.md`). Lockfile-only and devDependency changes need none.

## Procedure

1. **Reconcile first.** Compare the two open lists:
   - CLI opens: `pnpm audit --audit-level high --json` (accepted ones already filtered out).
   - GitHub opens: `gh api "repos/inato/custom-instrumentations-node/dependabot/alerts?state=open&per_page=100" --jq '.[] | {ghsa: .security_advisory.ghsa_id, pkg: .dependency.package.name, sev: .security_advisory.severity, scope: .dependency.scope}'`
   Compare at the **same severity** — filter the GitHub list to match the CLI's `--audit-level`, or every lower-severity GitHub alert looks like a false acceptance. A GHSA open on GitHub but **absent from the CLI at that level** is accepted-but-not-dismissed → dismiss it. Dismissal writes repo state — confirm with the user, then `PATCH … -f state=dismissed`, reason `tolerable_risk` (or `not_used` if unreachable) + the exit condition from the `auditConfig` comment (≤280 chars).

2. **List remaining opens:** `pnpm audit --audit-level high --json`. The `(N ignored)` count is Step 1's entries. Collapse duplicate advisories for the same package (one package often carries several GHSAs; the highest `patched_versions` bound fixes them all). Note `scope` (runtime vs development) for each.

3. **Classify + suggest a fix per vuln:**
   - Direct (`grep -n '"<pkg>"' package.json`) → bump the exact pin in `package.json`, then `pnpm install`.
   - Transitive (`pnpm why <pkg>` to find the parents) → if the parent's declared range already allows the patched version (`npm view <parent>@<version> dependencies.<pkg>` vs. the advisory's `patched_versions`), refresh the lockfile with `pnpm update <pkg> --depth Infinity`. Otherwise bump the **direct parent** in `package.json` to a version that pulls the patched dep itself. Failing that, it's an accept candidate (Step 4).
   - **Do NOT fix a transitive with `pnpm overrides`** — forcing a version outside the parent's declared semver range can cause runtime errors the parent never tested against. The fix goes through the parent, or it's accepted.
   - After any fix: `pnpm install`, `pnpm build`, then `pnpm audit --audit-level high` must be clean for that advisory.

4. **Record an acceptance** (both required): add the GHSA to `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` with a comment stating **what / why / exit condition**, and dismiss the GitHub alert (Step 1). Verify with `pnpm audit` (`(N ignored)` ticks up).

   ```yaml
   auditConfig:
     ignoreGhsas:
       # <pkg> via <parent> (dev-only): <one-line why>. Exit: drop when <parent> >= <version>.
       - GHSA-xxxx-xxxx-xxxx
   ```
