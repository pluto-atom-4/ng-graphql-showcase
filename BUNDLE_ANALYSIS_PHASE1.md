# Phase 1: Bundle Analysis & Measurement

## Current Bundle Size (Before Optimization)

| Asset        | Raw Size      | Gzipped       | % of Total |
| ------------ | ------------- | ------------- | ---------- |
| main.js      | 560.08 kB     | 144.07 kB     | 62.9%      |
| styles.css   | 294.74 kB     | 36.62 kB      | 33.1%      |
| polyfills.js | 34.84 kB      | 11.34 kB      | 3.9%       |
| runtime.js   | 0.89 kB       | 0.52 kB       | 0.1%       |
| **TOTAL**    | **890.55 kB** | **192.54 kB** | **100%**   |

Budget status: **EXCEEDED** by 390.55 kB (Budget: 500 kB)

## CSS Framework Analysis

### Current Configuration

- **Framework**: Tailwind CSS v3 + daisyUI v5.6.18
- **Themes**: light + dark (both bundled)
- **Features**: styled, base, utils all enabled
- **Content paths**: `./src/**/*.{html,ts}` + `node_modules/daisyui/**/*.{js,jsx,ts,tsx,vue}`

### CSS Breakdown (294.74 KB)

- Tailwind base utilities: ~120-140 KB
- daisyUI components: ~80-100 KB
- Custom Tailwind components: ~20-30 KB
- Media queries + selectors: ~30-40 KB
- Unused utilities (PurgeCSS opportunity): ~30-40 KB

### daisyUI Usage

- Project defines custom `.card`, `.badge-*`, `.button-*`, `.skeleton` classes
- daisyUI appears to be overlapping with custom components
- Dark theme bundled but rarely used
- Component library bloat: ~25% of CSS

## Optimization Opportunities

### Phase 2A: Tailwind CSS Optimization

- **Remove dark theme**: -30-40 KB CSS
- **Disable unused daisyUI features**: -20-30 KB CSS
- **Enable aggressive PurgeCSS**: -20-30 KB CSS
- **Expected savings**: 70-100 KB (24-34% CSS reduction)

### Phase 2B: Replace daisyUI Components

- Create custom lightweight CSS for badges, modals
- Remove daisyUI plugin entirely
- Migrate component references in templates
- **Expected savings**: 40-60 KB (13-20% CSS reduction)

### Phase 3: Route-Based Code Splitting

- Lazy-load dashboard route (currently always loaded)
- Separate chunk for dashboard + dependencies
- Home page becomes lighter for initial load
- **Expected savings**: 70-100 KB from main bundle (12-18% JS reduction)

### Phase 4: Tree-Shaking & Dependencies

- Remove unused Angular modules
- Move a11y testing tools to devDependencies
- Optimize import patterns
- **Expected savings**: 20-50 KB (3-9% JS reduction)

### Phase 5: GraphQL Codegen Optimization

- Enable `onlyOperationTypes` flag
- Skip unused schema definitions
- **Expected savings**: 3-5 KB

## Total Expected Optimization

- **Current**: 890.55 kB raw (192.54 kB gzipped)
- **Target**: <400 kB raw (<120 kB gzipped)
- **Expected total savings**: 164-264 KB raw (18-30% reduction)
- **Gzipped savings**: ~30-40 KB (16-21% reduction)

## Key Findings

1. **CSS is dominant problem**: 33% of bundle (294 KB)
   - daisyUI overhead significant
   - Both light + dark themes included

2. **JavaScript bloat**: 62.9% of bundle (560 KB)
   - Main bundle includes all routes + dependencies
   - No code splitting for dashboard (lazy routes)

3. **Unused utilities**: ~30-40 KB of CSS never used in templates
   - PurgeCSS can reduce this aggressively

4. **Dependency overlap**: Custom components duplicate daisyUI
   - Both systems bundled together
   - Opportunity for complete daisyUI removal

## Next Steps

1. Phase 2A: Optimize Tailwind CSS configuration
2. Phase 2B: Replace daisyUI with custom CSS
3. Phase 3: Implement route-based code splitting
4. Phase 4: Tree-shake unused code
5. Phase 5: Optimize GraphQL codegen
6. Phase 6: Comprehensive testing
7. Phase 7: Documentation & deployment
