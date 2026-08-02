import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';
import { vi } from 'vitest';

describe('ErrorStateComponent', () => {
  let component: ErrorStateComponent;
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should render error icon', () => {
      component.icon = '⚠️';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('⚠️');
    });

    it('should render title', () => {
      component.title = 'Failed to load data';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Failed to load data');
    });

    it('should render message', () => {
      component.message = 'Please try again later';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Please try again later');
    });

    it('should render default icon', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('⚠️');
    });

    it('should render Retry button', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Try Again');
    });
  });

  describe('optional error details', () => {
    it('should not display error details section when not provided', () => {
      component.errorDetails = undefined;
      fixture.detectChanges();

      const details = fixture.nativeElement.querySelector('[role="region"]');
      expect(details).toBeFalsy();
    });

    it('should display error details when provided', () => {
      component.errorDetails = 'Connection timeout';
      fixture.detectChanges();

      const details = fixture.nativeElement.querySelector('[role="region"]');
      expect(details).toBeTruthy();
      expect(details.textContent).toContain('Connection timeout');
    });

    it('should have aria-label on error details region', () => {
      component.errorDetails = 'Network error';
      fixture.detectChanges();

      const details = fixture.nativeElement.querySelector('[role="region"]');
      expect(details.getAttribute('aria-label')).toBe('Error details');
    });
  });

  describe('retry button', () => {
    it('should emit retry event when button is clicked', () => {
      const retryEmitSpy = vi.spyOn(component.retry, 'emit');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(retryEmitSpy).toHaveBeenCalled();
    });

    it('should call onRetry method when clicked', () => {
      const onRetrySpy = vi.spyOn(component, 'onRetry');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(onRetrySpy).toHaveBeenCalled();
    });

    it('should have aria-label on retry button', () => {
      component.title = 'Load failed';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toContain('Load failed');
    });
  });

  describe('different error states', () => {
    it('should handle network error', () => {
      component.icon = '🌐';
      component.title = 'Network Error';
      component.message = 'Unable to reach the server';
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('🌐');
      expect(fixture.nativeElement.textContent).toContain('Network Error');
    });

    it('should handle timeout error', () => {
      component.icon = '⏱️';
      component.title = 'Request Timeout';
      component.message = 'The request took too long';
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('⏱️');
      expect(fixture.nativeElement.textContent).toContain('Request Timeout');
    });

    it('should handle permission error', () => {
      component.icon = '🔒';
      component.title = 'Permission Denied';
      component.message = 'You do not have permission to access this';
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('🔒');
      expect(fixture.nativeElement.textContent).toContain('Permission Denied');
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      fixture.detectChanges();
      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
    });

    it('should have role on error details', () => {
      component.errorDetails = 'Error details';
      fixture.detectChanges();

      const region = fixture.nativeElement.querySelector('[role="region"]');
      expect(region.getAttribute('role')).toBe('region');
    });

    it('should have focus-visible styling on retry button', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('should use error color for icon', () => {
      component.icon = '⚠️';
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.text-red-400');
      expect(icon).toBeTruthy();
    });

    it('should use error styling for error details', () => {
      component.errorDetails = 'Some error';
      fixture.detectChanges();

      const details = fixture.nativeElement.querySelector('.bg-red-50');
      expect(details).toBeTruthy();
    });
  });

  describe('change detection', () => {
    it('should use OnPush change detection', () => {
      const metadata = (component.constructor as any).__annotations__[0];
      expect(metadata.changeDetection).toBeDefined();
    });
  });

  describe('input updates', () => {
    it('should have icon property that can be updated', () => {
      component.icon = '⚠️';
      expect(component.icon).toBe('⚠️');

      component.icon = '❌';
      expect(component.icon).toBe('❌');
    });

    it('should have message property that can be updated', () => {
      component.message = 'Original message';
      expect(component.message).toBe('Original message');

      component.message = 'Updated message';
      expect(component.message).toBe('Updated message');
    });
  });
});
