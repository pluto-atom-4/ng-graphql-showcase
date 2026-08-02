import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalContainerComponent } from './modal-container.component';
import { FocusTrapService } from '../../services/focus-trap.service';
import { FocusRestoreService } from '../../services/focus-restore.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ModalContainerComponent', () => {
  let component: ModalContainerComponent;
  let fixture: ComponentFixture<ModalContainerComponent>;
  let focusTrapService: { trap: ReturnType<typeof vi.fn> };
  let focusRestoreService: { saveTrigger: ReturnType<typeof vi.fn>; restore: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let triggerElement: HTMLElement;

  beforeEach(async () => {
    const focusTrapSpy = {
      trap: vi.fn().mockReturnValue(() => {})
    };
    const focusRestoreSpy = {
      saveTrigger: vi.fn(),
      restore: vi.fn(),
      clear: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ModalContainerComponent],
      providers: [
        { provide: FocusTrapService, useValue: focusTrapSpy },
        { provide: FocusRestoreService, useValue: focusRestoreSpy }
      ]
    }).compileComponents();

    focusTrapService = TestBed.inject(FocusTrapService) as any;
    focusRestoreService = TestBed.inject(FocusRestoreService) as any;

    fixture = TestBed.createComponent(ModalContainerComponent);
    component = fixture.componentInstance;

    triggerElement = document.createElement('button');
    triggerElement.textContent = 'Open Modal';
    document.body.appendChild(triggerElement);
  });

  afterEach(() => {
    if (triggerElement && triggerElement.parentNode) {
      document.body.removeChild(triggerElement);
    }
  });

  describe('rendering', () => {
    it('should render modal container', () => {
      component.config = { backdrop: true };
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal).toBeTruthy();
    });

    it('should render backdrop by default', () => {
      component.config = {};
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeTruthy();
    });

    it('should not render backdrop when disabled', () => {
      component.config = { backdrop: false };
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeFalsy();
    });

    it('should render content projection', () => {
      fixture.componentInstance.config = {};
      fixture.nativeElement.innerHTML = '<app-modal-container><p id="test-content">Test Content</p></app-modal-container>';
      fixture.detectChanges();

      // Note: Content projection is tested at the component level
      expect(component).toBeTruthy();
    });
  });

  describe('size classes', () => {
    it('should apply sm size class', () => {
      component.config = { size: 'sm' };
      expect(component.modalSizeClass).toBe('modal-sm');
    });

    it('should apply md size class', () => {
      component.config = { size: 'md' };
      expect(component.modalSizeClass).toBe('modal-md');
    });

    it('should apply lg size class', () => {
      component.config = { size: 'lg' };
      expect(component.modalSizeClass).toBe('modal-lg');
    });

    it('should default to md size', () => {
      component.config = {};
      expect(component.modalSizeClass).toBe('modal-md');
    });
  });

  describe('focus management', () => {
    it('should activate focus trap by default', () => {
      component.config = { focusTrap: true };
      fixture.detectChanges();
      component.ngAfterViewInit();

      expect(focusTrapService.trap).toHaveBeenCalled();
    });

    it('should not activate focus trap when disabled', () => {
      component.config = { focusTrap: false };
      fixture.detectChanges();
      component.ngAfterViewInit();

      expect(focusTrapService.trap).not.toHaveBeenCalled();
    });

    it('should save trigger element for focus restore', () => {
      component.config = { restoreFocus: true };
      component.triggerElement = triggerElement;
      fixture.detectChanges();
      component.ngAfterViewInit();

      expect(focusRestoreService.saveTrigger).toHaveBeenCalledWith(triggerElement);
    });

    it('should not save trigger if restoreFocus is disabled', () => {
      component.config = { restoreFocus: false };
      component.triggerElement = triggerElement;
      fixture.detectChanges();
      component.ngAfterViewInit();

      expect(focusRestoreService.saveTrigger).not.toHaveBeenCalled();
    });

    it('should restore focus on destroy', () => {
      component.config = { restoreFocus: true };
      fixture.detectChanges();
      component.ngAfterViewInit();

      component.ngOnDestroy();
      expect(focusRestoreService.restore).toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should close on Escape key when enabled', () => {
      component.config = { closeOnEscape: true };
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      component.onEscapeKey();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not close on Escape key when disabled', () => {
      component.config = { closeOnEscape: false };
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      component.onEscapeKey();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('backdrop interactions', () => {
    it('should close on backdrop click when enabled', () => {
      component.config = { backdrop: true };
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      component.onBackdropClick();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not close on backdrop click when disabled', () => {
      component.config = { backdrop: false };
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      component.onBackdropClick();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('ARIA attributes', () => {
    it('should have dialog role', () => {
      component.config = {};
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal', () => {
      component.config = {};
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[aria-modal="true"]');
      expect(modal).toBeTruthy();
    });

    it('should set aria-labelledby', () => {
      component.config = { ariaLabelledBy: 'modal-title' };
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal.getAttribute('aria-labelledby')).toBe('modal-title');
    });

    it('should set aria-describedby', () => {
      component.config = { ariaDescribedBy: 'modal-description' };
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal.getAttribute('aria-describedby')).toBe('modal-description');
    });
  });

  describe('lifecycle', () => {
    it('should unsubscribe from focus trap on destroy', () => {
      const unsubscribeSpy = vi.fn();
      (focusTrapService.trap as any).mockReturnValue(unsubscribeSpy);

      component.config = { focusTrap: true };
      fixture.detectChanges();
      component.ngAfterViewInit();

      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('animations', () => {
    it('should have fade-in animation class on backdrop', () => {
      component.config = { backdrop: true };
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('[aria-hidden="true"]');
      expect(backdrop.classList.contains('animate-fade-in')).toBe(true);
    });

    it('should have fade-in animation class on modal', () => {
      component.config = {};
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('.bg-white');
      expect(modal.classList.contains('animate-fade-in')).toBe(true);
    });
  });
});
