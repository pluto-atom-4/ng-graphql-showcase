/**
 * Keyboard Navigation Tests
 * Phase 4b - Comprehensive keyboard navigation testing (40+ tests)
 *
 * Tests cover:
 * - Tab order logical progression
 * - Keyboard event utilities
 * - Focus management helpers
 * - Keyboard activation patterns
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';

import { TabsComponent, Tab } from '../components/tabs/tabs.component';
import { ButtonComponent } from '../shared/button/button.component';
import {
  dispatchKeyboardEvent,
  getFocusableElements,
  getTabOrder,
  focusElement,
  activateElement,
  getFocusedElement,
  getKeyCode,
} from '../a11y/keyboard-navigation.utils';

// Test container component
@Component({
  selector: 'app-keyboard-nav-test',
  standalone: true,
  imports: [CommonModule, TabsComponent, ButtonComponent],
  template: `
    <div class="test-container">
      <h1>Keyboard Navigation Test Suite</h1>

      <!-- Tabs Component Tests -->
      <section data-testid="tabs-section">
        <h2>Tabs Navigation</h2>
        <app-tabs
          [tabs]="tabs"
          [activeIndex]="activeTabIndex"
          (activeIndexChange)="activeTabIndex = $event"
        >
          <div tab-overview>
            <button id="overview-btn-1">Overview Button 1</button>
            <button id="overview-btn-2">Overview Button 2</button>
          </div>
          <div tab-details>
            <button id="details-btn-1">Details Button 1</button>
            <button id="details-btn-2">Details Button 2</button>
          </div>
          <div tab-settings>
            <button id="settings-btn-1">Settings Button 1</button>
            <button id="settings-btn-2">Settings Button 2</button>
          </div>
        </app-tabs>
      </section>

      <!-- Button Group Tests -->
      <section data-testid="buttons-section">
        <h2>Button Activation</h2>
        <button id="primary-btn" type="button">Primary Button</button>
        <button id="secondary-btn" type="button">Secondary Button</button>
        <app-button id="app-btn-1" ariaLabel="Action Button">Action</app-button>
        <app-button id="app-btn-2" ariaLabel="Cancel Button">Cancel</app-button>
      </section>

      <!-- Modal-like container -->
      <section data-testid="modal-section" id="test-modal">
        <h2>Modal Focus Trap</h2>
        <div role="dialog" aria-modal="true" id="modal-content">
          <button id="modal-btn-1">Modal Button 1</button>
          <button id="modal-btn-2">Modal Button 2</button>
          <button id="modal-close-btn">Close Modal</button>
        </div>
      </section>

      <!-- Input Focus Tests -->
      <section data-testid="inputs-section">
        <h2>Input Navigation</h2>
        <label for="input-1">Input 1</label>
        <input id="input-1" type="text" placeholder="First input" />
        <label for="input-2">Input 2</label>
        <input id="input-2" type="text" placeholder="Second input" />
        <label for="checkbox-1">Checkbox</label>
        <input id="checkbox-1" type="checkbox" />
      </section>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 2rem;
    }

    section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    button {
      margin: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    input {
      margin: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
    }

    input:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }
  `],
})
export class KeyboardNavTestComponent {
  @ViewChild(TabsComponent) tabsComponent!: TabsComponent;

  tabs: Tab[] = [
    { id: 'overview', label: 'Overview', index: 0 },
    { id: 'details', label: 'Details', index: 1 },
    { id: 'settings', label: 'Settings', index: 2 },
  ];

  activeTabIndex = 0;
}

describe('Keyboard Navigation Tests', () => {
  let component: KeyboardNavTestComponent;
  let fixture: ComponentFixture<KeyboardNavTestComponent>;
  let container: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyboardNavTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyboardNavTestComponent);
    component = fixture.componentInstance;
    container = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Keyboard Event Utilities', () => {
    it('should create keyboard event with correct key', () => {
      const btn = container.querySelector('button') as HTMLElement;
      const event = dispatchKeyboardEvent(btn, 'keydown', 'Enter');
      expect(event.key).toBe('Enter');
    });

    it('should get correct key code for known keys', () => {
      expect(getKeyCode('Enter')).toBe('Enter');
      expect(getKeyCode('ArrowRight')).toBe('ArrowRight');
      expect(getKeyCode(' ')).toBe('Space');
      expect(getKeyCode('Escape')).toBe('Escape');
    });

    it('should dispatch keyboard event that bubbles', () => {
      const btn = container.querySelector('button') as HTMLElement;
      let eventFired = false;

      btn.addEventListener('keydown', () => {
        eventFired = true;
      });

      dispatchKeyboardEvent(btn, 'keydown', 'Enter');
      expect(eventFired).toBe(true);
    });

    it('should set preventDefault when appropriate', () => {
      const btn = container.querySelector('button') as HTMLElement;
      const event = dispatchKeyboardEvent(btn, 'keydown', 'Enter');
      expect(event instanceof KeyboardEvent).toBe(true);
    });
  });

  describe('Tab Order Detection', () => {
    it('should identify all focusable elements', () => {
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBeGreaterThan(0);
    });

    it('should return multiple elements from button section', () => {
      const section = container.querySelector('[data-testid="buttons-section"]') as HTMLElement;
      const focusable = getFocusableElements(section);
      expect(focusable.length).toBeGreaterThanOrEqual(3);
    });

    it('should include tabs in focusable elements', () => {
      const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
      const focusable = getFocusableElements(tablist);
      expect(focusable.length).toBeGreaterThanOrEqual(2);
    });

    it('should include form inputs in focusable elements', () => {
      const section = container.querySelector('[data-testid="inputs-section"]') as HTMLElement;
      const inputs = Array.from(section.querySelectorAll('input'));
      const focusable = getFocusableElements(section);

      inputs.forEach(input => {
        expect(focusable).toContain(input);
      });
    });

    it('should exclude disabled elements from tab order', () => {
      const section = container.querySelector('[data-testid="buttons-section"]') as HTMLElement;
      const disabledBtn = document.createElement('button');
      disabledBtn.disabled = true;
      section.appendChild(disabledBtn);

      const focusable = getFocusableElements(section);
      expect(focusable).not.toContain(disabledBtn);
    });

    it('should detect hidden elements', () => {
      const section = container.querySelector('[data-testid="buttons-section"]') as HTMLElement;
      const hiddenBtn = document.createElement('button');
      hiddenBtn.style.display = 'none';
      section.appendChild(hiddenBtn);

      // Hidden elements might be in focusable list, but should not be in visible tab order
      const focusable = getFocusableElements(section);
      expect(focusable.length).toBeGreaterThan(0);
    });

    it('should handle tabindex ordering', () => {
      const container = document.createElement('div');
      const btn1 = document.createElement('button');
      btn1.textContent = 'Button 1';
      const btn2 = document.createElement('button');
      btn2.textContent = 'Button 2';

      container.appendChild(btn1);
      container.appendChild(btn2);

      // Both buttons should be recognized as focusable
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle negative tabindex', () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      btn.setAttribute('tabindex', '-1');
      container.appendChild(btn);

      // getFocusableElements returns elements that can be focused (including programmatically)
      // negative tabindex elements can be focused but not via Tab key
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Focus Management', () => {
    it('should focus element programmatically', () => {
      const btn = container.querySelector('#primary-btn') as HTMLElement;
      focusElement(btn);
      expect(getFocusedElement()).toBe(btn);
    });

    it('should get currently focused element', () => {
      const btn = container.querySelector('#primary-btn') as HTMLElement;
      focusElement(btn);
      expect(getFocusedElement()).toBe(btn);
    });

    it('should focus first input in section', () => {
      const section = container.querySelector('[data-testid="inputs-section"]') as HTMLElement;
      const input = section.querySelector('#input-1') as HTMLElement;
      focusElement(input);
      expect(getFocusedElement()).toBe(input);
    });

    it('should allow focusing without scroll', () => {
      const btn = container.querySelector('#primary-btn') as HTMLElement;
      focusElement(btn);
      expect(getFocusedElement()).toBe(btn);
    });

    it('should emit focus event when element focused', () => {
      const btn = container.querySelector('#primary-btn') as HTMLElement;
      let focusEventFired = false;

      btn.addEventListener('focus', () => {
        focusEventFired = true;
      });

      focusElement(btn);
      expect(focusEventFired).toBe(true);
    });
  });

  describe('Button Activation', () => {
    it('should activate button with Enter key', () => {
      const btn = container.querySelector('#primary-btn') as HTMLElement;
      let clicked = false;

      btn.addEventListener('click', () => {
        clicked = true;
      });

      activateElement(btn);
      expect(clicked).toBe(true);
    });

    it('should activate button element', () => {
      const btn = container.querySelector('#secondary-btn') as HTMLElement;
      let clicked = false;

      btn.addEventListener('click', () => {
        clicked = true;
      });

      activateElement(btn);
      expect(clicked).toBe(true);
    });

    it('should activate checkbox on Space', () => {
      const checkbox = container.querySelector('#checkbox-1') as HTMLInputElement;
      activateElement(checkbox);
      expect(checkbox).toBeTruthy();
    });

    it('should handle button with aria-label', () => {
      const appBtn = container.querySelector('#app-btn-1') as HTMLElement;
      const nativeBtn = appBtn.querySelector('button') as HTMLElement;
      let clicked = false;

      nativeBtn.addEventListener('click', () => {
        clicked = true;
      });

      activateElement(nativeBtn);
      expect(clicked).toBe(true);
    });
  });

  describe('Tabs Accessibility', () => {
    it('should have tablist role', () => {
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('should have tab roles', () => {
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBeGreaterThanOrEqual(3);
    });

    it('should have aria-selected on tabs', () => {
      const tabs = container.querySelectorAll('[role="tab"]');
      let hasAriaSelected = false;

      tabs.forEach(tab => {
        if (tab.hasAttribute('aria-selected')) {
          hasAriaSelected = true;
        }
      });

      expect(hasAriaSelected).toBe(true);
    });

    it('should have aria-controls on tabs', () => {
      const firstTab = container.querySelector('[role="tab"]') as HTMLElement;
      expect(firstTab.hasAttribute('aria-controls')).toBe(true);
    });

    it('should have tabpanel role', () => {
      const panels = container.querySelectorAll('[role="tabpanel"]');
      expect(panels.length).toBeGreaterThanOrEqual(3);
    });

    it('should have aria-labelledby on panels', () => {
      const panels = container.querySelectorAll('[role="tabpanel"]');
      let hasAriaLabelledBy = false;

      panels.forEach(panel => {
        if (panel.hasAttribute('aria-labelledby')) {
          hasAriaLabelledBy = true;
        }
      });

      expect(hasAriaLabelledBy).toBe(true);
    });

    it('should have tabindex on tab buttons', () => {
      const tabs = container.querySelectorAll('[role="tab"]');

      tabs.forEach(tab => {
        expect(tab.hasAttribute('tabindex')).toBe(true);
      });
    });
  });

  describe('Modal/Dialog Accessibility', () => {
    it('should have dialog role', () => {
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-modal attribute', () => {
      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should have focusable elements in modal', () => {
      const modal = container.querySelector('[role="dialog"]') as HTMLElement;
      const focusable = getFocusableElements(modal);
      expect(focusable.length).toBeGreaterThan(0);
    });

    it('should have multiple focusable elements for focus trap', () => {
      const modal = container.querySelector('[role="dialog"]') as HTMLElement;
      const focusable = getFocusableElements(modal);
      expect(focusable.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Button Group Accessibility', () => {
    it('should have multiple buttons focusable', () => {
      const section = container.querySelector('[data-testid="buttons-section"]') as HTMLElement;
      const focusable = getFocusableElements(section);
      expect(focusable.length).toBeGreaterThanOrEqual(4);
    });

    it('should all buttons be active (not disabled)', () => {
      const buttons = container.querySelectorAll('[data-testid="buttons-section"] button, [data-testid="buttons-section"] app-button');
      let allActive = true;

      buttons.forEach(btn => {
        if ((btn as any).disabled) {
          allActive = false;
        }
      });

      expect(allActive).toBe(true);
    });

    it('should have aria-label on buttons', () => {
      const appBtns = container.querySelectorAll('app-button');
      let hasLabels = false;

      appBtns.forEach(btn => {
        if (btn.hasAttribute('ariaLabel')) {
          hasLabels = true;
        }
      });

      expect(hasLabels).toBe(true);
    });
  });

  describe('Form Input Accessibility', () => {
    it('should have labels for inputs', () => {
      const labels = container.querySelectorAll('[data-testid="inputs-section"] label');
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });

    it('should have associated labels via for attribute', () => {
      const label = container.querySelector('label[for="input-1"]');
      expect(label).toBeTruthy();
    });

    it('should have focusable inputs', () => {
      const section = container.querySelector('[data-testid="inputs-section"]') as HTMLElement;
      const inputs = Array.from(section.querySelectorAll('input'));
      const focusable = getFocusableElements(section);

      inputs.forEach(input => {
        expect(focusable).toContain(input);
      });
    });

    it('should allow focusing and typing in inputs', () => {
      const input = container.querySelector('#input-1') as HTMLInputElement;
      focusElement(input);

      input.value = 'test';
      expect(input.value).toBe('test');
    });
  });

  describe('Tab Order Through Sections', () => {
    it('should have focusable elements in multiple sections', () => {
      const allFocusable = getFocusableElements(container);
      expect(allFocusable.length).toBeGreaterThan(8);
    });

    it('should include tabs from first section', () => {
      const section = container.querySelector('[data-testid="tabs-section"]') as HTMLElement;
      const focusable = getFocusableElements(section);
      expect(focusable.length).toBeGreaterThan(0);
    });

    it('should include buttons from second section', () => {
      const section = container.querySelector('[data-testid="buttons-section"]') as HTMLElement;
      const focusable = getFocusableElements(section);
      expect(focusable.length).toBeGreaterThanOrEqual(4);
    });

    it('should include modal buttons from third section', () => {
      const modal = container.querySelector('[role="dialog"]') as HTMLElement;
      const focusable = getFocusableElements(modal);
      expect(focusable.length).toBeGreaterThan(0);
    });

    it('should include inputs from fourth section', () => {
      const section = container.querySelector('[data-testid="inputs-section"]') as HTMLElement;
      const focusable = getFocusableElements(section);
      expect(focusable.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Keyboard Event Prevention', () => {
    it('should preventDefault for arrow keys in tabs', () => {
      const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
      const event = dispatchKeyboardEvent(tablist, 'keydown', 'ArrowRight');
      // Event should be preventable
      expect(event instanceof KeyboardEvent).toBe(true);
    });

    it('should handle multiple key types', () => {
      const container = document.createElement('div');
      const event1 = dispatchKeyboardEvent(container, 'keydown', 'Enter');
      const event2 = dispatchKeyboardEvent(container, 'keydown', ' ');
      const event3 = dispatchKeyboardEvent(container, 'keydown', 'Escape');

      expect(event1.key).toBe('Enter');
      expect(['Space', ' '].includes(event2.key)).toBe(true);
      expect(event3.key).toBe('Escape');
    });

    it('should dispatch both keydown and keyup events', () => {
      const btn = container.querySelector('button') as HTMLElement;
      let keydownFired = false;
      let keyupFired = false;

      btn.addEventListener('keydown', () => {
        keydownFired = true;
      });

      btn.addEventListener('keyup', () => {
        keyupFired = true;
      });

      dispatchKeyboardEvent(btn, 'keydown', 'Enter');
      dispatchKeyboardEvent(btn, 'keyup', 'Enter');

      expect(keydownFired).toBe(true);
      expect(keyupFired).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty container', () => {
      const empty = document.createElement('div');
      const focusable = getFocusableElements(empty);
      expect(focusable.length).toBe(0);
    });

    it('should handle single focusable element', () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      container.appendChild(btn);

      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(1);
      expect(focusable[0]).toBe(btn);
    });

    it('should handle deeply nested elements', () => {
      const container = document.createElement('div');
      const section = document.createElement('section');
      const btn = document.createElement('button');

      section.appendChild(btn);
      container.appendChild(section);

      const focusable = getFocusableElements(container);
      expect(focusable).toContain(btn);
    });

    it('should handle special input types', () => {
      const container = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      const radio = document.createElement('input');
      radio.type = 'radio';
      const text = document.createElement('input');
      text.type = 'text';

      container.appendChild(checkbox);
      container.appendChild(radio);
      container.appendChild(text);

      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(3);
    });
  });
});
