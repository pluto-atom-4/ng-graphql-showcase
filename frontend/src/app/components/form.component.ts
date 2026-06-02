import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="onFormSubmit()" class="space-y-4">
      <ng-content></ng-content>
      <div class="form-control pt-4">
        <button
          type="submit"
          [disabled]="!formGroup.valid"
          class="btn btn-primary"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  `,
})
export class FormComponent {
  @Input() formGroup!: FormGroup;
  @Input() submitLabel = 'Submit';
  @Output() onSubmit = new EventEmitter<any>();

  onFormSubmit(): void {
    if (this.formGroup.valid) {
      this.onSubmit.emit(this.formGroup.value);
    }
  }
}
