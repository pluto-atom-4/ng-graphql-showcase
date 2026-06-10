import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

/**
 * Reusable Form component using daisyUI
 *
 * Example:
 * <app-form
 *   [formGroup]="myForm"
 *   submitLabel="Save"
 *   (onSubmit)="handleSubmit($event)"
 * >
 *   <label class="form-factory">
 *     <span class="label-text">Name</span>
 *     <input type="text" formControlName="name" class="input input-bordered" />
 *   </label>
 * </app-form>
 */
@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule],
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
