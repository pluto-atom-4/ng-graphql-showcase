# Performance Metrics Evidence Template

**Issue:** [Issue number]  
**Phase:** [Phase number]  
**Date:** [YYYY-MM-DD]

---

## Lighthouse Audit Results

### Desktop Performance

- **Performance Score:** [0-100]
- **Accessibility Score:** [0-100]
- **Best Practices Score:** [0-100]
- **SEO Score:** [0-100]
- **First Contentful Paint (FCP):** [milliseconds]
- **Largest Contentful Paint (LCP):** [milliseconds]
- **Cumulative Layout Shift (CLS):** [0-1.0]
- **Total Blocking Time (TBT):** [milliseconds]
- **Time to Interactive (TTI):** [milliseconds]

**Report file:** `LIGHTHOUSE-[issue]-[phase]-desktop.json`

### Mobile Performance

- **Performance Score:** [0-100]
- **Accessibility Score:** [0-100]
- **Best Practices Score:** [0-100]
- **SEO Score:** [0-100]
- **First Contentful Paint (FCP):** [milliseconds]
- **Largest Contentful Paint (LCP):** [milliseconds]
- **Cumulative Layout Shift (CLS):** [0-1.0]
- **Total Blocking Time (TBT):** [milliseconds]
- **Time to Interactive (TTI):** [milliseconds]

**Report file:** `LIGHTHOUSE-[issue]-[phase]-mobile.json`

---

## Bundle Size Metrics

### Frontend Bundle Analysis

| Metric                  | Value  | Unit | Baseline   | Delta  | Status |
| ----------------------- | ------ | ---- | ---------- | ------ | ------ |
| **Total Bundle Size**   | [size] | KB   | [baseline] | [+/-]% | ✅/⚠️  |
| **Gzipped Bundle Size** | [size] | KB   | [baseline] | [+/-]% | ✅/⚠️  |
| **Main Bundle**         | [size] | KB   | [baseline] | [+/-]% | ✅/⚠️  |
| **Vendor Bundle**       | [size] | KB   | [baseline] | [+/-]% | ✅/⚠️  |
| **CSS Bundle**          | [size] | KB   | [baseline] | [+/-]% | ✅/⚠️  |

**Acceptable threshold:** ≤10% increase vs. baseline

**Report file:** `BUNDLE-ANALYSIS-[issue]-[phase].json`

### Top 10 Largest Packages

| #   | Package Name | Size (KB) | Gzipped (KB) | % of Total |
| --- | ------------ | --------- | ------------ | ---------- |
| 1   | [package]    | [size]    | [gzipped]    | [percent]  |
| 2   | [package]    | [size]    | [gzipped]    | [percent]  |
| 3   | [package]    | [size]    | [gzipped]    | [percent]  |
| ... | ...          | ...       | ...          | ...        |
| 10  | [package]    | [size]    | [gzipped]    | [percent]  |

---

## Change Detection & Performance Profiling

### Change Detection Cycles

| Metric                          | Count | Baseline | Delta | Status |
| ------------------------------- | ----- | -------- | ----- | ------ |
| **Total Change Detection Runs** | [#]   | [#]      | [+/-] | ✅/⚠️  |
| **Average Cycle Time**          | [ms]  | [ms]     | [+/-] | ✅/⚠️  |
| **Max Cycle Time (spike)**      | [ms]  | [ms]     | [+/-] | ✅/⚠️  |
| **Cycles During Subscription**  | [#]   | [#]      | [+/-] | ✅/⚠️  |

**Target:** ≤30ms average cycle time (OnPush only)

**Profiler output:** `PROFILER-TIMELINE-[issue]-[phase].json`

### Change Detection Optimization Techniques Applied

- ✅ `ChangeDetectionStrategy.OnPush` on all components
- ✅ OnPush parent → child data binding verification
- ✅ RxJS `async` pipe for subscriptions (auto-unsubscribe on destroy)
- ✅ Immutable data patterns verified
- ✅ `trackBy` function on all `*ngFor` loops

**Evidence file:** `CHANGE-DETECTION-AUDIT-[issue]-[phase].md`

---

## TrackBy Coverage

| Metric                      | Count | Percentage | Status |
| --------------------------- | ----- | ---------- | ------ |
| **Total `*ngFor` Loops**    | [#]   | 100%       | ✅     |
| **Loops with `trackBy`**    | [#]   | [%]        | ✅/⚠️  |
| **Files with Loops**        | [#]   | N/A        | —      |
| **Loops Missing `trackBy`** | [#]   | 0%         | ✅     |

**Target:** 100% of loops must have explicit `trackBy` function

**Coverage report:** `TRACKBY-COVERAGE-[issue]-[phase].txt`

---

## Browser DevTools Timeline Snapshots

### Subscription Update Performance

- **High-frequency subscription (1000/sec raw):**
  - Raw cycle: [ms]
  - Buffered (250ms): [ms]
  - Buffer aggregation efficiency: [%]

- **Medium-frequency subscription (10/sec):**
  - Cycle: [ms]
  - Memory delta: [MB]

- **Low-frequency subscription (<1/sec):**
  - Cycle: [ms]
  - Baseline CPU impact: [%]

**Snapshots:** `DEVTOOLS-TIMELINE-[issue]-[phase]-[type].json`

---

## Runtime Metrics

### Memory Usage

| Scenario            | Initial (MB) | Peak (MB) | Final (MB) | Leak? |
| ------------------- | ------------ | --------- | ---------- | ----- |
| Dashboard load      | [value]      | [value]   | [value]    | ✅/⚠️ |
| Subscription active | [value]      | [value]   | [value]    | ✅/⚠️ |
| Tab navigation x10  | [value]      | [value]   | [value]    | ✅/⚠️ |
| Cleanup/unsubscribe | [value]      | [value]   | [value]    | ✅/⚠️ |

**Profiler report:** `MEMORY-PROFILE-[issue]-[phase].json`

### CPU Usage

- **Idle CPU:** [%]
- **During subscription (high frequency):** [%]
- **During navigation:** [%]

**DevTools recording:** `CPU-PROFILE-[issue]-[phase].json`

---

## Accessibility Performance (a11y)

### Keyboard Navigation

- **Tab order verification:** [count] elements verified
- **Arrow key navigation (tabs):** ✅ Working
- **Escape key (modals):** ✅ Closes
- **Focus trap in modals:** ✅ Verified
- **Focus restoration on close:** ✅ Verified

**Coverage:** 100% of interactive elements

**Test output:** `KEYBOARD-AUDIT-[issue]-[phase].log`

### ARIA Compliance

- **Missing `aria-label` attributes:** [#]
- **Improperly associated labels:** [#]
- **Missing live regions:** [#]
- **Incorrect roles:** [#]

**Coverage:** 100% compliance verified

**Audit output:** `ARIA-AUDIT-[issue]-[phase].log`

---

## Summary & Baseline Comparison

### Status

| Category               | Before | After | Status | Notes     |
| ---------------------- | ------ | ----- | ------ | --------- |
| Lighthouse Score       | [#]    | [#]   | ✅/⚠️  | [comment] |
| Bundle Size            | [KB]   | [KB]  | ✅/⚠️  | [comment] |
| Change Detection Cycle | [ms]   | [ms]  | ✅/⚠️  | [comment] |
| TrackBy Coverage       | [%]    | [%]   | ✅/⚠️  | [comment] |
| Memory Usage           | [MB]   | [MB]  | ✅/⚠️  | [comment] |
| Accessibility Score    | [#]    | [#]   | ✅/⚠️  | [comment] |

### Regressions Detected

- [ ] No regressions (all metrics improved or stable)
- [x] Minor regressions (acceptable trade-offs documented below)
- [ ] Critical regressions (BLOCK - needs fixing)

**Detailed analysis:**

[Document any acceptable regressions and their trade-offs]

---

## Verification Checklist

- [ ] Lighthouse audit completed (desktop + mobile)
- [ ] Bundle size analysis generated
- [ ] Change detection profiling captured
- [ ] TrackBy coverage verified at 100%
- [ ] DevTools timeline snapshots collected
- [ ] Memory profiling shows no leaks
- [ ] a11y keyboard navigation tested
- [ ] ARIA compliance audit passed
- [ ] All metrics compared to baseline
- [ ] No critical regressions detected
- [ ] Evidence files committed to `.claude/evidence/`

---

## Files Generated

```
.claude/evidence/
├── LIGHTHOUSE-[issue]-[phase]-desktop.json
├── LIGHTHOUSE-[issue]-[phase]-mobile.json
├── BUNDLE-ANALYSIS-[issue]-[phase].json
├── PROFILER-TIMELINE-[issue]-[phase].json
├── CHANGE-DETECTION-AUDIT-[issue]-[phase].md
├── TRACKBY-COVERAGE-[issue]-[phase].txt
├── DEVTOOLS-TIMELINE-[issue]-[phase]-subscription.json
├── MEMORY-PROFILE-[issue]-[phase].json
├── CPU-PROFILE-[issue]-[phase].json
├── KEYBOARD-AUDIT-[issue]-[phase].log
├── ARIA-AUDIT-[issue]-[phase].log
└── PERFORMANCE-METRICS-[issue]-[phase].md (this file)
```

---

## Related Documentation

- [EVIDENCE-ARTIFACTS.md](./../EVIDENCE-ARTIFACTS.md) — Gate 2 evidence system
- [./../rules/frontend-patterns.md](./../rules/frontend-patterns.md) — Performance rules (trackBy, OnPush)
- [./../rules/graphql-patterns.md](./../rules/graphql-patterns.md) — Query depth optimization

---

**Template Version:** 1.0.0  
**Last Updated:** 2026-08-02
