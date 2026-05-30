import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Reusable Button component using daisyUI
 *
 * Example:
 * <app-button
 *   label="Click Me"
 *   variant="primary"
 *   size="md"
 *   [loading]="isLoading"
 *   (click)="handleClick()"
 * />
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.disabled]="isDisabled ? true : null"
      [ngClass]="getClasses()"
      (click)="onClick()"
    >
      <span *ngIf="!loading">{{ label }}</span>
      <span *ngIf="loading" class="loading loading-spinner loading-sm"></span>
    </button>
  `,
})
export class ButtonComponent {
  @Input() label = 'Button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<void>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  getClasses(): string {
    const base = 'btn font-semibold transition-all';
    const variantClass = `btn-${this.variant}`;
    const sizeClass = this.size === 'md' ? '' : `btn-${this.size}`;

    return [base, variantClass, sizeClass].filter(Boolean).join(' ');
  }

  onClickHandler(): void {
    if (!this.isDisabled) {
      this.onClick.emit();
    }
  }
}
