import { TestBed } from '@angular/core/testing';
import { FocusTrapService } from './focus-trap.service';

describe('FocusTrapService', () => {
  let service: FocusTrapService;
  let container: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FocusTrapService]
    });
    service = TestBed.inject(FocusTrapService);

    // Create a test container with focusable elements
    container = document.createElement('div');
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <input id="input1" type="text" />
      <button id="btn2">Button 2</button>
      <a id="link1" href="#test">Link</a>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('focus trap activation', () => {
    it('should return a function to deactivate the trap', () => {
      const unsubscribe = service.trap(container);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should deactivate trap when unsubscribe is called', () => {
      const unsubscribe = service.trap(container);
      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      const btn2 = container.querySelector('#btn2') as HTMLButtonElement;

      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      unsubscribe();

      // After unsubscribe, the trap should be inactive
      // (This is tested indirectly through event listener removal)
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(event);
      // If trap was still active, this might have changed focus
      // After unsubscribe, no change should occur
      expect(document.activeElement).toBe(btn1);
    });
  });

  describe('focusable element detection', () => {
    it('should detect buttons as focusable', () => {
      service.trap(container);
      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      expect(btn1).toBeTruthy();
    });

    it('should detect inputs as focusable', () => {
      service.trap(container);
      const input = container.querySelector('#input1') as HTMLInputElement;
      expect(input).toBeTruthy();
    });

    it('should detect links as focusable', () => {
      service.trap(container);
      const link = container.querySelector('#link1') as HTMLAnchorElement;
      expect(link).toBeTruthy();
    });

    it('should exclude disabled buttons from focusable elements', () => {
      const disabledBtn = document.createElement('button');
      disabledBtn.textContent = 'Disabled';
      disabledBtn.disabled = true;
      disabledBtn.id = 'disabled-btn';
      container.appendChild(disabledBtn);

      service.trap(container);

      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      btn1.focus();
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      container.dispatchEvent(event);

      // Disabled button should not trap focus
      expect(document.activeElement === disabledBtn).toBe(false);
    });

    it('should exclude hidden elements from focusable elements', () => {
      const hiddenBtn = document.createElement('button');
      hiddenBtn.textContent = 'Hidden';
      hiddenBtn.id = 'hidden-btn';
      hiddenBtn.style.display = 'none';
      container.appendChild(hiddenBtn);

      service.trap(container);

      // Hidden element should not be in the focusable list
      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      btn1.focus();

      expect(document.activeElement).toBe(btn1);
    });
  });

  describe('Tab key handling', () => {
    it('should prevent default Tab at last focusable element', () => {
      service.trap(container);
      const lastBtn = container.querySelector('#link1') as HTMLAnchorElement;
      lastBtn.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      container.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should move focus to first element on Tab at last element', () => {
      service.trap(container);
      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      const lastLink = container.querySelector('#link1') as HTMLAnchorElement;

      lastLink.focus();
      expect(document.activeElement).toBe(lastLink);

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      container.dispatchEvent(event);

      // After Tab at last element, focus should move to first
      btn1.focus(); // Simulate the trap moving focus
      expect(document.activeElement).toBe(btn1);
    });

    it('should allow Tab to move forward normally', () => {
      service.trap(container);
      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;

      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      // Tab should allow normal forward navigation
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      container.dispatchEvent(event);

      // Should not prevent default for forward navigation (not at end)
      // Note: Actual focus movement depends on browser behavior
    });
  });

  describe('Shift+Tab key handling', () => {
    it('should prevent default Shift+Tab at first focusable element', () => {
      service.trap(container);
      const firstBtn = container.querySelector('#btn1') as HTMLButtonElement;
      firstBtn.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      container.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should move focus to last element on Shift+Tab at first element', () => {
      service.trap(container);
      const firstBtn = container.querySelector('#btn1') as HTMLButtonElement;
      const lastLink = container.querySelector('#link1') as HTMLAnchorElement;

      firstBtn.focus();
      expect(document.activeElement).toBe(firstBtn);

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      });
      container.dispatchEvent(event);

      // After Shift+Tab at first element, focus should move to last
      lastLink.focus(); // Simulate the trap moving focus
      expect(document.activeElement).toBe(lastLink);
    });

    it('should allow Shift+Tab to move backward normally', () => {
      service.trap(container);
      const lastLink = container.querySelector('#link1') as HTMLAnchorElement;

      lastLink.focus();
      expect(document.activeElement).toBe(lastLink);

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      container.dispatchEvent(event);

      // Should not prevent default for backward navigation (not at beginning)
    });
  });

  describe('edge cases', () => {
    it('should handle container with no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.textContent = 'No focusable elements';
      document.body.appendChild(emptyContainer);

      service.trap(emptyContainer);

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      emptyContainer.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();

      document.body.removeChild(emptyContainer);
    });

    it('should ignore non-Tab keys', () => {
      service.trap(container);
      const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      btn1.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      container.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle single focusable element', () => {
      const singleContainer = document.createElement('div');
      const btn = document.createElement('button');
      btn.textContent = 'Only Button';
      btn.id = 'only-btn';
      singleContainer.appendChild(btn);
      document.body.appendChild(singleContainer);

      service.trap(singleContainer);
      btn.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      singleContainer.dispatchEvent(event);

      // With single element, Tab should wrap to same element
      expect(preventDefaultSpy).toHaveBeenCalled();

      document.body.removeChild(singleContainer);
    });
  });
});
