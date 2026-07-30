import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, QueryList, ViewChildren, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  index: number;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Tab list -->
      <div
        role="tablist"
        class="flex border-b border-gray-200 gap-2"
        (keydown)="onKeydown($event)"
      >
        <button
          *ngFor="let tab of tabs; trackBy: trackByTabId"
          #tabButtons
          [id]="'tab-' + tab.id"
          type="button"
          role="tab"
          [attr.aria-selected]="isActive(tab.index)"
          [attr.aria-controls]="'panel-' + tab.id"
          [attr.tabindex]="isActive(tab.index) ? 0 : -1"
          (click)="selectTab(tab.index)"
          class="px-4 py-2 font-medium text-sm transition-all duration-200"
          [class.text-blue-600]="isActive(tab.index)"
          [class.text-gray-600]="!isActive(tab.index)"
          [class.border-b-2]="isActive(tab.index)"
          [class.border-blue-600]="isActive(tab.index)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div
        *ngFor="let tab of tabs; trackBy: trackByTabId"
        [id]="'panel-' + tab.id"
        role="tabpanel"
        [attr.aria-labelledby]="'tab-' + tab.id"
        class="fade-in"
      >
        <ng-content [select]="'[tab-' + tab.id + ']'"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    [role="tab"] {
      cursor: pointer;
      outline: none;
    }

    [role="tab"]:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    .fade-in {
      animation: fadeIn 300ms ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterViewInit {
  @Input() tabs: Tab[] = [];
  @Input() activeIndex = 0;

  @Output() activeIndexChange = new EventEmitter<number>();

  @ViewChildren('tabButtons') tabButtons!: QueryList<ElementRef>;

  ngAfterViewInit(): void {
    this.focusActiveTab();
  }

  isActive(index: number): boolean {
    return this.activeIndex === index;
  }

  selectTab(index: number): void {
    this.activeIndex = index;
    this.activeIndexChange.emit(index);
    setTimeout(() => this.focusActiveTab());
  }

  onKeydown(event: KeyboardEvent): void {
    const { key } = event;
    const tabCount = this.tabs.length;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (this.activeIndex + 1) % tabCount;
      this.selectTab(nextIndex);
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (this.activeIndex - 1 + tabCount) % tabCount;
      this.selectTab(prevIndex);
    } else if (key === 'Home') {
      event.preventDefault();
      this.selectTab(0);
    } else if (key === 'End') {
      event.preventDefault();
      this.selectTab(tabCount - 1);
    }
  }

  private focusActiveTab(): void {
    const activeButton = this.tabButtons?.toArray()[this.activeIndex];
    if (activeButton) {
      activeButton.nativeElement.focus();
    }
  }

  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }
}
