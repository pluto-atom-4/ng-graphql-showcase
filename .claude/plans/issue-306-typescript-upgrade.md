# Plan — Issue #306 "Upgrade TypeScript to v7"

**Author:** Architect | **Date:** 2026-09-19 | **Gate:** 1 (Plan Mode)
**Issue:** https://github.com/pluto-atom-4/ng-graphql-showcase/issues/306 (open, no comments — issue body is the only decision record)
**Status:** BLOCKED as written. Decision required from human before any Coder work.

---

## 1. Verdict

**Issue #306 as written cannot be implemented today.** The literal target
`typescript: ^7.0.0` is unsatisfiable against every published Angular version and
against the latest `typescript-eslint`. The highest `typescript` upper bound
anywhere in the reachable dependency graph is `<6.1.0`. TypeScript `7.0.2`
exceeds all of them.

This is not a peer-warning nuisance. `ngtsc` (`@angular/compiler-cli`) binds
TypeScript's internal compiler API, so an out-of-range TypeScript breaks AOT
compilation outright — `ng build` fails, it does not merely warn.

### Evidence — peer ranges (verified, 2026-09-19)

| Package                         | Version                                                 | `typescript` peer range |
| ------------------------------- | ------------------------------------------------------- | ----------------------- |
| `@angular/compiler-cli`         | 19.2.25 (installed)                                     | `>=5.5 <5.9`            |
| `@angular-devkit/build-angular` | 19.2.27 (installed)                                     | `>=5.5 <5.9`            |
| `@angular/compiler-cli`         | 20.3.31                                                 | `>=5.8 <6.0`            |
| `@angular/compiler-cli`         | 21.2.23                                                 | `>=5.9 <6.1` *          |
| `@angular/compiler-cli`         | 22.1.7 (latest)                                         | `>=6.0 <6.1`            |
| `@angular/compiler-cli`         | 22.2.0-rc.0                                             | `>=6.0 <6.1`            |
| `typescript-eslint`             | 8.64.0 installed / 8.70.0 latest / **no v9 published**  | `>=4.8.4 <6.1.0`        |
| `typescript`                    | 5.6.3 installed; `~5.6.2` at `frontend/package.json:66` | —                       |
| `typescript`                    | **7.0.2 latest**; 6.0.3 also published                  | —                       |

\* npm peer metadata for 21.2.23 says `<6.1`; `angular.dev/reference/versions`
says `>=5.9.0 <6.0.0` for 21.0.x–21.2.x. Treat the docs table as authoritative
for _supported_ combinations and npm metadata as authoritative for _install_
behaviour. Plan around the narrower (docs) range.

### Evidence — Angular runtime/toolchain matrix

Source: `https://angular.dev/reference/versions` (fetched 2026-09-19).

| Angular       | Node.js                               | TypeScript   |
| ------------- | ------------------------------------- | ------------ |
| 19.0.x–19.2.x | `^18.19.1 \|\| ^20.11.1 \|\| ^22.0.0` | `>=5.5 <5.9` |
| 20.0.x–20.3.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.8 <6.0` |
| 21.0.x–21.2.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.9 <6.0` |
| 22.0.x        | `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` | `>=6.0 <6.1` |

Two consequences the issue does not account for:

1. **Majors cannot be skipped.** `https://angular.dev/reference/releases`:
   "If you want to update across multiple major versions, perform each update one
   major version at a time." Reaching TypeScript 6.0 therefore costs three
   sequential Angular majors, not one dependency bump.
2. **Node must move too.** `CLAUDE.md:234` states "Node.js 18+". Angular 20/21
   need Node ≥20.19; Angular 22 needs Node ≥22.22.3. Node 18 and Node 20 are both
   insufficient for the endpoint.

---

## 2. Options

### Option A — DEFER (keep TypeScript 5.6.x)

Accept that TypeScript 7 is unreachable, record why, and set a revisit trigger.

**File-by-file changes:** none to dependencies or code.

| Artifact                                        | Change                                                   |
| ----------------------------------------------- | -------------------------------------------------------- |
| `.claude/plans/issue-306-typescript-upgrade.md` | this document (Architect, done)                          |
| `tasks.md`                                      | ordered task tree (Architect, done)                      |
| GitHub issue #306                               | one comment carrying the verdict + the decision question |

Production files touched: **0**. No `package.json` edit, no lockfile churn, no
`pnpm install`.

**Revisit trigger (record on #306):** reopen scope when
`@angular/compiler-cli` publishes a version whose `typescript` peer range admits
`7.x`. Until then #306 is a tracking issue, not an actionable task. Expected
earliest: Angular 23 (scheduled June 2027 per the release page), and only if the
Angular team adopts the TypeScript 7 native port by then — not guaranteed.

**Effort:** ~15 min (comment only). **Risk:** none technical. Residual risk is
organisational: the issue stays open and may be re-picked without reading this
plan. Mitigated by posting the verdict on the issue itself rather than only here.

### Option B — MAX-SUPPORTED (staged chain to TypeScript 6.0.3)

Walk to the highest TypeScript the ecosystem currently allows. **Five commits**,
each independently peer-valid, each passing Gate 2 before the next starts.

| Stage | Change                                                             | TypeScript | Angular | Node floor  |
| ----- | ------------------------------------------------------------------ | ---------- | ------- | ----------- |
| 1     | TypeScript only — `~5.6.2` → `~5.8.3` (inside Angular 19's `<5.9`) | 5.8        | 19      | 18.19.1     |
| 2     | `ng update @angular/cli@20 @angular/core@20` + `angular-eslint@20` | 5.8        | 20      | **20.19.0** |
| 3     | TypeScript `~5.8.3` → `~5.9.x` (inside Angular 20's `<6.0`)        | 5.9        | 20      | 20.19.0     |
| 4     | `ng update @angular/cli@21 @angular/core@21` + `angular-eslint@21` | 5.9        | 21      | 20.19.0     |
| 5     | `ng update @angular/cli@22 @angular/core@22` + TypeScript `^6.0.3` | 6.0.3      | 22      | **22.22.3** |

Stage 1 is deliberately a pure TypeScript bump: 5.8 satisfies both Angular 19
(`<5.9`) and Angular 20 (`>=5.8`), so it de-risks stage 2 by isolating
TypeScript-only breakage from Angular-only breakage.

**Files changed across the chain (known):**

| File                                                        | Why                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| `frontend/package.json:66`                                  | `typescript` — stages 1, 3, 5                               |
| `frontend/package.json:25-33,45,51,52`                      | Angular packages — stages 2, 4, 5                           |
| `frontend/package.json:46-50,60`                            | `@angular-eslint/*` + `angular-eslint` in lockstep          |
| `frontend/package.json:67`                                  | `typescript-eslint` 8.64 → 8.70                             |
| `frontend/package.json:34,35`                               | `@apollo/client` / `apollo-angular` if peer ceiling hit     |
| `frontend/package.json:43,44`                               | `@analogjs/*` if Angular ceiling hit                        |
| `pnpm-lock.yaml`                                            | every stage                                                 |
| `frontend/angular.json:18`                                  | `@angular-devkit/build-angular:browser` → `:application`    |
| `frontend/angular.json:20,37-48`                            | `outputPath` semantics + budgets change under esbuild       |
| `frontend/angular.json:87`                                  | `@angular-eslint/builder:lint` version alignment            |
| `frontend/eslint.config.js:2-4`                             | CommonJS `require` + `angular-eslint` major                 |
| `frontend/tsconfig.json`                                    | possible `target`/`lib`/`moduleResolution` migration        |
| `frontend/tsconfig.app.json`, `frontend/tsconfig.spec.json` | follow parent                                               |
| `CLAUDE.md:234`                                             | "Node.js 18+" becomes false at stage 2 and again at stage 5 |
| `.claude/hooks/pre-commit-bundle-check:18,50-60`            | reads webpack `stats.json`, which esbuild never emits       |
| `frontend/src/app/api/generated/graphql.ts`                 | **regenerated only** via `pnpm codegen`, never hand-edited  |
| up to 5 template-bearing files                              | only if a control-flow migration runs (see below)           |
| 0–82 hand-written `frontend/src/**/*.ts`                    | unknown until stage 1 type-check runs                       |

**Unverifiable ceilings — Coder must confirm before committing to the chain.**
The npm registry is not on this role's fetch allowlist, so these could not be
checked during planning. Each is a potential hard stop:

- `apollo-angular@^9.0.0` (`frontend/package.json:35`) — `@angular/core` peer
  ceiling. If v9 caps at Angular 19/20, a major bump to apollo-angular v10/v11 is
  required mid-chain, which changes the Apollo provider API surface used by
  `frontend/src/app/api/*.service.ts`.
- `@analogjs/vite-plugin-angular@2.6.3` and `@analogjs/vitest-angular@2.5.3`
  (`frontend/package.json:43,44`) — **highest-consequence unknown.** The entire
  test path runs through these (`frontend/angular.json:81-84`,
  `frontend/vitest.config.ts:9`). If Analog does not support Angular 22, `pnpm
test` dies across all 83 spec files and the chain stops at stage 4.
- `zone.js@^0.15` (`frontend/package.json:40`) versus Angular 21/22 zoneless
  defaults.

**Architectural-constraint collision — escalate, do not resolve silently.**
The repo is mixed-syntax: 10 `*ngFor` occurrences across 5 files
(`dashboard-page.component.ts`, `activity-timeline.component.ts`,
`tabs.component.ts`, `shared/pagination/pagination.component.ts`, plus one spec)
alongside 7 `@for` usages. `CLAUDE.md` Architectural Constraints mandate
"`*ngFor` loops → mandatory `trackBy`". If an Angular migration rewrites
`*ngFor` to `@for`, `trackBy` is replaced by the `track` expression and the
documented constraint no longer matches the code. **The Coder must not amend
CLAUDE.md to fit.** Halt and ask the human whether the constraint should be
restated in `@for`/`track` terms.

**Effort:** 3–5 working days for stages 1–5 assuming no ceiling is hit;
open-ended if `apollo-angular` or `@analogjs/*` blocks. **Risk: HIGH.** Three
Angular majors, a builder migration, a Node runtime bump, and an 83-file test
suite on a third-party Angular test harness. And the endpoint is TypeScript
**6.0.3, not 7** — so Option B does not close #306 as written even on success.

### Option C — FORCE (install TypeScript 7.0.2 against Angular 19)

**File-by-file changes:** `pnpm-workspace.yaml` — add to the existing
`overrides:` block (lines 8-13) plus a new `peerDependencyRules:` /
`allowedVersions:` block; `pnpm-lock.yaml` regenerates. Two files.

**What breaks, and why it is not mergeable:**

1. `ngtsc` compiles against TypeScript's internal API surface. TypeScript 7 is
   the native port; the `typescript` package's internal shape is not the 5.x/6.x
   shape `@angular/compiler-cli@19.2.25` was built against. AOT compilation
   throws — `pnpm build:frontend` exits non-zero. `pnpm --filter frontend run
type-check` may even pass while `ng build` fails, which makes a partial green
   signal actively misleading.
2. `typescript-eslint@8.x` declares `typescript` `<6.1.0`. The parser breaks, so
   `pnpm lint` fails and `frontend/angular.json:86-91` lint target is dead.
3. `pnpm overrides` suppresses the _warning_, not the _incompatibility_. It makes
   a known-broken tree installable — the worst possible outcome, because CI has
   no build workflow to catch it (`.github/workflows/` holds only
   `ai-code-review.yml` and `context-lint.yml`).
4. Gate 2 of the Two-Gate System requires `dotnet build … && pnpm build` at exit
   code 0 and `pnpm test` at 100%. Option C cannot satisfy either. **A PR from
   Option C must be blocked at Gate 2 by definition.**

**Effort:** ~30 min. **Value:** only as evidence — capturing the `ngtsc` error
log to attach to #306 as proof of the verdict. Never merge.

---

## 3. Recommendation

**Option A — DEFER.** TypeScript 7 is gated on the Angular team, not on this
repo; no amount of local work reaches it. Option B costs three Angular majors, a
Node bump and a builder migration to land on TypeScript **6.0.3** — which still
does not satisfy `^7.0.0`, so it buys effort without closing the issue. Option C
produces an installable tree that cannot build, which is worse than not trying.

If the Angular chain is wanted for its own sake, it deserves a separate issue
scoped as "upgrade Angular 19 → 22", not as a TypeScript bump.

---

## 4. Corrected risk assessment

The issue's eight risks, re-scored against verified repo reality.

| #   | Issue's risk                                      | Verdict                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Type narrowing breakage (CRITICAL)                | **PARTIALLY CONFIRMED — downgrade to MEDIUM**    | `frontend/tsconfig.json:8` `strict: true`, plus `:12` `noPropertyAccessFromIndexSignature`, `:13` `noImplicitReturns`, `:11` `noImplicitOverride`, `:14` `noFallthroughCasesInSwitch` already on. Most tightening is pre-absorbed. Blast radius bounded at 82 hand-written `.ts` files under `frontend/src` (83rd is generated). N-A while #306 is blocked; real only under Option B.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2   | Hot Chocolate / codegen type conflicts (CRITICAL) | **WRONG-PREMISE — N-A**                          | TypeScript does not participate in codegen. `frontend/codegen.ts:4` reads `../backend/src/FactoryApp.WebApi/schema.graphql` through `graphql-js`, not `tsc`. `@graphql-codegen/typescript@6.1.0` declares **no** `typescript` peer dependency. The stated mitigation premise ("graphql-codegen v4+ required for v7 compat") is also moot: `frontend/package.json:53` is already `@graphql-codegen/cli@^7.1.2`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3   | Angular dependency chain (HIGH)                   | **CONFIRMED — escalate to BLOCKER**              | Understated, not wrong. "May require minor version bump" is incorrect: it requires Angular 19→20→21→22 sequentially (no major skipping, per `angular.dev/reference/releases`) plus a Node floor move from 18 to 22.22.3. This single risk is what blocks the issue.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4   | Monorepo workspace type sharing (HIGH)            | **WRONG-PREMISE — N-A**                          | `pnpm-workspace.yaml:1-2` declares exactly one package, `frontend`. The backend is .NET and shares no TypeScript types. `frontend/tsconfig.json` has **no** `extends`; the inheritance chain is one level deep — `frontend/tsconfig.app.json:2` and `frontend/tsconfig.spec.json:2` extend it. There is no cross-workspace `extends` for any TypeScript version to reinterpret.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5   | Pre-commit `tsc --noEmit` hook (HIGH)             | **WRONG-PREMISE — N-A**                          | `.husky/pre-commit` runs four steps — branch enforcement (`:6`), bundle check (`:34`), advisory graph re-index (`:48`), `pnpm lint-staged` (`:59`). **None runs `tsc`.** `.lintstagedrc.json:2-3` matches `*.md` and `*.{json,yaml,yml}` only and runs `prettier --write`; there is no `.ts` glob at all. `tsc --noEmit` exists solely as the manual `type-check` script at `frontend/package.json:17`. The proposed mitigation ("update `.husky/pre-commit` to warn-only") has no target. **Substitute real risk at the same location:** `.husky/pre-commit:35` invokes `.claude/hooks/pre-commit-bundle-check`, which reads webpack `stats.json` (`:18`, `:50-60`). Angular 20+'s esbuild `application` builder never emits that file, so under Option B the bundle gate silently degrades to exit 2 ("skip") and stops guarding the 650 kb/700 kb budgets at `frontend/angular.json:37-48`. |
| 6   | `@types/*` incompatibility (MEDIUM)               | **N-A as written; LOW for the one real package** | The only `@types` package is `@types/node@^25.9.1` (`frontend/package.json:58`). `@types/jest` is absent — the suite is Vitest, and `frontend/tsconfig.json:25` uses `types: ["vitest/globals", "node"]`. No cascade surface exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7   | typescript-eslint sync (MEDIUM)                   | **WRONG-PREMISE — already satisfied**            | Issue assumes "currently ~7.x assumed" and prescribes "sync to v8+". Repo is already at `typescript-eslint@^8.61.0` / installed 8.64.0 (`frontend/package.json:67`), peer `typescript >=4.8.4 <6.1.0` — which already admits TypeScript 6.0. **No v9 is published**, so there is nothing further to sync to. **Substitute real risk:** `@angular-eslint/*@^19.8.1` (`frontend/package.json:46-50`) and `angular-eslint@^22.0.0` (`:60`) are already out of lockstep, and `frontend/eslint.config.js:4` loads the v22 package while `frontend/angular.json:87` runs the v19 `@angular-eslint/builder:lint`. Pre-existing, independent of #306, and must be unified before any Option B stage.                                                                                                                                                                                                   |
| 8   | Build performance regression (LOW)                | **N-A — unmeasurable**                           | "CI/CD build time +5–15%" has no subject: `.github/workflows/` contains only `ai-code-review.yml` and `context-lint.yml`, and **neither runs a typecheck, build, or test**. No local baseline is captured either, so there is nothing to regress against. Establishing a baseline is a prerequisite of measuring, not a mitigation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### Corrections to the issue's Scope and Acceptance Criteria

| Issue line                                                             | Correction                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Bump `typescript` to `^7.0.0`"                                        | Unsatisfiable — see §1.                                                                                                                                                                                                                      |
| "Update pre-commit hook to handle new checks gracefully"               | N-A — no `tsc` in any hook (risk 5).                                                                                                                                                                                                         |
| "Update CI/CD pipeline (if any TS version-specific steps exist)"       | N-A — no build/test workflow exists.                                                                                                                                                                                                         |
| "Documentation updated (CLAUDE.md, AGENTS.md if TS version mentioned)" | N-A today — **no repo document pins a TypeScript version**; `CLAUDE.md:234` names Node 18+ / pnpm 8+ only. Becomes **CONFIRMED** under Option B: `CLAUDE.md:234` is falsified at stage 2 (Node ≥20.19) and again at stage 5 (Node ≥22.22.3). |
| "Verify Lighthouse metrics unchanged"                                  | Achievable but currently unbaselined for this change; `frontend/package.json:20` `audit:lighthouse` requires a running dev server on :4200.                                                                                                  |
| "Prerequisite: None (independent upgrade)"                             | False. Prerequisite is an Angular major chain.                                                                                                                                                                                               |

### Assumptions recorded (could not verify from this role)

1. **npm registry unreachable** — `registry.npmjs.org` / `npmjs.com` are not on
   the `WebFetch` allowlist in `.claude/settings.json`. Peer ceilings for
   `apollo-angular@9`, `@analogjs/vite-plugin-angular@2.6.3`,
   `@analogjs/vitest-angular@2.5.3` and `zone.js@0.15` against Angular 20/21/22
   are therefore **unknown**. Assumed to be potential hard stops; Coder must
   verify with `pnpm info <pkg> peerDependencies` before starting Option B.
2. **`@angular-devkit/build-angular:browser` lifecycle** — whether the
   webpack `browser` builder is deprecated-but-present or removed in Angular 20+
   could not be confirmed; `angular.dev/reference/migrations` does not cover it.
   Assumed a migration off `frontend/angular.json:18` is required at stage 2.
3. **Generated-file freshness** — whether
   `backend/src/FactoryApp.WebApi/schema.graphql` and
   `frontend/src/app/api/generated/graphql.ts` are current with the C# entities
   cannot be determined without a build. Verification is a Coder step (T1.3),
   not an assumption either way.
4. **Uncommitted local work** — the GitHub API shows pushed state only. Branch
   `main` reported clean at session start apart from an untracked
   `session-blog-20260911-graph-tooling.md` and a deleted
   `issue-conent-last-comment.json`; neither is in scope.
5. **Open PR #305** (`dependabot/npm_and_yarn/vitest-4.1.11`) touches
   `frontend/package.json` and `pnpm-lock.yaml`. Any Option B stage will conflict
   with it. Land or close #305 first.

---

## 5. Ordered task tree — recommended option (A)

See `tasks.md` for the executable tree with owners and Gate 2 commands. Summary:
three tasks, sequential, zero production-file changes.

## 6. Rollback plan

**Option A:** nothing to roll back — no code, dependency or config change. The
only irreversible artifact is the GitHub comment on #306, which a human can
remove with
`gh api -X DELETE /repos/pluto-atom-4/ng-graphql-showcase/issues/comments/<id>`.

**Option B, per stage:** each stage is exactly one commit containing
`frontend/package.json` + `pnpm-lock.yaml` + that stage's config edits, and each
stage's tree is independently peer-valid. Therefore:

| Situation                       | Rollback                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage fails before commit       | `git checkout -- frontend/package.json pnpm-lock.yaml frontend/angular.json frontend/tsconfig*.json && pnpm install --frozen-lockfile`                                 |
| Stage committed, not merged     | `git reset --hard HEAD~1 && pnpm install --frozen-lockfile`                                                                                                            |
| Stage merged, later stage fails | `git revert <stage-commit>` in **reverse stage order** (5→4→3→2→1); never revert stage 2 while stage 3 is still applied — TypeScript 5.9 on Angular 19 violates `<5.9` |
| Node runtime bumped locally     | revert `.nvmrc`/toolchain by hand; no repo file currently pins Node                                                                                                    |

No database migration, no backend change, no schema change in any stage →
no data-level rollback and no `dotnet ef migrations remove` step.

**Option C:** `git checkout -- pnpm-workspace.yaml pnpm-lock.yaml && pnpm install
--frozen-lockfile`. Never merged, so never needs a revert.

## 7. Files the builder will touch

**Recommended option (A): 1 file + 1 GitHub comment.**

| Path                                            | Owner               | Nature     |
| ----------------------------------------------- | ------------------- | ---------- |
| `tasks.md`                                      | Architect (written) | plan       |
| `.claude/plans/issue-306-typescript-upgrade.md` | Architect (written) | plan       |
| `.claude/agent_state.json`                      | Architect (written) | handover   |
| GitHub issue #306 comment                       | Architect           | escalation |

Production/test/config files touched under Option A: **0**.

**For comparison — Option B: 16 known files + up to 5 template files + 0–82
source files (count indeterminate until stage 1 type-check runs).** Enumerated in
§2, Option B. **Option C: 2 files** (`pnpm-workspace.yaml`, `pnpm-lock.yaml`),
non-mergeable.
