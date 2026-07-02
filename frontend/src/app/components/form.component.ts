import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

/**
 * Reactive form wrapper component using daisyUI styling.
 *
 * Wraps Angular Reactive Forms with daisyUI semantic styling and
 * consistent button/validation behavior. Provides ng-content slot
 * for flexible form field composition.
 *
 * **Features**:
 * - OnPush change detection
 * - Signals-based inputs (formGroup, submitLabel)
 * - Automatic disable on invalid state
 * - Type-safe reactive forms
 * - daisyUI form layout classes
 *
 * **Signals**:
 * - @input formGroup: FormGroup (required) — The reactive form group
 * - @input submitLabel: string (default: "Submit") — Button text
 * - @output formSubmit: Emits form.value on valid submit
 *
 * **Design System**: {@link docs/FRONTEND-DESIGN-SYSTEM.md#forms}
 *
 * **Example**:
 * ```typescript
 * myForm = new FormGroup({
 *   name: new FormControl('', Validators.required),
 *   email: new FormControl('', Validators.email)
 * });
 *
 * <app-form [formGroup]="myForm" submitLabel="Register" (formSubmit)="onSubmit($event)">
 *   <label class="form-factory">
 *     <span class="label-text">Name *</span>
 *     <input type="text" formControlName="name" class="input input-bordered" />
 *   </label>
 *   <label class="form-factory">
 *     <span class="label-text">Email *</span>
 *     <input type="email" formControlName="email" class="input input-bordered" />
 *   </label>
 * </app-form>
 * ```
 *
 * **Note**: Event name is "formSubmit" to avoid colliding with native HTML submit event.
 */
@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="formGroup()" (ngSubmit)="onFormSubmit()" class="space-y-4">
      <ng-content></ng-content>
      <div class="form-control pt-4">
        <button
          type="submit"
          [disabled]="!formGroup().valid"
          class="btn btn-primary"
        >
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
})
export class FormComponent {
  formGroup = input.required<FormGroup>();
  submitLabel = input<string>('Submit');

  // Change "submit" to "formSubmit" to avoid colliding with native HTML events
  formSubmit = output<unknown>();

  onFormSubmit(): void {
    const currentForm = this.formGroup();
    if (currentForm.valid) {
      this.formSubmit.emit(currentForm.value);
    }
  }
}
