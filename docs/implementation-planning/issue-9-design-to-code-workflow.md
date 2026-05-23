# Issue #9: Design-to-Code Agentic AI Workflow Implementation Plan

**Issue**: #9 - Design-to-Code Agentic AI Workflow: Figma → Builder.io → JetBrains Rider (2026 Best Practices)  
**Status**: 🔄 Open (Planning Phase)  
**Created**: 2026-05-22  
**Timeline**: 5 weeks (Phase-based delivery)

---

## Executive Summary

Establish **end-to-end design-to-code automation** from Figma design → type-safe Angular components → Hot Chocolate GraphQL → C# resolvers → SQL queries, reducing component boilerplate by ~70% while maintaining 100% type safety.

### MVP UI Philosophy
- **Keep it simple**: Focus on **reusable, presentational components** (buttons, cards, inputs, badges, progress bars)
- **No page-level state management in Figma**: Designers design individual **components in isolation**, not entire pages
- **Data flows from outside**: Components receive `@Input()` data from parent containers or GraphQL subscriptions
- **Sufficient for production**: Minimal styling (Tailwind defaults), no custom CSS, responsive via utility classes only
- **Efficiency first**: Generator-friendly designs that convert to code with zero post-processing

**Workflow Architecture**:
```
[ Figma Component Library ]  ──►  [ Builder.io Visual Copilot ]  ──►  [ Generated Angular ]
  (Atomic components only)         (AI Code Gen - minimal styling)     (Type-Safe inputs/outputs)
        ↓                                                                       ↓
  [Design Tokens]                                            [Copilot CLI: Wire to GraphQL]
  (Colors, spacing, typography)                              (Container handles state)
        ↓                                                                       ↓
[ Figma Code Connect ]         [ Hot Chocolate GQL ]
  (Keep design ↔ code in sync)    (Manages data flow)
```

---

## Phase 1: Foundation (Week 1-2)

### Goals
- Install and configure Builder.io CLI
- Set up Figma API integration
- Initialize Figma Code Connect for bidirectional sync
- Prepare local Figma MCP for Copilot CLI queries

### Tasks

**1.1 Builder.io CLI Setup**
- [ ] Install `@builder.io/cli`: `pnpm add -D @builder.io/cli`
- [ ] Store credentials in GitHub Secrets: `BUILDER_IO_API_TOKEN`, `BUILDER_IO_SPACE_ID`
- [ ] Create `.builderio/config.json` with Figma integration
- [ ] Test sync: `builder-cli sync --figma-file-id <ID> --output frontend/src/app/components/generated/`

**1.2 Figma API Integration**
- [ ] Store Figma credentials: `FIGMA_API_TOKEN`, `FIGMA_PROJECT_ID` in GitHub Secrets
- [ ] **Create minimal component library** (MVP focus):
  - Start with **5-10 atomic components**: Button, Card, Input, Badge, ProgressBar, Spinner, Modal, Tooltip, Drawer, Alert
  - Each component designed in **isolation** (no page context)
  - No state management diagrams in Figma (that's handled by Angular containers)
  - Simple, production-ready styling (Tailwind v4 defaults, no custom CSS)
- [ ] Create Figma design tokens export
- [ ] Set up pnpm script: `pnpm design:sync`
- [ ] Test local sync once manually

**1.3 Figma Code Connect (Bidirectional Sync)**
- [ ] Install `figma-code-connect`: `pnpm add -D figma-code-connect`
- [ ] Configure `.figma-code-connect-config.json`
- [ ] Annotate 3 existing components with `@figma` directives
- [ ] Test sync back to Figma: `figma-code-connect sync`
- [ ] Create pnpm script: `pnpm design:sync-back`

**1.4 Figma MCP for Copilot CLI**
- [ ] Install Figma MCP: `pnpm add -D @figma/mcp`
- [ ] Configure in `.claude/settings.json` (Claude Code)
- [ ] Add MCP startup script: `pnpm mcp:figma`
- [ ] Test Copilot CLI can query Figma tokens
- [ ] Document MCP endpoint for team

### Deliverables
- ✅ Builder.io CLI working, GitHub Actions ready
- ✅ Figma API tokens configured and tested
- ✅ Figma Code Connect syncing components bidirectionally
- ✅ Figma MCP running, Copilot CLI can query it

**Success Criteria**: Each tool individually tested and confirmed working. No integration issues yet.

---

## Phase 2: GitHub Actions Automation (Week 2-3)

### Goals
- Automate component generation from Figma
- Add quality gates (linting, type-checking, GraphQL validation)
- Create PR workflow for generated components

### Tasks

**2.1 Create Figma-to-Code Workflow (`.github/workflows/figma-to-code.yml`)**
- [ ] Trigger on: manual dispatch + weekly schedule (Monday 9 AM) + config changes
- [ ] Step 1: Sync from Figma via Builder.io
  ```yaml
  - name: Sync Figma → Builder.io → Angular
    env:
      FIGMA_API_TOKEN: ${{ secrets.FIGMA_API_TOKEN }}
      BUILDER_IO_API_TOKEN: ${{ secrets.BUILDER_IO_API_TOKEN }}
    run: pnpm design:sync
  ```
- [ ] Step 2: Lint generated components
  ```yaml
  - name: ESLint + Angular Schematics
    run: pnpm lint --dir=frontend frontend/src/app/components/generated/
  ```
- [ ] Step 3: Type-check TypeScript
  ```yaml
  - name: TypeScript strict check
    run: pnpm exec tsc --noEmit frontend/src/app/components/generated/**/*.ts
  ```
- [ ] Step 4: Regenerate GraphQL types
  ```yaml
  - name: GraphQL Code Generation
    run: pnpm --filter=frontend codegen
  ```
- [ ] Step 5: Auto-create PR
  ```yaml
  - name: Create PR for generated components
    uses: peter-evans/create-pull-request@v4
    with:
      commit-message: 'chore: auto-generate components from Figma [skip ci]'
      title: 'Auto-Generated: Figma Component Sync #${{ github.run_number }}'
      branch: 'auto/figma-sync-${{ github.run_number }}'
  ```

**2.2 Create Quality Gate Workflow (`.github/workflows/validate-generated-code.yml`)**
- [ ] Trigger: PR opened with changes in `frontend/src/app/components/generated/`
- [ ] Validation rules:
  - ✅ `ChangeDetectionStrategy.OnPush` required
  - ✅ All `@Input()` have explicit types
  - ✅ All `*ngFor` have `trackBy` functions
  - ✅ Tailwind v4 syntax only (no v3 classes)
  - ✅ No console.log or debugger statements
  - ✅ Security scan passes (pnpm audit, SAST)
- [ ] Step: Run custom validator script
  ```yaml
  - name: Validate component architecture
    run: pnpm validate:generated-components
  ```
- [ ] Verdict: Block merge if validation fails

**2.3 Add Component Validator Script**
- [ ] Create `scripts/validate-generated-components.js`
- [ ] Checks:
  1. Parse each `.component.ts` file (AST parsing)
  2. Verify `ChangeDetectionStrategy.OnPush`
  3. Check for required `@Input()` type annotations
  4. Count `*ngFor` loops without `trackBy`
  5. Scan for deprecated Tailwind classes
  6. Report violations with file:line references
- [ ] Add pnpm script: `"validate:generated-components": "node scripts/validate-generated-components.js"`

### Deliverables
- ✅ `.github/workflows/figma-to-code.yml` (auto-generation)
- ✅ `.github/workflows/validate-generated-code.yml` (quality gates)
- ✅ `scripts/validate-generated-components.js` (component validator)
- ✅ First auto-generated PR successfully created and validated

**Success Criteria**: 
- Auto-sync runs successfully
- Generated code passes all linting
- Type errors caught by validator
- PR created with clean CI/CD status

---

## Phase 3: Copilot CLI Integration (Week 3-4)

### Goals
- Create GitHub Copilot CLI skill for orchestrating the full workflow
- Add Copilot rules for generated component validation
- Enable Copilot to auto-wire generated components to GraphQL

### Tasks

**3.1 Create Copilot CLI Skill (`/design-to-code`)**
- [ ] Create `.github/copilot/skills/design-to-code.md`
- [ ] Skill workflow:
  1. Query Figma design tokens via MCP
  2. Fetch Builder.io generated component code
  3. Validate TypeScript types against GraphQL schema
  4. Generate Hot Chocolate resolver stub
  5. Create Dapper SQL query stub
  6. Validate end-to-end type safety
- [ ] Usage examples:
  ```bash
  gh copilot -- design-to-code --component "BuildCard" --connect-to "BuildQuery"
  gh copilot -- design-to-code --validate-all --figma-project <ID>
  ```

**3.2 Create Copilot Rules for Generated Components**
- [ ] Create `.github/copilot/rules/generated-component-validation.md`
- [ ] Mandatory checks:
  - ✅ ChangeDetectionStrategy.OnPush
  - ✅ Type-safe inputs
  - ✅ GraphQL integration (subscription/query)
  - ✅ Error states handled
  - ✅ Loading states handled
  - ✅ No secrets in code
- [ ] Link rule from `.github/copilot-instructions.md`

**3.3 Create Copilot Prompts for Code Generation**
- [ ] Prompt 1: Extract GraphQL types for Figma component
  ```
  gh copilot suggest "Extract all GraphQL types used in BuildCard component and create TypeScript interfaces matching Figma design props"
  ```
- [ ] Prompt 2: Wire component to GraphQL subscription
  ```
  gh copilot suggest "Create RxJS subscription wrapper for BuildCard component that connects to Hot Chocolate BuildQuery subscription with bufferTime(250) for high-frequency updates"
  ```
- [ ] Prompt 3: Generate C# resolver stub
  ```
  gh copilot suggest "Generate Hot Chocolate resolver for BuildQuery that uses DataLoader pattern, validates auth scopes, and returns type-safe BuildDto"
  ```
- [ ] Prompt 4: Create SQL migration
  ```
  gh copilot suggest "Generate Dapper query to insert BuildProgressMetrics with proper transaction handling"
  ```

**3.4 Integrate Copilot CLI into GitHub Actions**
- [ ] Add to `.github/workflows/figma-to-code.yml`:
  ```yaml
  - name: Orchestrate design-to-code via Copilot CLI
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: |
      gh copilot -- design-to-code \
        --validate-all \
        --figma-project ${{ secrets.FIGMA_PROJECT_ID }} \
        --validate-graphql \
        --validate-types
  ```
- [ ] Ensure pnpm is installed in CI environment: `uses: pnpm/action-setup@v2`

### Deliverables
- ✅ `.github/copilot/skills/design-to-code.md` (CLI skill)
- ✅ `.github/copilot/rules/generated-component-validation.md` (validation rules)
- ✅ Copilot prompts for all 4 code-generation tasks
- ✅ GitHub Actions integrated with Copilot CLI orchestration

**Success Criteria**:
- Copilot CLI skill available and documented
- Prompts tested and producing correct code
- Generated components pass validation rules
- GitHub Actions runs Copilot CLI without errors

---

## Phase 4: End-to-End Example (Week 4)

### Goals
- Create **simple, reusable component** example: `ProgressCard` from Figma → Angular → GraphQL → C# → SQL
- Demonstrate component-centric design (NOT page-level state management)
- Show how container components wire data flow
- Document the workflow

### Design Philosophy for This Example
- **Single responsibility**: `ProgressCard` displays **progress data only** (receives via `@Input()`)
- **No state management**: Card does NOT manage build state, fetch data, or handle navigation
- **Data-driven**: All data comes from parent container or GraphQL subscription
- **Minimal styling**: Uses Tailwind v4 utility classes only (no custom CSS)
- **Responsive baseline**: Works on mobile, tablet, desktop using Tailwind breakpoints only

### Tasks

**4.1 Design Component in Figma (MVP approach)**
- [ ] Create `ProgressCard` component in Figma
  - **Layout** (atomic, minimal):
    - Compact card container (320px baseline, responsive)
    - Horizontal progress bar (full-width, 4px height)
    - Status badge (top-right corner)
    - Single number: percentage (large, centered)
    - Optional: Small timestamp (bottom-right)
  - **NO page context**: Don't design a whole build dashboard; design this ONE card
  - **NO state flows**: Don't show "User clicks → fetch → error → retry"; let container handle that
  - **Design tokens only**: Use predefined colors, spacing (4px grid), typography weights
  - **Responsive variants**: 320px (mobile), 480px (tablet), 640px+ (desktop) — just adjust card width
  - **Component states**: Default, Loading, Success, Error (simple color/opacity changes only)
- [ ] Add semantic names to design elements (no abbreviations)
- [ ] Keep design simple: ~5 layers maximum
- [ ] Export design tokens (pre-configured design system)

**4.2 Generate Angular Component**
- [ ] Run Builder.io sync
  ```bash
  pnpm design:sync
  ```
  Output: `frontend/src/app/components/generated/progress-card.component.ts`
- [ ] Verify generated code:
  - ✅ Component uses `ChangeDetectionStrategy.OnPush` (efficient)
  - ✅ All `@Input()` properties have explicit types: `@Input() percentage: number`
  - ✅ No complex logic, no subscriptions, no HTTP calls
  - ✅ Tailwind classes valid v4 syntax (no custom CSS)
  - ✅ Component is **dumb**: just displays what it receives
- [ ] Annotate with `@figma` directive for bidirectional sync

**4.3 Wire to GraphQL via Container**
- [ ] Create **container component** (separate file): `build-progress.container.ts`
  - Container handles: data fetching, error states, loading states, subscriptions
  - Container passes only data to `ProgressCard`: `<app-progress-card [percentage]="progress$ | async">`
- [ ] Container subscribes to `BuildProgressQuery` from Hot Chocolate
- [ ] Add error handling, loading state in **container only**
- [ ] Buffer high-frequency updates: `bufferTime(250)` in container
- [ ] Example structure:
  ```typescript
  // Container (manages data & state)
  export class BuildProgressContainerComponent {
    progress$: Observable<number>;
    isLoading$ = this.progress$.pipe(startWith(true), finalize(() => complete));
    
    constructor(private gqlService: BuildProgressQuery) {}
  }
  
  // Presentation (receives data only)
  <app-progress-card 
    [percentage]="progress$ | async"
    [isLoading]="isLoading$ | async">
  </app-progress-card>
  ```

**4.4 Create C# Resolver**
- [ ] Generate via Copilot: `gh copilot suggest "Generate Hot Chocolate resolver for BuildProgress query that returns percentage integer"`
- [ ] **Simple implementation** (MVP):
  ```csharp
  [GraphQLType]
  public class BuildProgressResolver
  {
    [GraphQLField]
    public async Task<BuildProgressDto> GetBuildProgress(
      [Service] IDataLoader<Guid, Build> buildLoader,
      Guid buildId)
    {
      var build = await buildLoader.LoadAsync(buildId);
      return new BuildProgressDto 
      { 
        Percentage = CalculateProgress(build),
        Status = build.Status.ToString()
      };
    }
    
    private int CalculateProgress(Build build)
      => build.CompletedParts * 100 / build.TotalParts;
  }
  ```
- [ ] No complex calculations; resolver is thin wrapper around data
- [ ] Add tests: resolver returns 0-100 percentage

**4.5 Create SQL Telemetry (Optional for MVP)**
- [ ] Defer detailed telemetry to Phase 2 if needed
- [ ] For MVP: Just log `{ BuildId, Percentage, Timestamp }`
- [ ] Generate via Copilot: `gh copilot suggest "Generate simple Dapper insert for build progress telemetry"`
- [ ] **Minimal** implementation:
  ```csharp
  await connection.ExecuteAsync(
    @"INSERT INTO BuildProgressLog (BuildId, Percentage, RecordedAt) 
      VALUES (@BuildId, @Percentage, @Now)",
    new { build.Id, Percentage = progress, Now = DateTime.UtcNow },
    transaction: dbTransaction
  );
  ```

**4.6 End-to-End Testing (Component-Focused)**
- [ ] Verify type safety: Figma → Angular → GraphQL → C# → SQL
- [ ] Test component states:
  - ✅ Default: percentage displays correctly
  - ✅ Loading: spinner shows (parent responsibility)
  - ✅ Error: error state (parent responsibility)
- [ ] Monitor performance: RxJS subscription buffering works
- [ ] Component is dumb: never fails due to missing data

**4.7 Document Example**
- [ ] Create PR: "Example: Design-to-Code ProgressCard Component (MVP)"
- [ ] PR description:
  - **Emphasizes MVP approach**: "Minimal, reusable component focused on single responsibility"
  - Shows Figma design (atomic component, no page context)
  - Generated Angular code (dumb component, only receives `@Input()`)
  - Container wiring (smart component handles data & errors)
  - C# resolver (thin wrapper, DataLoader for efficiency)
  - SQL query (simple telemetry insert)
  - No complex state management, routing, or business logic in component
  - All validation passing
- [ ] Create blog post: "MVP Design-to-Code: Keep Components Simple, State Management Separate"

### Deliverables
- ✅ `BuildProgressCard` designed in Figma
- ✅ Generated Angular component in `frontend/src/app/components/generated/`
- ✅ Container component wired to GraphQL
- ✅ C# Hot Chocolate resolver with DataLoader
- ✅ Dapper SQL query for telemetry
- ✅ Example PR merged to main
- ✅ Blog post published

**Success Criteria**:
- Full workflow end-to-end works without errors
- All type safety checks pass
- No manual wiring required for GraphQL integration
- Example is replicable by any developer

---

## Phase 5: Team Training & Rollout (Week 5)

### Goals
- Train team on design-to-code workflow
- Establish team practices and conventions
- Enable independent usage

### Tasks

**5.1 Developer Workshop**
- [ ] Schedule: 2-hour workshop
- [ ] Agenda:
  1. Why design-to-code matters (20 min): speed, consistency, type safety
  2. Live demo: BuildProgressCard end-to-end (30 min)
  3. Hands-on: Each dev generates a simple component (45 min)
  4. Q&A & troubleshooting (25 min)
- [ ] Deliverable: Recording + workshop slides

**5.2 Designer Workshop**
- [ ] Schedule: 1.5-hour workshop
- [ ] **MVP Design Principles** (key new content):
  - **Component-only mindset**: Design individual components, not pages
  - **No state flows in Figma**: State management happens in Angular containers (not in design)
  - **Atomic components**: Button, Card, Input, Badge, etc. (5-10 total for MVP)
  - **Simple is better**: Default Tailwind styling, no custom CSS, no complex interactions in design
  - **Data-driven design**: Components receive data via `@Input()` from parent or GQL subscription
  - **Container pattern**: Show how "smart container" + "dumb component" separation works
- [ ] Agenda:
  1. MVP design philosophy (20 min): Why simple components matter
  2. Atomic design tokens (20 min): Colors, spacing, typography only
  3. Component variants (15 min): Loading, success, error (simple visual differences)
  4. Responsive design (15 min): Figma auto-layout for mobile/tablet/desktop
  5. What NOT to design (10 min): No page flows, no state management, no complex interactions
  6. Tools demo (10 min): Builder.io code output, how clean designs stay clean in code
- [ ] Deliverable: Figma template with atomic components only

**5.3 Create Figma Template (MVP)**
- [ ] Pre-configured design tokens: 8 colors (brand + neutral), 6 spacing values, 3 typography weights
- [ ] **5 core atomic components**:
  - Button (3 sizes × 2 states = 6 variants)
  - Card (with header + body + footer slots)
  - Input field (text, with label + error state)
  - Badge (color variants: primary, success, error, warning)
  - ProgressBar (horizontal, simple)
- [ ] **No page templates**: Don't create page designs; let developers compose components
- [ ] Naming convention: `[Component]/[Variant]/[State]` (e.g., `Button/Primary/Default`)
- [ ] Share with design team

**5.4 Documentation (MVP-focused)**
- [ ] Create `docs/design-to-code-quickstart.md`
  - For designers: "Design atomic components, not pages"
  - For developers: "Components are dumb; containers are smart"
  - For both: End-to-end workflow with `ProgressCard` example
  - Key: "Simplicity = Efficiency = Less post-processing"
- [ ] Create `docs/figma-conventions.md`
  - Naming rules (semantic, no abbreviations)
  - Atomic design system (5-10 core components to start)
  - Responsive: Figma auto-layout, Tailwind breakpoints
  - **What NOT to design**: Page flows, complex state, navigation, business logic
  - Component isolation principle
- [ ] Create `docs/builder-io-best-practices.md`
  - Minimal styling (Tailwind defaults)
  - Template structure (one component = one file)
  - No custom CSS (all Tailwind utility classes)
  - Testing generated code (just verify it renders)
  - Post-generation: Wire to container + GraphQL (that's developer's job)
- [ ] Update README.md with link to design-to-code docs

**5.5 Establish Team Practices (MVP-centric)**
- [ ] Review checklist **BEFORE Figma design**:
  - Is this an atomic component or a page? (Should be atomic)
  - Does the component have a single responsibility? (Yes = good)
  - Will the component receive all data via `@Input()`? (Yes = good)
  - Do we need state management in this component? (No = good)
  - Are we using design tokens only? (Yes = good)
- [ ] Review checklist for **generated components**:
  - Is component dumb (no logic beyond display)? ✅
  - All `@Input()` properties typed? ✅
  - No HTTP calls or subscriptions inside component? ✅
  - Tailwind v4 classes only (no custom CSS)? ✅
  - Component could be used in 3+ different container scenarios? ✅
  - All validation rules pass? ✅
- [ ] **Anti-pattern checklist** (what should NOT happen):
  - ❌ Component fetches its own data (container should)
  - ❌ Component manages route navigation (container should)
  - ❌ Component has business logic (resolver should)
  - ❌ Component has custom CSS (use Tailwind utilities)
  - ❌ Figma design shows entire page (design components only)
  - ❌ Design includes state flow diagrams (that's architecture, not design)
- [ ] Metrics: Track adoption over first month
  - % of new components using design-to-code
  - Average time from design to PR (target: <30 min for simple component)
  - Type safety (0 type errors in generated code)
  - Reusability (component used in ≥2 containers within 2 weeks)

### Deliverables
- ✅ Developer workshop completed & recorded
- ✅ Designer workshop completed & recorded
- ✅ Figma template created & shared
- ✅ All documentation published
- ✅ Team practices established

**Success Criteria**:
- ≥80% of developers can generate a component independently
- ≥80% of designers understand Figma setup
- New components 50% faster from design to merge

---

## Success Metrics

| Metric | Baseline | Target | Success |
|--------|----------|--------|---------|
| **Time to Component** | 4 hours | 1 hour | 75% faster |
| **Boilerplate Reduction** | 100% manual | 70% generated | Generated = 70% |
| **Type Safety Issues** | 3-5 per PR | 0 | Zero type errors |
| **Developer Adoption** | 0% | 80% | 80% using workflow |
| **PR Merge Time** | 2-3 days | < 30 min | Half-day turnaround |
| **Type Coverage** | 90% | 100% | All types defined |

---

## Timeline & Ownership

| Phase | Duration | Owner | Notes |
|-------|----------|-------|-------|
| Phase 1 | Week 1-2 | Frontend Lead | Foundation setup |
| Phase 2 | Week 2-3 | DevOps + Frontend | GitHub Actions automation |
| Phase 3 | Week 3-4 | Frontend Lead + Copilot CLI Expert | Copilot integration |
| Phase 4 | Week 4 | Frontend Lead | Example & documentation |
| Phase 5 | Week 5 | All hands | Team training & rollout |

**Total Duration**: 5 weeks (parallel work in weeks 2-3)

---

## Related Issues & Documentation

- **Issue #7**: Security hardening (covers API token management for design services)
- **Issue #10**: Container service (may need updates for Figma MCP endpoint)
- **Issue #16**: Copilot CLI skills (related infrastructure)
- **PR #19**: Copilot PR review workflow (used for validating generated components)
- **Docs**: `CLAUDE.md` (existing monorepo architecture)
- **Docs**: `docs/research-architecuture-design.md` (design patterns)

---

## Next Steps

1. ✅ Read & approve this implementation plan
2. ⏳ **Week 1**: Start Phase 1 (Foundation)
3. ⏳ **Week 2**: Start Phase 2 (GitHub Actions) in parallel
4. ⏳ **Week 4**: Execute end-to-end example (Phase 4)
5. ⏳ **Week 5**: Team training & rollout (Phase 5)

---

## Document Control

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-22 | Draft | Initial implementation plan based on Issue #9 |

