import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * PaginationComponent - Pagination controls with page size selector and navigation.
 *
 * @selector app-pagination
 *
 * @input total - Total number of items. Default: 0
 * @input pageSize - Items per page. Default: 10
 * @input currentPage - Currently active page (1-indexed). Default: 1
 * @input pageSizeOptions - Available page size options. Default: [10, 25, 50]
 *
 * @output pageChange - Emitted when previous/next button clicked. Value: new page number
 * @output pageSizeChange - Emitted when page size selector changes. Value: new page size
 *
 * @example
 * // Basic usage
 * <app-pagination
 *   [total]="100"
 *   [pageSize]="10"
 *   [currentPage]="currentPage"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)"
 * ></app-pagination>
 *
 * // Custom page size options
 * <app-pagination
 *   [total]="500"
 *   [pageSize]="pageSize"
 *   [currentPage]="currentPage"
 *   [pageSizeOptions]="[15, 30, 60]"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)"
 * ></app-pagination>
 *
 * @a11y
 * - Keyboard navigation: Tab through select/buttons, Arrow keys in select
 * - Buttons disabled when at first/last page (aria-disabled inferred)
 * - aria-label on Previous/Next buttons
 * - Associated label on page size select
 * - Focus-visible styles for keyboard navigation
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between gap-4">
      <!-- Info text -->
      <span class="text-sm text-gray-600">
        Showing {{ startItem }}-{{ endItem }} of {{ total }}
      </span>

      <!-- Controls -->
      <div class="flex items-center gap-3">
        <!-- Page size selector -->
        <div class="flex items-center gap-2">
          <label for="page-size" class="text-sm text-gray-600">Per page:</label>
          <select
            id="page-size"
            [value]="pageSize"
            (change)="onPageSizeChange($event)"
            class="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option *ngFor="let size of pageSizeOptions; trackBy: trackByPageSize" [value]="size">
              {{ size }}
            </option>
          </select>
        </div>

        <!-- Previous button -->
        <button
          type="button"
          [disabled]="isFirstPage"
          (click)="onPrevious()"
          class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        <!-- Page info -->
        <span class="text-sm text-gray-600">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <!-- Next button -->
        <button
          type="button"
          [disabled]="isLastPage"
          (click)="onNext()"
          class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    select {
      transition: all 200ms ease-in-out;
    }

    select:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    button {
      transition: all 200ms ease-in-out;
    }

    button:hover:not(:disabled) {
      background-color: #f3f4f6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get isFirstPage(): boolean {
    return this.currentPage <= 1;
  }

  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages;
  }

  get startItem(): number {
    if (this.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.total);
  }

  onPrevious(): void {
    if (!this.isFirstPage) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNext(): void {
    if (!this.isLastPage) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    if (newSize !== this.pageSize) {
      this.pageSizeChange.emit(newSize);
    }
  }

  trackByPageSize(index: number, size: number): number {
    return size;
  }
}
