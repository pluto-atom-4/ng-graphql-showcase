import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';

interface StatusConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
  borderColor: string;
}

/**
 * StatusBadgeComponent - Reusable status badge with icon, color, and text.
 *
 * @selector app-status-badge
 *
 * @input status - Status type: 'PENDING' (gray), 'RUNNING' (blue), 'COMPLETE' (green), 'FAILED' (red). Default: 'PENDING'
 *
 * @example
 * // Pending status (default)
 * <app-status-badge status="PENDING"></app-status-badge>
 *
 * // Running status
 * <app-status-badge status="RUNNING"></app-status-badge>
 *
 * // Completed status
 * <app-status-badge status="COMPLETE"></app-status-badge>
 *
 * // Failed status
 * <app-status-badge status="FAILED"></app-status-badge>
 *
 * @a11y
 * - role="status" for live region announcements
 * - aria-label with status description for screen readers
 * - Color contrast: 4.5:1+ WCAG AA compliant
 * - Icon + text redundancy: not color-dependent
 * - Semantic badge styling
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
      [style.backgroundColor]="statusConfig.backgroundColor"
      [style.color]="statusConfig.textColor"
      [style.borderColor]="statusConfig.borderColor"
      [style.border]="'1px solid ' + statusConfig.borderColor"
      [attr.aria-label]="ariaLabel"
      role="status"
    >
      <span class="text-base" role="presentation">{{ statusConfig.icon }}</span>
      <span>{{ statusConfig.label }}</span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent implements OnInit {
  @Input() set status(value: StatusType) {
    this._status = value;
    this.cdr.markForCheck();
  }
  get status(): StatusType {
    return this._status;
  }

  private _status: StatusType = 'PENDING';

  constructor(private cdr: ChangeDetectorRef) {}

  private readonly statusMap: Record<StatusType, StatusConfig> = {
    PENDING: {
      label: 'Pending',
      backgroundColor: '#fef3c7',
      textColor: '#92400e',
      icon: '⏳',
      borderColor: '#fbbf24',
    },
    RUNNING: {
      label: 'Running',
      backgroundColor: '#dbeafe',
      textColor: '#1e40af',
      icon: '⟳',
      borderColor: '#60a5fa',
    },
    COMPLETE: {
      label: 'Completed',
      backgroundColor: '#dcfce7',
      textColor: '#166534',
      icon: '✓',
      borderColor: '#86efac',
    },
    FAILED: {
      label: 'Failed',
      backgroundColor: '#fee2e2',
      textColor: '#991b1b',
      icon: '✕',
      borderColor: '#fca5a5',
    },
  };

  ngOnInit(): void {
    this.cdr.markForCheck();
  }

  get statusConfig(): StatusConfig {
    return this.statusMap[this._status];
  }

  get ariaLabel(): string {
    return `Status: ${this.statusConfig.label}`;
  }
}
