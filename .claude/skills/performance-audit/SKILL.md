---
name: Performance Audit
description: Automated performance profiling with Lighthouse, bundle analysis, and change detection metrics
trigger:
  [
    "performance audit",
    "profile",
    "lighthouse",
    "bundle size",
    "change detection",
  ]
atomic: false
scope: frontend/src → profiling reports
---

# Performance Audit Skill

**Purpose**: Automate performance analysis across Lighthouse, bundle size, change detection cycles, and runtime profiling to establish baselines and detect regressions.

## When to Run

Performance audit after:

- ✅ Major frontend architectural changes (component refactors, subscription updates)
- ✅ Adding new features or dependencies
- ✅ Before Phase completion (establish metrics for phase achievements)
- ✅ Addressing performance regressions detected in pre-commit
- ✅ Optimization work (OnPush, trackBy, virtual scrolling implementations)

## Quick Start

```bash
# Run full performance audit suite
pnpm run audit:performance

# Or run individual audits
pnpm run audit:lighthouse         # Lighthouse (desktop + mobile)
pnpm run audit:bundle             # Bundle size analysis
pnpm run audit:change-detection   # Change detection profiler
pnpm run audit:trackby-coverage   # TrackBy coverage report
```

## Workflow

### 1. Capture Baseline Metrics

Before changes:

```bash
# Run all audits and save baseline
pnpm run audit:performance --baseline
# Outputs to: .claude/evidence/BASELINE-[timestamp].json
```

### 2. Lighthouse Audit (Lighthouse)

Desktop + Mobile profiling:

```bash
# Desktop (fast 4G, default desktop CPU throttle)
lighthouse \
  http://localhost:4200/dashboard \
  --chrome-flags="--headless --disable-gpu" \
  --output=json \
  --output-path=.claude/evidence/LIGHTHOUSE-desktop.json

# Mobile (fast 4G, 4x CPU throttle)
lighthouse \
  http://localhost:4200/dashboard \
  --chrome-flags="--headless --disable-gpu" \
  --output=json \
  --output-path=.claude/evidence/LIGHTHOUSE-mobile.json \
  --emulated-form-factor=mobile
```

**Expected scores:**

- Performance: ≥85
- Accessibility: ≥90
- Best Practices: ≥85
- SEO: ≥90

**Report includes:**

- FCP (First Contentful Paint): Target <1.8s
- LCP (Largest Contentful Paint): Target <2.5s
- CLS (Cumulative Layout Shift): Target <0.1
- TBT (Total Blocking Time): Target <200ms

### 3. Bundle Size Analysis (webpack-bundle-analyzer)

Analyze production bundle:

```bash
# Run build with bundle analyzer
pnpm build --stats
# Analyzer opens in browser: http://localhost:8888

# Save report
pnpm run analyze:bundle --output-json > .claude/evidence/BUNDLE-ANALYSIS.json
```

**Metrics captured:**

- Total bundle size (raw KB)
- Gzipped bundle size (KB)
- Raw vs gzipped ratio
- Largest packages in bundle
- Unused dependencies (if any)

**Pre-commit threshold:** Bundle increase ≤10% vs. baseline (or --force-build-scripts to override)

**Examples of bundle delta:**

```
main: 156 KB gzipped
feat/cache-v2: 165 KB gzipped (+5.8% — PASS)
feat/big-feature: 189 KB gzipped (+21% — FAIL pre-commit)
```

### 4. Change Detection Profiler (Chrome DevTools Timeline)

Profile component change detection cycles:

```bash
# Start dev server with profiler enabled
npm run ng:serve:profiler

# Open DevTools, go to Performance tab
# Record 5-10 seconds during subscription update
# Save timeline: .claude/evidence/PROFILER-TIMELINE.json

# Run automated profiling script
pnpm run profile:change-detection
```

**Metrics captured:**

- Total change detection runs per second
- Average cycle duration (ms)
- Peak cycle time (spike)
- Change detection cycles during high-frequency subscription

**Targets:**

- Average cycle: ≤30ms (OnPush verified)
- Peak spike: <100ms
- During subscription: should remain ≤50ms even at 1000/sec raw updates

**Analysis steps:**

1. Open DevTools → Performance tab
2. Record while dashboard is loaded and subscription active
3. Look for "Angular ChangeDetectionCycle" events
4. Verify cycles are short (<30ms) and infrequent (not every frame)
5. If buffering subscription (250ms), cycles should aggregate updates

### 5. TrackBy Coverage Report

Verify all `*ngFor` loops have `trackBy` functions:

```bash
# Run coverage analyzer
pnpm run audit:trackby-coverage

# Output: .claude/evidence/TRACKBY-COVERAGE.txt
# Shows all loops and their trackBy status
```

**Expected output:**

```
File: src/app/dashboard/components/builds-list.component.ts
  Line 45: <div *ngFor="let build of builds; trackBy: trackByBuildId"> ✅
  Line 67: <div *ngFor="let part of build.parts; trackBy: trackByPartId"> ✅

File: src/app/workflow/workflow-list.component.ts
  Line 23: <div *ngFor="let workflow of workflows"> ❌ MISSING trackBy
  SUGGESTION: Add trackByWorkflowId(index, item) { return item.id; }

Summary:
  Total loops: 42
  With trackBy: 42
  Missing: 0
  Coverage: 100% ✅
```

### 6. Memory & CPU Profiling (DevTools)

Profile runtime performance:

```bash
# Method 1: Manual Chrome DevTools
# 1. Open DevTools → Memory tab
# 2. Take heap snapshot (initial state)
# 3. Simulate user activity (navigation, subscriptions)
# 4. Take second heap snapshot
# 5. Compare snapshots for leaks

# Method 2: Automated profiling
pnpm run profile:memory
# Generates: .claude/evidence/MEMORY-PROFILE.json
```

**Profiling steps:**

1. **Memory snapshot at start:** Record initial heap (MB)
2. **Simulate subscription:** Run high-frequency updates (1000/sec buffered to 250ms)
3. **Memory peak:** Record max heap during activity (MB)
4. **Cleanup (unsubscribe):** Trigger cleanup/navigation away
5. **Memory final:** Verify return to baseline (should be close to initial)

**Leak detection:**

- Final memory >> Initial memory? → Possible leak
- Memory returns to baseline? → ✅ Clean

### 7. Accessibility Performance (a11y)

Verify keyboard + ARIA compliance:

```bash
# Run a11y audit
pnpm run audit:a11y

# Keyboard navigation test
pnpm run test:keyboard

# ARIA compliance audit
pnpm run audit:aria
```

**Tests verify:**

- Keyboard navigation (Tab, Arrow, Escape, Enter)
- ARIA attributes (aria-label, aria-selected, etc.)
- Live regions (status/alert announcements)
- Focus management (modal focus trap, restoration)

## Interpreting Results

### Red Flags 🚨

| Metric                               | Bad                    | Action                                     |
| ------------------------------------ | ---------------------- | ------------------------------------------ |
| Lighthouse Performance < 70          | Performance regression | Investigate heavy components, unused JS    |
| Bundle size > 10% increase           | Too much code          | Tree-shake unused, consider code splitting |
| Change detection cycle > 50ms        | Slow detection         | Check for dirty checks, enable OnPush      |
| TrackBy coverage < 100%              | Perf killer            | Add trackBy to all loops                   |
| Memory leaks on subscription cleanup | Unsubscribed           | Check async pipe, unsubscribe logic        |

### Green Indicators ✅

| Metric                        | Good            | Notes                       |
| ----------------------------- | --------------- | --------------------------- |
| Lighthouse Performance ≥ 85   | Fast            | Well optimized              |
| Bundle size stable (±5%)      | Healthy         | Dependencies under control  |
| Change detection cycle ≤ 30ms | OnPush verified | Efficient                   |
| TrackBy coverage 100%         | Loop optimized  | All loops have trackBy      |
| Memory returns to baseline    | No leaks        | Clean subscription handling |

## Workflow Integration

### Phase 5 Performance Metrics (Complete)

Documented Phase 5 achievements:

```
✅ Change Detection: 100% OnPush verified (30ms cycles)
✅ TrackBy Coverage: 100% of loops tracked
✅ Virtual Scrolling: Implemented for 100+ items
✅ Bundle Size: 156KB gzipped (acceptable)
✅ Subscription Buffering: 250ms aggregation active
✅ Lighthouse Score: 87 (desktop), 81 (mobile)
✅ Memory: No leaks detected on subscription cleanup
✅ a11y Keyboard Navigation: 100% interactive elements verified
```

Evidence artifacts: `.claude/evidence/PERFORMANCE-METRICS-phase-5.md`

## Common Issues & Troubleshooting

| Issue                                           | Cause                        | Solution                                           |
| ----------------------------------------------- | ---------------------------- | -------------------------------------------------- |
| "Lighthouse won't connect"                      | Dev server not running       | Start with `pnpm ng:serve` on port 4200            |
| "Bundle analyzer hangs"                         | Large bundle                 | Run `pnpm build` first, then `pnpm analyze:bundle` |
| "Change detection profiler shows random spikes" | Tab not focused              | Keep DevTools recording in foreground              |
| "TrackBy coverage reports 0%"                   | Script can't parse templates | Ensure TypeScript compiles without errors          |
| "Memory profiler crashes"                       | Heap too large               | Take snapshots more frequently (every 30s)         |
| "Pre-commit bundle check false-positive"        | Baseline outdated            | Run `pnpm audit:performance --reset-baseline`      |

## Pre-Commit Hook Integration

Bundle size check automatically runs on pre-commit:

```bash
# In .husky/pre-commit:
# [1] Run linting
pnpm lint-staged

# [2] Check bundle size delta
./.claude/hooks/pre-commit-bundle-check
# If delta > 10%: FAIL (exit 1)
# Unless: git commit --force-build-scripts
```

Bundle delta logged to friction log for tracking.

## Performance Audit Checklist

Before Phase completion:

- [ ] Lighthouse audit passed (desktop ≥85, mobile ≥80)
- [ ] Bundle size within acceptable range (≤10% delta)
- [ ] Change detection profiling shows ≤30ms cycles
- [ ] TrackBy coverage at 100%
- [ ] Memory profiling shows no leaks
- [ ] CPU usage baseline documented
- [ ] a11y keyboard navigation tested
- [ ] ARIA compliance audit passed
- [ ] Performance metrics documented in AGENTS.md
- [ ] Evidence artifacts committed

## Related Documentation

- [./../evidence/performance-metrics-template.md](./../evidence/performance-metrics-template.md) — Evidence template
- [./../rules/frontend-patterns.md](./../rules/frontend-patterns.md) — trackBy, OnPush rules
- [./../EVIDENCE-ARTIFACTS.md](./../EVIDENCE-ARTIFACTS.md) — Gate 2 evidence system

---

**Skill Version:** 1.0.0  
**Created:** 2026-08-02  
**Scope:** Angular frontend performance profiling + evidence collection
