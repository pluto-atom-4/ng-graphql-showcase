import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * PaginationControlsComponent - Reusable pagination controls with Prev/Next buttons.
 *
 * @selector app-pagination-controls
 *
 * @input currentPage - Currently active page (1-indexed). Default: 1
 * @input pageSize - Items per page. Default: 10
 * @input totalItems - Total number of items. Default: 0
 *
 * @output pageChange - Emitted when previous/next button clicked. Value: new page number
 *
 * @example
 * // Basic usage
 * <app-pagination-controls
 *   [currentPage]="currentPage"
 *   [pageSize]="pageSize"
 *   [totalItems]="totalItems"
 *   (pageChange)="onPageChange($event)"
 * ></app-pagination-controls>
 *
 * // With template handling page changes
 * <app-pagination-controls
 *   [currentPage]="1"
 *   [pageSize]="25"
 *   [totalItems]="500"
 *   (pageChange)="currentPage = $event"
 * ></app-pagination-controls>
 *
 * @a11y
 * - Keyboard navigation: Tab through buttons, Enter/Space to activate
 * - Buttons disabled when at first/last page
 * - aria-label on Previous/Next buttons
 * - aria-disabled attribute reflects button state
 * - Focus-visible styles for keyboard navigation
 * - Page information text is clear and descriptive
 */
@Component({
  selector: 'app-pagination-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <!-- Page information -->
      <div class="text-xs md:text-sm text-gray-600 order-2 md:order-1 w-full md:w-auto text-center md:text-left">
        <span class="block md:inline">Page {{ currentPage }} of {{ totalPages }}</span>
        <span class="block md:inline md:ml-4">
          Showing {{ startItem }} - {{ endItem }} of {{ totalItems }}
        </span>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-4 order-1 md:order-2 w-full md:w-auto">
        <!-- Previous button -->
        <button
          type="button"
          (click)="goToPreviousPage()"
          [disabled]="isFirstPage"
          [attr.aria-label]="'Go to previous page, currently on page ' + currentPage"
          [attr.aria-disabled]="isFirstPage"
          class="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors duration-150"
        >
          <span class="hidden sm:inline">← Previous</span>
          <span class="sm:hidden">← Prev</span>
        </button>

        <!-- Next button -->
        <button
          type="button"
          (click)="goToNextPage()"
          [disabled]="isLastPage"
          [attr.aria-label]="'Go to next page, currently on page ' + currentPage"
          [attr.aria-disabled]="isLastPage"
          class="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors duration-150"
        >
          <span class="hidden sm:inline">Next →</span>
          <span class="sm:hidden">Next</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    button:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    button {
      transition: all 200ms ease-in-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationControlsComponent implements OnInit {
  @Input() set currentPage(value: number) {
    this._currentPage = value;
    this.cdr.markForCheck();
  }
  get currentPage(): number {
    return this._currentPage;
  }

  @Input() set pageSize(value: number) {
    this._pageSize = value;
    this.cdr.markForCheck();
  }
  get pageSize(): number {
    return this._pageSize;
  }

  @Input() set totalItems(value: number) {
    this._totalItems = value;
    this.cdr.markForCheck();
  }
  get totalItems(): number {
    return this._totalItems;
  }

  private _currentPage = 1;
  private _pageSize = 10;
  private _totalItems = 0;

  @Output() pageChange = new EventEmitter<number>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cdr.markForCheck();
  }

  get totalPages(): number {
    if (this.totalItems === 0) return 1;
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get isFirstPage(): boolean {
    return this.currentPage <= 1;
  }

  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages;
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.totalItems);
  }

  goToPreviousPage(): void {
    if (!this.isFirstPage) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (!this.isLastPage) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}
