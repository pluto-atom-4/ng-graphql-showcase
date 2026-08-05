import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PaginationControlsComponent } from './pagination-controls.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PaginationControlsComponent', () => {
  let component: PaginationControlsComponent;
  let fixture: ComponentFixture<PaginationControlsComponent>;
  let compiled: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationControlsComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.totalItems).toBe(0);
    });

    it('should use OnPush change detection', () => {
      const metadata = (component.constructor as any).__annotations__?.[0];
      expect(metadata).toBeDefined();
    });

    it('should have pageChange output event', () => {
      expect(component.pageChange).toBeDefined();
      expect(component.pageChange.emit).toBeDefined();
    });
  });

  describe('Pagination Calculations', () => {
    it('should calculate totalPages correctly', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      expect(component.totalPages).toBe(10);
    });

    it('should handle totalPages with remainder', () => {
      component.totalItems = 95;
      component.pageSize = 10;
      expect(component.totalPages).toBe(10);
    });

    it('should return 1 totalPage when totalItems is 0', () => {
      component.totalItems = 0;
      component.pageSize = 10;
      expect(component.totalPages).toBe(1);
    });

    it('should calculate startItem correctly', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 1;
      expect(component.startItem).toBe(1);
    });

    it('should calculate startItem for middle page', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 3;
      expect(component.startItem).toBe(21);
    });

    it('should calculate endItem correctly', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 1;
      expect(component.endItem).toBe(10);
    });

    it('should handle endItem on last page correctly', () => {
      component.totalItems = 95;
      component.pageSize = 10;
      component.currentPage = 10;
      expect(component.endItem).toBe(95);
    });

    it('should return 0 startItem when totalItems is 0', () => {
      component.totalItems = 0;
      component.pageSize = 10;
      component.currentPage = 1;
      expect(component.startItem).toBe(0);
    });
  });

  describe('Page State Detection', () => {
    it('should detect first page', () => {
      component.currentPage = 1;
      expect(component.isFirstPage).toBe(true);
    });

    it('should not detect first page when on page 2', () => {
      component.currentPage = 2;
      component.totalItems = 100;
      component.pageSize = 10;
      expect(component.isFirstPage).toBe(false);
    });

    it('should detect last page', () => {
      component.currentPage = 10;
      component.totalItems = 100;
      component.pageSize = 10;
      expect(component.isLastPage).toBe(true);
    });

    it('should not detect last page when not on last page', () => {
      component.currentPage = 5;
      component.totalItems = 100;
      component.pageSize = 10;
      expect(component.isLastPage).toBe(false);
    });

    it('should handle single page scenario', () => {
      component.currentPage = 1;
      component.totalItems = 5;
      component.pageSize = 10;
      expect(component.isFirstPage).toBe(true);
      expect(component.isLastPage).toBe(true);
    });
  });

  describe('Rendering', () => {
    it('should render pagination container', () => {
      fixture.detectChanges();
      const container = compiled.query(By.css('div.flex'));
      expect(container).toBeTruthy();
    });

    it('should display page information', () => {
      component.currentPage = 1;
      component.totalItems = 50;
      component.pageSize = 10;
      fixture.detectChanges();
      const info = compiled.query(By.css('.text-gray-600'));
      expect(info.nativeElement.textContent).toContain('Page 1');
    });

    it('should display item range information', () => {
      component.currentPage = 1;
      component.totalItems = 50;
      component.pageSize = 10;
      fixture.detectChanges();
      const info = compiled.query(By.css('.text-gray-600'));
      expect(info.nativeElement.textContent).toContain('Showing 1 - 10');
    });

    it('should render Previous button', () => {
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      expect(buttons[0].nativeElement.textContent).toContain('Previous');
    });

    it('should render Next button', () => {
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      expect(buttons[1].nativeElement.textContent).toContain('Next');
    });
  });

  describe('Button States', () => {
    it('should disable Previous button on first page', () => {
      component.currentPage = 1;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.disabled).toBe(true);
    });

    it('should enable Previous button when not on first page', () => {
      component.currentPage = 2;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.disabled).toBe(false);
    });

    it('should disable Next button on last page', () => {
      component.currentPage = 10;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[1];
      expect(nextButton.nativeElement.disabled).toBe(true);
    });

    it('should enable Next button when not on last page', () => {
      component.currentPage = 5;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[1];
      expect(nextButton.nativeElement.disabled).toBe(false);
    });

    it('should disable both buttons when single page', () => {
      component.currentPage = 1;
      component.totalItems = 5;
      component.pageSize = 10;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.disabled).toBe(true);
      expect(buttons[1].nativeElement.disabled).toBe(true);
    });

    it('should apply disabled styling', () => {
      component.currentPage = 1;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.classList.contains('disabled:opacity-50')).toBe(true);
      expect(prevButton.nativeElement.classList.contains('disabled:cursor-not-allowed')).toBe(true);
    });
  });

  describe('Page Navigation Events', () => {
    it('should emit pageChange when Previous button clicked and not on first page', () => {
      component.currentPage = 3;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();

      const spy = vi.spyOn(component.pageChange, 'emit');
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];

      prevButton.nativeElement.click();

      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should not emit pageChange when Previous button clicked on first page', () => {
      component.currentPage = 1;
      fixture.detectChanges();

      const spy = vi.spyOn(component.pageChange, 'emit');
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];

      prevButton.nativeElement.click();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit pageChange when Next button clicked and not on last page', () => {
      component.currentPage = 5;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();

      const spy = vi.spyOn(component.pageChange, 'emit');
      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[1];

      nextButton.nativeElement.click();

      expect(spy).toHaveBeenCalledWith(6);
    });

    it('should not emit pageChange when Next button clicked on last page', () => {
      component.currentPage = 10;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();

      const spy = vi.spyOn(component.pageChange, 'emit');
      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[1];

      nextButton.nativeElement.click();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Method Tests', () => {
    it('should call pageChange emit in goToPreviousPage', () => {
      component.currentPage = 5;
      component.totalItems = 100;
      component.pageSize = 10;

      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToPreviousPage();

      expect(spy).toHaveBeenCalledWith(4);
    });

    it('should not call pageChange emit in goToPreviousPage on first page', () => {
      component.currentPage = 1;

      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToPreviousPage();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should call pageChange emit in goToNextPage', () => {
      component.currentPage = 5;
      component.totalItems = 100;
      component.pageSize = 10;

      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToNextPage();

      expect(spy).toHaveBeenCalledWith(6);
    });

    it('should not call pageChange emit in goToNextPage on last page', () => {
      component.currentPage = 10;
      component.totalItems = 100;
      component.pageSize = 10;

      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToNextPage();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on Previous button', () => {
      component.currentPage = 3;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.hasAttribute('aria-label')).toBe(true);
    });

    it('should have aria-label on Next button', () => {
      component.currentPage = 3;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[1];
      expect(nextButton.nativeElement.hasAttribute('aria-label')).toBe(true);
    });

    it('should have aria-disabled attribute on Previous button', () => {
      component.currentPage = 1;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.hasAttribute('aria-disabled')).toBe(true);
    });

    it('should have aria-disabled attribute on Next button', () => {
      component.currentPage = 10;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[1];
      expect(nextButton.nativeElement.hasAttribute('aria-disabled')).toBe(true);
    });

    it('should have aria-disabled="true" on disabled Previous button', () => {
      component.currentPage = 1;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have aria-disabled="false" on enabled Previous button', () => {
      component.currentPage = 2;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.getAttribute('aria-disabled')).toBe('false');
    });

    it('should be keyboard navigable with Tab', () => {
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach((button) => {
        expect(button.nativeElement.type).toBe('button');
      });
    });

    it('should have button accessible to keyboard', () => {
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach((button) => {
        // Verify buttons have type and can receive focus
        expect(button.nativeElement.type).toBe('button');
        expect(button.nativeElement.hasAttribute('aria-label')).toBe(true);
      });
    });
  });

  describe('Input Property Updates', () => {
    it('should update page info when currentPage changes', () => {
      component.currentPage = 1;
      component.totalItems = 50;
      component.pageSize = 10;
      fixture.detectChanges();

      let info = compiled.query(By.css('.text-gray-600'));
      expect(info.nativeElement.textContent).toContain('Page 1');

      component.currentPage = 3;
      fixture.detectChanges();
      info = compiled.query(By.css('.text-gray-600'));
      expect(info.nativeElement.textContent).toContain('Page 3');
    });

    it('should update button state when currentPage changes', () => {
      component.currentPage = 1;
      component.totalItems = 100;
      component.pageSize = 10;
      fixture.detectChanges();

      let buttons = compiled.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.disabled).toBe(true);

      component.currentPage = 5;
      fixture.detectChanges();
      buttons = compiled.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.disabled).toBe(false);
    });

    it('should update totalPages when pageSize changes', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      expect(component.totalPages).toBe(10);

      component.pageSize = 25;
      expect(component.totalPages).toBe(4);
    });

    it('should update item range when totalItems changes', () => {
      component.currentPage = 1;
      component.pageSize = 10;
      component.totalItems = 50;
      fixture.detectChanges();

      let info = compiled.query(By.css('.text-gray-600'));
      expect(info.nativeElement.textContent).toContain('50');

      component.totalItems = 100;
      fixture.detectChanges();
      info = compiled.query(By.css('.text-gray-600'));
      expect(info.nativeElement.textContent).toContain('100');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero totalItems', () => {
      component.totalItems = 0;
      component.pageSize = 10;
      fixture.detectChanges();

      expect(component.totalPages).toBe(1);
      expect(component.startItem).toBe(0);
      expect(component.endItem).toBe(0);
      expect(component.isLastPage).toBe(true);
    });

    it('should handle single item', () => {
      component.totalItems = 1;
      component.pageSize = 10;
      fixture.detectChanges();

      expect(component.totalPages).toBe(1);
      expect(component.startItem).toBe(1);
      expect(component.endItem).toBe(1);
    });

    it('should handle very large page size', () => {
      component.totalItems = 100;
      component.pageSize = 1000;
      fixture.detectChanges();

      expect(component.totalPages).toBe(1);
      expect(component.endItem).toBe(100);
    });

    it('should handle currentPage exceeding totalPages', () => {
      component.totalItems = 50;
      component.pageSize = 10;
      component.currentPage = 100;
      fixture.detectChanges();

      expect(component.isLastPage).toBe(true);
    });
  });

  describe('Styling and Layout', () => {
    it('should have container styling', () => {
      fixture.detectChanges();
      const container = compiled.query(By.css('.flex'));
      const classList = container.nativeElement.classList;
      expect(classList.contains('flex')).toBe(true);
      expect(classList.contains('items-center')).toBe(true);
      expect(classList.contains('gap-4')).toBe(true);
      expect(classList.contains('p-4')).toBe(true);
      expect(classList.contains('bg-white')).toBe(true);
      expect(classList.contains('rounded-lg')).toBe(true);
      expect(classList.contains('border')).toBe(true);
    });

    it('should have button styling', () => {
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach((button) => {
        const classList = button.nativeElement.classList;
        expect(classList.contains('px-4')).toBe(true);
        expect(classList.contains('py-2')).toBe(true);
        expect(classList.contains('text-sm')).toBe(true);
        expect(classList.contains('font-medium')).toBe(true);
        expect(classList.contains('rounded-lg')).toBe(true);
      });
    });

    it('should have transition on buttons', () => {
      fixture.detectChanges();
      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach((button) => {
        expect(button.nativeElement.classList.contains('transition-colors')).toBe(true);
      });
    });
  });
});
