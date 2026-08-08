# Design Tokens

This document defines the design system tokens for the Dashboard application. All styling decisions are driven by these tokens for consistency and maintainability.

## Color Palette

### Primary Colors

- **Primary**: `#3b82f6` (Blue 500) - Primary actions, links, focus states
- **Primary Dark**: `#1e40af` (Blue 800) - Primary hover states
- **Primary Light**: `#dbeafe` (Blue 100) - Primary backgrounds

### Status Colors

- **Success**: `#10b981` (Green 600) - Completed, successful actions
- **Success Light**: `#d1fae5` (Green 100) - Success backgrounds
- **Warning**: `#f59e0b` (Amber 500) - Pending, caution states
- **Warning Light**: `#fef3c7` (Amber 100) - Warning backgrounds
- **Error**: `#ef4444` (Red 500) - Failed, error states
- **Error Light**: `#fee2e2` (Red 100) - Error backgrounds

### Neutral Colors (Grayscale)

- **Gray 50**: `#f9fafb` - Lightest background (cards, sections)
- **Gray 100**: `#f3f4f6` - Light background (hover, alternating)
- **Gray 200**: `#e5e7eb` - Borders, dividers
- **Gray 500**: `#6b7280` - Secondary text
- **Gray 600**: `#4b5563` - Primary text on light backgrounds
- **Gray 900**: `#111827` - Text, headings (darkest)

### Dark Mode (Future)

- Dark background: `#1f2937` (Gray 800)
- Dark text: `#f3f4f6` (Gray 100)
- Dark hover: `#374151` (Gray 700)

## Spacing Scale

All spacing uses `rem` units based on 4px base unit. Configured in `tailwind.config.mjs`.

| Name | Value         | CSS Class |
| ---- | ------------- | --------- |
| xs   | 0.25rem (4px) | `p-1`     |
| sm   | 0.5rem (8px)  | `p-2`     |
| md   | 1rem (16px)   | `p-4`     |
| lg   | 1.5rem (24px) | `p-6`     |
| xl   | 2rem (32px)   | `p-8`     |
| 2xl  | 3rem (48px)   | `p-12`    |
| 3xl  | 4rem (64px)   | `p-16`    |

Usage: `p-4` (padding), `m-6` (margin), `gap-4` (gap), `mb-8` (margin-bottom)

## Typography

### Font Family

- **Base**: System UI font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...`)
- **Monospace**: `ui-monospace, SFMono-Regular, 'SF Mono'...` (for code, values)

### Font Sizes & Weights

| Usage            | Size            | Weight     | Line Height | CSS Classes               |
| ---------------- | --------------- | ---------- | ----------- | ------------------------- |
| Display/Hero     | 2.25rem (36px)  | 700 Bold   | 1.2         | `text-4xl font-bold`      |
| Section Heading  | 1.875rem (30px) | 700 Bold   | 1.25        | `text-3xl font-bold`      |
| Subsection       | 1.5rem (24px)   | 600 Semi   | 1.35        | `text-2xl font-semibold`  |
| Label/Card Title | 1rem (16px)     | 600 Semi   | 1.5         | `text-base font-semibold` |
| Body/Paragraph   | 0.875rem (14px) | 400 Normal | 1.6         | `text-sm`                 |
| Small/Caption    | 0.75rem (12px)  | 400 Normal | 1.5         | `text-xs`                 |
| Code             | 0.875rem (14px) | 400 Mono   | 1.5         | `font-mono text-sm`       |

Usage: `<h1 class="text-4xl font-bold">Heading</h1>`

## Shadows (Elevation)

Used for depth and layering. Defined in `tailwind.config.mjs`.

| Level  | CSS Class     | Use Case                            |
| ------ | ------------- | ----------------------------------- |
| None   | `shadow-none` | Flat, no elevation                  |
| Small  | `shadow-sm`   | Subtle elevation (borders, lines)   |
| Medium | `shadow-md`   | Cards, modals at rest               |
| Large  | `shadow-lg`   | Cards on hover, dropdowns, popovers |
| XL     | `shadow-xl`   | Modals, floating panels             |

Examples:

- MetricCard: `shadow-sm` at rest → `shadow-lg` on hover
- Table rows: `shadow-none` (bordered instead)
- Modals: `shadow-xl` (fixed elevation)

## Border Radius

Consistent rounding for UI elements.

| Name   | Value          | CSS Class      | Use Case                          |
| ------ | -------------- | -------------- | --------------------------------- |
| None   | 0px            | `rounded-none` | Square, no rounding               |
| Small  | 0.375rem (6px) | `rounded-sm`   | Small buttons, badges             |
| Medium | 0.5rem (8px)   | `rounded-md`   | Inputs, buttons, cards            |
| Large  | 0.75rem (12px) | `rounded-lg`   | Cards, modals, containers         |
| Full   | 9999px         | `rounded-full` | Avatars, pills, circular elements |

## Breakpoints (Responsive Design)

Mobile-first breakpoints for responsive design. Defined in `tailwind.config.mjs`.

| Name    | Width  | CSS Prefix | Use Case         |
| ------- | ------ | ---------- | ---------------- |
| Default | 0px    | (none)     | Mobile (≤375px)  |
| Small   | 640px  | `sm:`      | Small tablets    |
| Medium  | 768px  | `md:`      | Tablets          |
| Large   | 1024px | `lg:`      | Laptops          |
| XL      | 1280px | `xl:`      | Desktop monitors |
| 2XL     | 1536px | `2xl:`     | Large displays   |

### Responsive Grid Examples

**MetricsGrid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

- Mobile (375px): 1 column (100% width)
- Tablet (768px+): 2 columns (50% each)
- Desktop (1024px+): 4 columns (25% each)

**DashboardPage Layout**: `max-w-screen px-4 md:px-8 lg:max-w-7xl mx-auto`

- Mobile: Full width with `p-4` padding
- Tablet: `px-8` for better spacing
- Desktop: Centered with `max-w-7xl` constraint

## Component-Specific Tokens

### MetricCard

- **Background**: `bg-white`
- **Border**: `border border-gray-100`
- **Shadow**: `shadow-sm` → `shadow-lg` (hover)
- **Hover**: `hover:shadow-lg hover:scale-105 transition-transform`
- **Padding**: `p-6`
- **Border radius**: `rounded-lg`

### Status Badge

- **Padding**: `px-3 py-1.5`
- **Border radius**: `rounded-lg`
- **Font**: `text-sm font-medium`
- **Colors**: Dynamic per status (Primary colors)

### Button (All Types)

- **Padding**: `px-4 py-2` (standard)
- **Border radius**: `rounded-lg`
- **Font**: `text-sm font-medium`
- **Border**: `border border-gray-300`
- **Hover**: `hover:bg-gray-50`
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`
- **Focus**: Handled by `focus-ring.css` (2px outline, 4.5:1 contrast)
- **Transition**: `transition-colors`

### Table

- **Header background**: `bg-gray-50`
- **Header border**: `border-b border-gray-200`
- **Row hover**: `hover:bg-gray-50`
- **Cell padding**: `px-6 py-4`
- **Text color**: `text-gray-900` (header), `text-gray-600` (body)
- **Border**: `border-t border-gray-200`, `divide-x divide-gray-200`
- **Responsive**: At 768px and below, switch to card layout or horizontal scroll

### Empty State

- **Container**: Centered flex column with `flex flex-col items-center justify-center py-12`
- **Icon size**: `text-5xl mb-4`
- **Text color**: `text-gray-500` (secondary), `text-gray-900` (heading)
- **Font size**: `text-lg font-medium` (heading)

### Loading State (Skeleton)

- **Animation**: `animate-pulse`
- **Background**: `bg-gray-200`
- **Border radius**: `rounded`
- **Height**: Varies (`h-12`, `h-8`, etc.)

### Error State Banner

- **Background**: `bg-red-50`
- **Border**: `border border-red-200`
- **Text color**: `text-red-800` (heading), `text-red-700` (body)
- **Padding**: `p-4`
- **Border radius**: `rounded-lg`

## Animations & Transitions

### Standard Transitions

- **Duration**: 200ms (general UI), 300ms (page transitions)
- **Easing**: `ease-in-out` (standard), `ease-out` (entrance)
- **Properties**: `transition-all duration-200`

### Slide-In Animation

- **Duration**: 300ms
- **Easing**: `ease-out`
- **Effect**: Fade in + slide down 10px
- **Defined in**: `tailwind.config.mjs` as `animate-slide-in`

### Shimmer (Loading)

- **Duration**: 2s infinite
- **Effect**: Smooth background shift left to right
- **Use**: Loading skeletons
- **Defined in**: `tailwind.config.mjs` as `animate-shimmer`

### Hover Animations

- **Card lift**: `hover:shadow-lg hover:scale-105 transition-transform`
- **Button hover**: `hover:bg-gray-50 transition-colors`
- **Link underline**: Optional `hover:underline`

## Accessibility

### Color Contrast (WCAG AA)

- **Text on primary**: 4.5:1 minimum
- **UI components**: 3:1 minimum for non-text
- **Large text**: 3:1 (18pt+ or 14pt bold+)

### Focus Indicators

- **Outline**: 2px solid blue-600
- **Outline offset**: 2px
- **Box shadow**: Additional 1px white ring for contrast
- **Defined in**: `focus-ring.css`

### Dark Mode Support (Optional)

- Focus ring color adjusts: blue-400 (blue-600 light mode)
- Backgrounds invert gracefully
- Text contrast maintained (5.9:1 on dark background)

### Reduced Motion

- Animations disabled for `prefers-reduced-motion: reduce`
- Transitions become instant
- Defined in: `focus-ring.css`, component-level styles

## Implementation Checklist

- [x] Tailwind configured with custom colors
- [x] Spacing scale defined (rem units)
- [x] Typography system documented
- [x] Shadows (elevation) defined
- [x] Border radius scale consistent
- [x] Responsive breakpoints documented
- [x] Component tokens defined
- [x] Accessibility requirements specified
- [x] Animations/transitions defined
- [ ] CSS variables (tokens.css) created (optional)
- [ ] All components use design tokens
- [ ] Lighthouse audit: Design ≥85, Accessibility = 100
- [ ] Responsive tested: 375px, 768px, 1440px
- [ ] Dark mode fully implemented (optional for Phase 7)

## References

- **Tailwind Docs**: https://tailwindcss.com/docs
- **WCAG 2.1 AA**: https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Material Design Color**: https://m3.material.io/styles/color
