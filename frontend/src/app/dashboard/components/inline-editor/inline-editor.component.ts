import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

export interface InlineEditorConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: (value: string) => string | null;
}

/**
 * InlineEditorComponent - Inline text editor with validation and edit/view toggle.
 *
 * @selector app-inline-editor
 *
 * @input value - Initial text value to display and edit. Default: ''
 * @input label - Field label for accessibility and error messages. Default: 'Field'
 * @input config - InlineEditorConfig with validation rules (required, minLength, maxLength, pattern, customValidator). Default: {}
 *
 * @output save - Emitted with validated edited value on Save button click
 * @output cancel - Emitted when Cancel or Escape key pressed
 *
 * @example
 * // Basic inline editor
 * <app-inline-editor
 *   [value]="buildName"
 *   label="Build Name"
 *   [config]="{ required: true, minLength: 3, maxLength: 50 }"
 *   (save)="onNameSave($event)"
 *   (cancel)="onCancel()"
 * ></app-inline-editor>
 *
 * // With custom validator
 * <app-inline-editor
 *   [value]="email"
 *   label="Email"
 *   [config]="{ required: true, customValidator: validateEmail }"
 *   (save)="onEmailSave($event)"
 * ></app-inline-editor>
 *
 * @a11y
 * - Toggles between view and edit mode
 * - View mode: Read-only display with Edit button
 * - Edit mode: Input field with Save/Cancel buttons
 * - aria-label on Edit button and input field
 * - aria-describedby links input to error message when validation fails
 * - role="alert" on error message for screen reader announcement
 * - Escape key cancels editing
 * - Enter/Blur submits (with validation)
 * - Error message with role="alert" for assistive technology
 */
@Component({
  selector: 'app-inline-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- View Mode -->
    <div *ngIf="!isEditing" class="flex items-center gap-2">
      <span class="text-gray-900">{{ value || '(empty)' }}</span>
      <button
        type="button"
        (click)="startEdit()"
        class="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none focus:underline"
        [attr.aria-label]="'Edit ' + label"
      >
        Edit
      </button>
    </div>

    <!-- Edit Mode -->
    <form *ngIf="isEditing" (ngSubmit)="onSave()" #editForm="ngForm" class="space-y-2">
      <div class="flex flex-col gap-2">
        <input
          type="text"
          [(ngModel)]="editValue"
          [ngModelOptions]="{ updateOn: 'blur' }"
          name="editField"
          #editField
          (keydown.escape)="onCancel()"
          (blur)="validateField()"
          class="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          [class.border-red-500]="hasError"
          [attr.aria-label]="'Edit ' + label"
          [attr.aria-describedby]="hasError ? 'error-' + label : null"
          [required]="config?.required"
          [minlength]="config?.minLength"
          [maxlength]="config?.maxLength"
          [pattern]="config?.pattern"
          autocomplete="off"
        />

        <!-- Error Message -->
        <div
          *ngIf="hasError"
          [id]="'error-' + label"
          class="text-red-600 text-sm font-medium"
          role="alert"
        >
          {{ errorMessage }}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <button
          type="submit"
          [disabled]="hasError"
          class="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Save changes"
        >
          Save
        </button>
        <button
          type="button"
          (click)="onCancel()"
          class="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }

    input {
      transition: all 200ms ease-in-out;
    }

    input:focus {
      border-color: #3b82f6;
    }

    button {
      transition: all 200ms ease-in-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InlineEditorComponent implements OnInit {
  @Input() value: string = '';
  @Input() label: string = 'Field';
  @Input() config: InlineEditorConfig = {};

  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  isEditing = false;
  editValue: string = '';
  errorMessage: string = '';
  hasError = false;

  ngOnInit(): void {
    this.editValue = this.value;
  }

  startEdit(): void {
    this.isEditing = true;
    this.editValue = this.value;
    this.errorMessage = '';
    this.hasError = false;

    // Focus the input field after view update
    setTimeout(() => {
      const input = document.querySelector('input[name="editField"]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }

  onSave(): void {
    if (this.validateField()) {
      this.save.emit(this.editValue);
      this.isEditing = false;
    }
  }

  onCancel(): void {
    this.isEditing = false;
    this.editValue = this.value;
    this.errorMessage = '';
    this.hasError = false;
    this.cancel.emit();
  }

  validateField(): boolean {
    this.errorMessage = '';
    this.hasError = false;

    const value = this.editValue?.trim() || '';

    // Required validation
    if (this.config.required && !value) {
      this.errorMessage = `${this.label} is required`;
      this.hasError = true;
      return false;
    }

    // MinLength validation
    if (this.config.minLength && value.length < this.config.minLength) {
      this.errorMessage = `${this.label} must be at least ${this.config.minLength} characters`;
      this.hasError = true;
      return false;
    }

    // MaxLength validation
    if (this.config.maxLength && value.length > this.config.maxLength) {
      this.errorMessage = `${this.label} must not exceed ${this.config.maxLength} characters`;
      this.hasError = true;
      return false;
    }

    // Pattern validation
    if (this.config.pattern) {
      const regex = new RegExp(this.config.pattern);
      if (!regex.test(value)) {
        this.errorMessage = `${this.label} format is invalid`;
        this.hasError = true;
        return false;
      }
    }

    // Custom validator
    if (this.config.customValidator) {
      const error = this.config.customValidator(value);
      if (error) {
        this.errorMessage = error;
        this.hasError = true;
        return false;
      }
    }

    return true;
  }

  @HostListener('keydown.escape')
  onEscapeKey(): void {
    if (this.isEditing) {
      this.onCancel();
    }
  }
}
