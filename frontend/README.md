# Angular GraphQL Dashboard - Frontend

**Version:** 1.0.0  
**Status:** Production Ready  
**Accessibility:** WCAG 2.1 Level AA  
**Performance:** Lighthouse 92 (Accessibility)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (port 4200)
pnpm ng serve

# Run tests
pnpm test

# Run a11y tests
pnpm test:a11y

# Run keyboard navigation tests
pnpm test:keyboard

# Build for production
pnpm build
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── components/          # Feature components
│   │   │   │   ├── tabs/
│   │   │   │   ├── modal-container/
│   │   │   │   ├── build-details-modal/
│   │   │   │   ├── metrics-grid/
│   │   │   │   ├── activity-timeline/
│   │   │   │   ├── error-state/
│   │   │   │   └── inline-editor/
│   │   │   ├── shared/              # Shared (reusable) components
│   │   │   │   ├── button/
│   │   │   │   ├── badge/
│   │   │   │   ├── pagination/
│   │   │   │   └── empty-state/
│   │   │   ├── services/            # Data services
│   │   │   │   ├── build.service.ts
│   │   │   │   ├── modal.service.ts
│   │   │   │   ├── focus-trap.service.ts
│   │   │   │   └── focus-restore.service.ts
│   │   │   ├── containers/          # Smart components (connect to services)
│   │   │   └── a11y/                # Accessibility utilities
│   │   └── __tests__/               # Integration tests
│   ├── docs/                        # Documentation
│   │   ├── COMPONENT_EXAMPLES.md
│   │   ├── BUILDSERVICE_INTEGRATION.md
│   │   └── REACT_TO_ANGULAR_MIGRATION.md
│   ├── a11y/                        # Accessibility guides
│   │   ├── KEYBOARD_NAVIGATION_GUIDE.md
│   │   ├── FOCUS_MANAGEMENT_GUIDE.md
│   │   ├── SCREEN_READER_GUIDE.md
│   │   └── WCAG_AA_CHECKLIST.md
│   └── index.html
├── README.md
└── package.json
```

## Architecture Overview

### Component Hierarchy

```
DashboardContainer
├── MetricsGrid
│   └── MetricCard[] (4x)
├── BuildsList
│   ├── Pagination
│   └── BuildRow[] (*ngFor with trackBy)
│       ├── Badge
│       └── Buttons
├── ModalContainer (conditional)
│   └── BuildDetailsModal
│       ├── InlineEditor[]
│       └── Buttons
└── ActivityTimeline
    └── Activity[] (*ngFor or virtual scroll >100)
```

### Route Architecture (Lazy Loading)

```
Home Route (Eager)
├── Loaded on app startup
└── 538.05 KB (main bundle)

Dashboard Route (Lazy)
├── Loaded on first navigation
├── 57.79 KB (separate chunk)
└── Only downloaded when needed

Total Initial Load: 618.47 KB
With Dashboard: 676.26 KB (loaded on-demand)
```

### Data Flow

```
┌─────────────────────┐
│   GraphQL Server    │
│  (Hot Chocolate)    │
└──────────┬──────────┘
           │ Queries/Subscriptions
┌──────────▼──────────┐
│  Apollo Client      │
│  (Caching)          │
└──────────┬──────────┘
           │
┌──────────▼──────────────────┐
│  Services (BuildService)    │
│  - getBuilds() cached       │
│  - subscribeToStatusChange()│
│    (buffered 250ms)         │
│  - getMetrics()             │
│  - getActivities()          │
└──────────┬──────────────────┘
           │ Observable<T>
┌──────────▼──────────────────┐
│  Components                 │
│  - OnPush change detection  │
│  - async pipe unsubscribe   │
│  - trackBy on loops         │
└─────────────────────────────┘
```

## Key Technologies

- **Framework:** Angular 19+
- **Language:** TypeScript 5+
- **State:** RxJS Observables
- **GraphQL Client:** Apollo Angular
- **Build Tool:** Vite/Angular CLI
- **Testing:** Vitest + Testing Library
- **Accessibility:** WCAG 2.1 Level AA
- **CSS:** Tailwind CSS

## Component Library Overview

### Shared Components (14 Components)

| Component                      | Purpose            | Inputs                             | Outputs           | Status |
| ------------------------------ | ------------------ | ---------------------------------- | ----------------- | ------ |
| **ButtonComponent**            | Styled button      | variant, size, loading, disabled   | clicked           | ✓      |
| **BadgeComponent**             | Status indicator   | status, customLabel                | —                 | ✓      |
| **PaginationComponent**        | Page navigation    | total, pageSize, currentPage       | pageChange        | ✓      |
| **EmptyStateComponent**        | Empty list state   | icon, title, description, ctaLabel | cta               | ✓      |
| **TabsComponent**              | Tab group          | tabs, activeIndex                  | activeIndexChange | ✓      |
| **MetricsGridComponent**       | 4-column KPI grid  | metrics                            | —                 | ✓      |
| **MetricCardComponent**        | Single metric      | label, count, status               | —                 | ✓      |
| **ActivityTimelineComponent**  | Timeline list      | activities                         | —                 | ✓      |
| **ModalContainerComponent**    | Modal wrapper      | config, triggerElement             | close             | ✓      |
| **BuildDetailsModalComponent** | Build edit form    | build                              | save, cancel      | ✓      |
| **InlineEditorComponent**      | Inline text editor | value, label, config               | save, cancel      | ✓      |
| **ErrorStateComponent**        | Error display      | icon, title, message, errorDetails | retry             | ✓      |

All components:

- [x] Standalone (no NgModule)
- [x] OnPush change detection
- [x] TypeScript strict mode
- [x] Full JSDoc documentation
- [x] WCAG 2.1 AA accessible
- [x] Unit & integration tests

## Performance Metrics

### Build Size (Phase 7B Optimized)

| Metric                    | Size                              | Status                   |
| ------------------------- | --------------------------------- | ------------------------ |
| **Initial Bundle (Main)** | 538.05 KB raw / 143.49 KB gzipped | ✓ Optimized              |
| **Styles**                | 43.05 KB raw / 6.02 KB gzipped    | ✓ -85% (removed daisyUI) |
| **Lazy Dashboard**        | 57.79 KB raw / 14.51 KB gzipped   | ✓ On-demand only         |
| **Total Initial**         | 618.47 KB raw / 162.03 KB gzipped | **✓ 30.5% reduction**    |
| **Development**           | 2.5 MB (unminified)               | —                        |

**Optimization Status:** See [BUNDLE_SIZE_OPTIMIZATION.md](./docs/BUNDLE_SIZE_OPTIMIZATION.md) for details

### Change Detection

- **All components:** OnPush strategy
- **Default strategy:** Disabled (reduces CD cycles)
- **Manual triggers:** `cdr.markForCheck()` only when needed

### Rendering Performance

- **trackBy coverage:** 100% on all `*ngFor` loops
- **Virtual scrolling:** Enabled for lists >100 items
- **Lighthouse Score:** 92 (Accessibility)
- **Lighthouse CLS:** <0.1 (Cumulative Layout Shift)

### Network Performance

- **Subscription buffering:** 250ms (reduces API calls)
- **Response caching:** Per-page caching via `shareReplay(1)`
- **Cache invalidation:** Manual via `buildService.clearCache()`

## Testing

### Run Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test --watch

# Accessibility tests
pnpm test:a11y

# Keyboard navigation tests
pnpm test:keyboard

# Coverage report
pnpm test --coverage
```

### Test Coverage

- **Unit Tests:** 130+ tests
- **Keyboard Navigation:** 42 tests
- **ARIA Compliance:** 49 tests
- **Overall Coverage:** >90%

### Manual Testing

```bash
# Lighthouse audit
pnpm audit:lighthouse

# Pa11y accessibility audit
pnpm audit:pa11y

# Visual regression (if configured)
pnpm test:visual
```

## Accessibility (a11y)

**Status:** ✓ WCAG 2.1 Level AA Compliant

### Keyboard Navigation

- [x] Tab/Shift+Tab through all interactive elements
- [x] Arrow keys for tabs, dropdowns, lists
- [x] Home/End for first/last in lists
- [x] Escape to close modals
- [x] Focus trap in modals
- [x] Focus restoration after modal closes

**Test:** Run `pnpm test:keyboard`

### Screen Reader Support

- [x] Semantic HTML (`<button>`, `<label>`, `<input>`)
- [x] ARIA roles/labels on all components
- [x] Live regions for status updates
- [x] Error announcements as alerts
- [x] Form validation messages

**Test:** Manual with NVDA (Windows) or VoiceOver (Mac)

### Visual Accessibility

- [x] Color contrast: 4.5:1 - 5.3:1 (WCAG AA)
- [x] Focus indicators: 2px outline, high contrast
- [x] Touch targets: 44x44px minimum
- [x] Responsive at 200% zoom

### Compliance Documentation

- [KEYBOARD_NAVIGATION_GUIDE.md](./a11y/KEYBOARD_NAVIGATION_GUIDE.md) — Tab order, arrow keys
- [FOCUS_MANAGEMENT_GUIDE.md](./a11y/FOCUS_MANAGEMENT_GUIDE.md) — Modal focus, focus trap
- [SCREEN_READER_GUIDE.md](./a11y/SCREEN_READER_GUIDE.md) — ARIA implementation
- [WCAG_AA_CHECKLIST.md](./a11y/WCAG_AA_CHECKLIST.md) — Compliance verification

## Documentation

### Getting Started

1. [Component Examples](./docs/COMPONENT_EXAMPLES.md) — Copy-paste component snippets
2. [BuildService Integration](./docs/BUILDSERVICE_INTEGRATION.md) — Data access patterns
3. [React-to-Angular Migration](./docs/REACT_TO_ANGULAR_MIGRATION.md) — For React developers

### Architecture & Design

- [Frontend Architecture](./README.md) — This file
- [Component JSDoc](./src/app/dashboard/shared/) — Inline component documentation

### Accessibility

- [Keyboard Navigation Guide](./a11y/KEYBOARD_NAVIGATION_GUIDE.md)
- [Focus Management Guide](./a11y/FOCUS_MANAGEMENT_GUIDE.md)
- [Screen Reader Guide](./a11y/SCREEN_READER_GUIDE.md)
- [WCAG AA Compliance](./a11y/WCAG_AA_CHECKLIST.md)

## Troubleshooting

### Build Issues

| Issue                 | Solution                          |
| --------------------- | --------------------------------- |
| "Module not found"    | Run `pnpm install`                |
| Port 4200 in use      | Use `--port 4201` or kill process |
| Circular dependencies | Check imports, use barrel exports |

### Runtime Issues

| Issue                         | Solution                                   |
| ----------------------------- | ------------------------------------------ |
| "Cannot find module"          | Run `pnpm codegen` (regenerate graphql.ts) |
| Styles not loading            | Check component `styles:` or `styleUrls:`  |
| Change detection not updating | Use `OnPush` + `cdr.markForCheck()`        |

### GraphQL Issues

| Issue                     | Solution                                    |
| ------------------------- | ------------------------------------------- |
| "GraphQL schema mismatch" | Rebuild backend, run `pnpm codegen`         |
| Subscription disconnects  | Add retry logic, check WebSocket connection |
| Apollo cache stale        | Call `buildService.clearCache()`            |

## Performance Optimization Guide

### Rule 1: OnPush Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // Always
})
export class MyComponent {}
```

### Rule 2: Always Use trackBy

```html
<div *ngFor="let item of items; trackBy: trackByItemId">{{ item.name }}</div>
```

### Rule 3: Unsubscribe on Destroy

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.observable
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Rule 4: Use shareReplay for Shared Data

```typescript
this.data$ = this.service.getData().pipe(
  shareReplay(1), // Single subscription, shared result
);
```

### Rule 5: Buffer High-Frequency Updates

```typescript
this.updates$ = this.service.subscribe().pipe(
  bufferTime(250), // Aggregate every 250ms
  filter((updates) => updates.length > 0),
);
```

## Related Documentation

- [Backend API](../../backend/README.md)
- [Full Project README](../../README.md)
- [GraphQL Schema](../../schema.graphql)

## Support

### Common Questions

**Q: How do I add a new component?**  
A: See [COMPONENT_EXAMPLES.md](./docs/COMPONENT_EXAMPLES.md)

**Q: How do I integrate with BuildService?**  
A: See [BUILDSERVICE_INTEGRATION.md](./docs/BUILDSERVICE_INTEGRATION.md)

**Q: How do I make components accessible?**  
A: See [SCREEN_READER_GUIDE.md](./a11y/SCREEN_READER_GUIDE.md)

**Q: How do I optimize performance?**  
A: Use OnPush, trackBy, unsubscribe, shareReplay, bufferTime

### Getting Help

- Check our documentation files
- Search [Stack Overflow: angular tag](https://stackoverflow.com/questions/tagged/angular)
- Join [Angular Discord](https://discord.gg/angular)

## Version History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 1.1.0   | 2026-08-10 | Phase 7B: Bundle size optimization (-30.5%, 272 KB)  |
| 1.0.0   | 2026-08-03 | Initial release with Phase 6 documentation & handoff |
| 0.5.0   | 2026-07-25 | Phase 5: Accessibility enhancements                  |
| 0.4.0   | 2026-07-10 | Phase 4: Component library                           |

## License

This project is part of the Stoke Factory Application (proprietary).

---

**Last Updated:** 2026-08-03  
**Maintainer:** Engineering Team  
**Status:** ✓ Production Ready
