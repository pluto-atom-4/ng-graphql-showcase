import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'success' | 'warning' | 'error' | 'info';

/**
 * Status badge component for displaying labels with semantic colors.
 *
 * Displays short text (labels, status indicators, tags) with Tailwind
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
 * **Design System**: {@link frontend/README.md#badges}
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
    const base = 'badge-base';
    const variantClass = this.getVariantStyles(this.variant);
    return `${base} ${variantClass}`;
  }

  private getVariantStyles(variant: BadgeVariant): string {
    const styles: Record<BadgeVariant, string> = {
      'success': 'bg-green-100 text-green-800',
      'error': 'bg-red-100 text-red-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'info': 'bg-blue-100 text-blue-800',
      'primary': 'bg-blue-100 text-blue-800',
      'secondary': 'bg-gray-100 text-gray-800',
      'accent': 'bg-purple-100 text-purple-800',
      'ghost': 'bg-gray-50 text-gray-900',
    };
    return styles[variant] || 'bg-gray-100 text-gray-800';
  }
}
