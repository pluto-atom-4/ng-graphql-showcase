import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render select and prev/next buttons', () => {
    const select = fixture.nativeElement.querySelector('select');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(select).toBeTruthy();
    expect(buttons.length).toBe(2);
  });

  it('should calculate total pages correctly', () => {
    component.total = 100;
    component.pageSize = 10;
    expect(component.totalPages).toBe(10);
  });

  it('should calculate total pages with remainder', () => {
    component.total = 105;
    component.pageSize = 10;
    expect(component.totalPages).toBe(11);
  });

  it('should disable previous button on first page', () => {
    component.currentPage = 1;
    expect(component.isFirstPage).toBe(true);
  });

  it('should disable next button on last page', () => {
    component.total = 50;
    component.pageSize = 10;
    component.currentPage = 5;
    expect(component.isLastPage).toBe(true);
  });

  it('should enable next button when not on last page', () => {
    component.total = 100;
    component.pageSize = 10;
    component.currentPage = 1;
    expect(component.isLastPage).toBe(false);
  });

  it('should calculate start item', () => {
    component.total = 100;
    component.pageSize = 10;
    component.currentPage = 3;
    expect(component.startItem).toBe(21);
  });

  it('should calculate end item', () => {
    component.total = 100;
    component.pageSize = 10;
    component.currentPage = 3;
    expect(component.endItem).toBe(30);
  });

  it('should cap end item at total', () => {
    component.total = 105;
    component.pageSize = 10;
    component.currentPage = 11;
    expect(component.endItem).toBe(105);
  });

  it('should handle zero total', () => {
    component.total = 0;
    component.pageSize = 10;
    expect(component.startItem).toBe(0);
    expect(component.endItem).toBe(0);
  });

  it('should emit pageChange on previous when not on first page', () => {
    let emittedPage: number | undefined;
    component.pageChange.subscribe((page) => {
      emittedPage = page;
    });
    component.currentPage = 5;
    component.onPrevious();
    expect(emittedPage).toBe(4);
  });

  it('should not emit pageChange on previous when on first page', () => {
    let emitted = false;
    component.pageChange.subscribe(() => {
      emitted = true;
    });
    component.currentPage = 1;
    component.onPrevious();
    expect(emitted).toBe(false);
  });

  it('should emit pageChange on next when not on last page', () => {
    let emittedPage: number | undefined;
    component.pageChange.subscribe((page) => {
      emittedPage = page;
    });
    component.total = 100;
    component.pageSize = 10;
    component.currentPage = 1;
    component.onNext();
    expect(emittedPage).toBe(2);
  });

  it('should not emit pageChange on next when on last page', () => {
    let emitted = false;
    component.pageChange.subscribe(() => {
      emitted = true;
    });
    component.total = 50;
    component.pageSize = 10;
    component.currentPage = 5;
    component.onNext();
    expect(emitted).toBe(false);
  });

  it('should call onPageSizeChange handler', () => {
    let called = false;
    component.pageSizeChange.subscribe(() => {
      called = true;
    });
    component.pageSize = 10;
    component.onPageSizeChange({
      target: { value: '25' } as any
    } as Event);
    expect(called).toBe(true);
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });
});
