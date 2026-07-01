import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'success' | 'warning' | 'error' | 'info';

/**
 * Reusable Badge component using daisyUI
 *
 * Example:
 * <app-badge label="Active" variant="success" />
 * <app-badge label="Pending" variant="warning" />
 * <app-badge label="Error" variant="error" />
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
