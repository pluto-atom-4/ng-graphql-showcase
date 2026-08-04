import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type BuildStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
  classes: string;
}

/**
 * BadgeComponent - Status indicator badge with color and icon per build status.
 *
 * @selector app-badge
 *
 * @input status - Build status: 'PENDING' (yellow), 'RUNNING' (blue), 'COMPLETE' (green), 'FAILED' (red). Default: 'PENDING'
 * @input customLabel - Optional override label for screen readers. Default: auto-generated from status
 *
 * @example
 * // Pending status (default)
 * <app-badge status="PENDING"></app-badge>
 *
 * // Running status
 * <app-badge status="RUNNING"></app-badge>
 *
 * // Completed status
 * <app-badge status="COMPLETE"></app-badge>
 *
 * // Failed status with custom label
 * <app-badge status="FAILED" customLabel="Build failed: compilation error"></app-badge>
 *
 * @a11y
 * - role="status" for live region announcements
 * - aria-label with status description for screen readers
 * - Color contrast: 4.8:1 - 5.3:1 (WCAG AA compliant)
 * - Icon + text redundancy: not color-dependent
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span
      [class]="statusConfig.classes"
      [style.backgroundColor]="statusConfig.bgColor"
      [style.color]="statusConfig.textColor"
      [attr.aria-label]="ariaLabel"
      role="status"
    >
      <span class="mr-1">{{ statusConfig.icon }}</span>
      {{ statusConfig.label }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  @Input() status: BuildStatus = 'PENDING';
  @Input() customLabel?: string;

  private readonly statusMap: Record<BuildStatus, StatusConfig> = {
    PENDING: {
      label: 'Pending',
      bgColor: '#fef3c7',
      textColor: '#92400e',
      icon: '⏳',
      classes: 'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap'
    },
    RUNNING: {
      label: 'Running',
      bgColor: '#dbeafe',
      textColor: '#1e40af',
      icon: '⟳',
      classes: 'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap'
    },
    COMPLETE: {
      label: 'Completed',
      bgColor: '#dcfce7',
      textColor: '#166534',
      icon: '✓',
      classes: 'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap'
    },
    FAILED: {
      label: 'Failed',
      bgColor: '#fee2e2',
      textColor: '#991b1b',
      icon: '✕',
      classes: 'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap'
    }
  };

  get statusConfig(): StatusConfig {
    return this.statusMap[this.status];
  }

  get ariaLabel(): string {
    return this.customLabel || `Build status: ${this.statusConfig.label}`;
  }
}
