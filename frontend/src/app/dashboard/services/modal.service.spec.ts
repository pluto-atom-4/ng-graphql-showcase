import { TestBed } from '@angular/core/testing';
import { ModalService, ModalConfig } from './modal.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-test-modal',
  standalone: true,
  template: '<div>Test Modal</div>'
})
class TestModalComponent {}

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModalService],
      declarations: []
    });
    service = TestBed.inject(ModalService);
  });

  describe('open', () => {
    it('should open a modal and return a ModalRef', () => {
      const ref = service.open(TestModalComponent);
      expect(ref).toBeTruthy();
      expect(ref.id).toBeDefined();
      expect(typeof ref.close).toBe('function');
      expect(ref.result$).toBeTruthy();
    });

    it('should create unique IDs for multiple modals', () => {
      const ref1 = service.open(TestModalComponent);
      const ref2 = service.open(TestModalComponent);
      expect(ref1.id).not.toBe(ref2.id);
    });

    it('should accept modal config', () => {
      const config: ModalConfig = {
        size: 'lg',
        backdrop: true,
        closeOnEscape: true,
        focusTrap: true
      };
      const ref = service.open(TestModalComponent, config);
      expect(ref).toBeTruthy();
    });
  });

  describe('close', () => {
    it('should close a modal and emit result', () => {
      return new Promise<void>((done) => {
        const ref = service.open(TestModalComponent);
        const testResult = { success: true };

        ref.result$.subscribe((result) => {
          expect(result).toEqual(testResult);
          done();
        });

        ref.close(testResult);
      });
    });

    it('should close a modal without result', () => {
      return new Promise<void>((done) => {
        const ref = service.open(TestModalComponent);

        ref.result$.subscribe({
          next: () => {},
          error: () => {
            throw new Error('Should not error');
          },
          complete: () => {
            done();
          }
        });

        ref.close();
      });
    });

    it('should remove modal from open modals after closing', () => {
      const ref = service.open(TestModalComponent);
      expect(service.hasOpenModals()).toBe(true);

      ref.close();
      expect(service.hasOpenModals()).toBe(false);
    });

    it('should allow closing by modal ID', () => {
      const ref = service.open(TestModalComponent);
      const modalId = ref.id;

      let closed = false;
      ref.result$.subscribe({
        complete: () => {
          closed = true;
        }
      });

      service.close(modalId);
      expect(closed).toBe(true);
      expect(service.hasOpenModals()).toBe(false);
    });
  });

  describe('closeAll', () => {
    it('should close all open modals', () => {
      const ref1 = service.open(TestModalComponent);
      const ref2 = service.open(TestModalComponent);
      const ref3 = service.open(TestModalComponent);

      expect(service.hasOpenModals()).toBe(true);
      service.closeAll();
      expect(service.hasOpenModals()).toBe(false);
    });

    it('should complete all modal result observables', () => {
      return new Promise<void>((done) => {
        const ref1 = service.open(TestModalComponent);
        const ref2 = service.open(TestModalComponent);

        let completedCount = 0;
        ref1.result$.subscribe({
          complete: () => {
            completedCount++;
            if (completedCount === 2) {
              expect(completedCount).toBe(2);
              done();
            }
          }
        });

        ref2.result$.subscribe({
          complete: () => {
            completedCount++;
            if (completedCount === 2) {
              expect(completedCount).toBe(2);
              done();
            }
          }
        });

        service.closeAll();
      });
    });
  });

  describe('getModal', () => {
    it('should return a modal by ID', () => {
      const ref = service.open(TestModalComponent);
      const retrieved = service.getModal(ref.id);
      expect(retrieved).toBe(ref);
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = service.getModal('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllModals', () => {
    it('should return all open modals', () => {
      const ref1 = service.open(TestModalComponent);
      const ref2 = service.open(TestModalComponent);
      const ref3 = service.open(TestModalComponent);

      const allModals = service.getAllModals();
      expect(allModals).toHaveLength(3);
      expect(allModals).toContain(ref1);
      expect(allModals).toContain(ref2);
      expect(allModals).toContain(ref3);
    });

    it('should return empty array when no modals are open', () => {
      const allModals = service.getAllModals();
      expect(allModals).toHaveLength(0);
    });
  });

  describe('hasOpenModals', () => {
    it('should return false when no modals are open', () => {
      expect(service.hasOpenModals()).toBe(false);
    });

    it('should return true when there are open modals', () => {
      service.open(TestModalComponent);
      expect(service.hasOpenModals()).toBe(true);
    });

    it('should return false after all modals are closed', () => {
      const ref = service.open(TestModalComponent);
      expect(service.hasOpenModals()).toBe(true);

      ref.close();
      expect(service.hasOpenModals()).toBe(false);
    });
  });

  describe('modal stacking', () => {
    it('should handle multiple modals in stack', () => {
      const ref1 = service.open(TestModalComponent);
      const ref2 = service.open(TestModalComponent);
      const ref3 = service.open(TestModalComponent);

      expect(service.getAllModals()).toHaveLength(3);

      ref2.close();
      expect(service.getAllModals()).toHaveLength(2);

      ref1.close();
      expect(service.getAllModals()).toHaveLength(1);

      ref3.close();
      expect(service.getAllModals()).toHaveLength(0);
    });

    it('should not affect other modals when one is closed', () => {
      return new Promise<void>((done) => {
        const ref1 = service.open(TestModalComponent);
        const ref2 = service.open(TestModalComponent);

        let ref1Closed = false;
        let ref2Closed = false;

        ref1.result$.subscribe({
          complete: () => {
            ref1Closed = true;
          }
        });

        ref2.result$.subscribe({
          complete: () => {
            ref2Closed = true;
            if (ref1Closed && ref2Closed) {
              expect(ref1Closed).toBe(true);
              expect(ref2Closed).toBe(true);
              done();
            }
          }
        });

        ref1.close();
        setTimeout(() => {
          ref2.close();
        }, 10);
      });
    });
  });
});
