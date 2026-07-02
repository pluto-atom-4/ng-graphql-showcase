import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'success' | 'warning' | 'error' | 'info';

/**
 * Status badge component for displaying labels with semantic colors.
 *
 * Displays short text (labels, status indicators, tags) with daisyUI
 * semantic coloring. Commonly used with GraphQL enums (e.g., BuildStatus).
 *
 * **Features**:
 * - OnPush change detection
 * - 8 semantic variants (success, warning, error, info, primary, secondary, accent, ghost)
 * - Compact inline display
 * - Works with generated GraphQL enums
 *
 * **Inputs**:
 * - label: string — Badge text (default: "Badge")
 * - variant: BadgeVariant — Color scheme (default: "primary")
 *
 * **Design System**: {@link docs/FRONTEND-DESIGN-SYSTEM.md#badges}
 *
 * **Example**:
 * ```typescript
 * // With GraphQL BuildStatus enum
 * <app-badge
 *   [label]="build.status | uppercase"
 *   [variant]="statusToBadgeVariant(build.status)"
 * />
 *
 * // Quick labels
 * <app-badge label="Active" variant="success" />
 * <app-badge label="Pending" variant="warning" />
 * <app-badge label="Failed" variant="error" />
 * ```
 *
 * **Variants**: success | warning | error | info | primary | secondary | accent | ghost
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [ngClass]="getClasses()">
      {{ label }}
    </span>
  `,
})
export class BadgeComponent {
  @Input() label = 'Badge';
  @Input() variant: BadgeVariant = 'primary';

  getClasses(): string {
    const base = 'badge';
    const variantClass = `badge-${this.variant}`;
    return `${base} ${variantClass}`;
  }
}
