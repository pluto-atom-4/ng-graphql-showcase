import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Build } from '../../services/build.service';
import { BadgeComponent } from '../../shared/badge/badge.component';

/**
 * BuildDetailsModalComponent - Modal form for viewing and editing build properties.
 *
 * @selector app-build-details-modal
 *
 * @input build - Build object to display and edit
 *
 * @output save - Emitted with updated Build object when Save button clicked
 * @output cancel - Emitted when Cancel button clicked
 *
 * @example
 * // Usage within ModalContainerComponent
 * <app-modal-container
 *   [config]="{ size: 'md', focusTrap: true, restoreFocus: true, ariaLabelledBy: 'modal-title', ariaDescribedBy: 'modal-description' }"
 *   (close)="isModalOpen = false"
 * >
 *   <app-build-details-modal
 *     [build]="selectedBuild"
 *     (save)="onBuildSave($event)"
 *     (cancel)="isModalOpen = false"
 *   ></app-build-details-modal>
 * </app-modal-container>
 *
 * @a11y
 * - Semantic form elements with associated labels
 * - id="modal-title" on h2 for aria-labelledby association
 * - id="modal-description" on p for aria-describedby association
 * - input with aria-label for screen readers
 * - Buttons with aria-label for clarity
 * - Focus order: Name input → Status → Save button → Cancel button
 * - Focus-visible outlines on interactive elements
 */
@Component({
  selector: 'app-build-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h2 id="modal-title" class="text-2xl font-bold text-gray-900 mb-2">
          Build Details
        </h2>
        <p id="modal-description" class="text-sm text-gray-600">
          View and edit build information
        </p>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <!-- Build ID (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Build ID
          </label>
          <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-600">
            {{ build.id }}
          </div>
        </div>

        <!-- Build Name -->
        <div>
          <label for="build-name" class="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="build-name"
            type="text"
            [(ngModel)]="editedBuild.name"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            [attr.aria-label]="'Build name'"
          />
        </div>

        <!-- Build Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <app-badge [status]="build.status"></app-badge>
        </div>

        <!-- Created At (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Created
          </label>
          <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-600">
            {{ build.createdAt | date: 'medium' }}
          </div>
        </div>

        <!-- Updated At (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Updated
          </label>
          <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-600">
            {{ build.updatedAt | date: 'medium' }}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 flex justify-end gap-3">
        <button
          type="button"
          (click)="onCancel()"
          class="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="onSave()"
          class="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Save changes"
        >
          Save
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    input {
      transition: all 200ms ease-in-out;
    }

    input:focus {
      border-color: #3b82f6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildDetailsModalComponent {
  @Input() build!: Build;
  @Output() save = new EventEmitter<Build>();
  @Output() cancel = new EventEmitter<void>();

  editedBuild!: Build;

  ngOnInit(): void {
    // Create a copy of the build for editing
    this.editedBuild = { ...this.build };
  }

  onSave(): void {
    this.save.emit(this.editedBuild);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
