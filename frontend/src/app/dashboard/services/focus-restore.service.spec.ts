import { TestBed } from '@angular/core/testing';
import { FocusRestoreService } from './focus-restore.service';

describe('FocusRestoreService', () => {
  let service: FocusRestoreService;
  let triggerElement: HTMLElement;
  let targetElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FocusRestoreService]
    });
    service = TestBed.inject(FocusRestoreService);

    // Create test elements
    triggerElement = document.createElement('button');
    triggerElement.textContent = 'Open Modal';
    triggerElement.id = 'trigger-btn';

    targetElement = document.createElement('input');
    targetElement.id = 'target-input';

    document.body.appendChild(triggerElement);
    document.body.appendChild(targetElement);
  });

  afterEach(() => {
    document.body.removeChild(triggerElement);
    document.body.removeChild(targetElement);
  });

  describe('saveTrigger', () => {
    it('should save the trigger element', () => {
      service.saveTrigger(triggerElement);
      expect(service.getTrigger()).toBe(triggerElement);
    });

    it('should overwrite previous trigger element', () => {
      const firstBtn = document.createElement('button');
      const secondBtn = document.createElement('button');
      document.body.appendChild(firstBtn);
      document.body.appendChild(secondBtn);

      service.saveTrigger(firstBtn);
      expect(service.getTrigger()).toBe(firstBtn);

      service.saveTrigger(secondBtn);
      expect(service.getTrigger()).toBe(secondBtn);

      document.body.removeChild(firstBtn);
      document.body.removeChild(secondBtn);
    });
  });

  describe('restore', () => {
    it('should restore focus to saved trigger element', () => {
      service.saveTrigger(triggerElement);
      targetElement.focus();
      expect(document.activeElement).toBe(targetElement);

      service.restore();
      expect(document.activeElement).toBe(triggerElement);
    });

    it('should clear the trigger element after restoring', () => {
      service.saveTrigger(triggerElement);
      service.restore();
      expect(service.getTrigger()).toBeNull();
    });

    it('should call scrollIntoView with smooth behavior', () => {
      service.saveTrigger(triggerElement);
      const scrollIntoViewSpy = vi.spyOn(triggerElement, 'scrollIntoView');

      service.restore();

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest'
      });
    });

    it('should do nothing if no trigger element is saved', () => {
      const activeElementBefore = document.activeElement;
      service.restore();
      expect(document.activeElement).toBe(activeElementBefore);
    });
  });

  describe('clear', () => {
    it('should clear the stored trigger element', () => {
      service.saveTrigger(triggerElement);
      expect(service.getTrigger()).toBe(triggerElement);

      service.clear();
      expect(service.getTrigger()).toBeNull();
    });

    it('should not restore focus when cleared', () => {
      service.saveTrigger(triggerElement);
      targetElement.focus();
      expect(document.activeElement).toBe(targetElement);

      service.clear();
      expect(document.activeElement).toBe(targetElement);
    });
  });

  describe('getTrigger', () => {
    it('should return null when no trigger is saved', () => {
      expect(service.getTrigger()).toBeNull();
    });

    it('should return the saved trigger element', () => {
      service.saveTrigger(triggerElement);
      expect(service.getTrigger()).toBe(triggerElement);
    });

    it('should return null after restore is called', () => {
      service.saveTrigger(triggerElement);
      service.restore();
      expect(service.getTrigger()).toBeNull();
    });
  });
});
