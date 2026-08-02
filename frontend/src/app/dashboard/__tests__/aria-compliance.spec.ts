/**
 * ARIA Compliance Tests
 * Phase 4c - Comprehensive ARIA and semantic HTML verification (20+ tests)
 *
 * Tests cover:
 * - ARIA roles and attributes
 * - Semantic HTML elements
 * - Form label associations
 * - Live regions
 * - Landmark regions
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { TabsComponent, Tab } from '../components/tabs/tabs.component';
import { ButtonComponent } from '../shared/button/button.component';

// Test container component
@Component({
  selector: 'app-aria-compliance-test',
  standalone: true,
  imports: [CommonModule, TabsComponent, ButtonComponent],
  template: `
    <div class="aria-test-container">
      <!-- Navigation Landmark -->
      <nav role="navigation" aria-label="Main navigation">
        <a href="#main">Skip to main content</a>
      </nav>

      <!-- Main Landmark -->
      <main role="main" id="main">
        <h1>ARIA Compliance Test Suite</h1>

        <!-- Tabs with proper ARIA -->
        <section aria-labelledby="tabs-heading">
          <h2 id="tabs-heading">Tabbed Interface</h2>
          <app-tabs
            [tabs]="tabs"
            [activeIndex]="activeTabIndex"
            (activeIndexChange)="activeTabIndex = $event"
          >
            <div tab-settings>
              <h3 id="settings-panel-title">Settings Panel</h3>
              <form aria-labelledby="settings-panel-title">
                <div>
                  <label for="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    aria-label="Username"
                    aria-describedby="username-help"
                  />
                  <small id="username-help">Enter your username</small>
                </div>

                <div>
                  <label for="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    aria-label="Email address"
                    aria-describedby="email-help"
                    aria-invalid="false"
                  />
                  <small id="email-help">We'll never share your email</small>
                </div>

                <div role="alert" id="error-message" aria-live="polite" aria-atomic="true">
                  {{ errorMessage }}
                </div>

                <button type="submit" aria-label="Save settings">Save</button>
              </form>
            </div>

            <div tab-status>
              <h3>Status Information</h3>
              <div role="status" aria-live="polite" aria-atomic="true">
                {{ statusMessage }}
              </div>
              <div role="status" aria-live="assertive">
                {{ criticalMessage }}
              </div>
            </div>

            <div tab-help>
              <h3>Help & Support</h3>
              <div role="complementary" aria-label="Help information">
                <p>This is supplementary content.</p>
              </div>
            </div>
          </app-tabs>
        </section>

        <!-- Button Group with proper ARIA -->
        <section aria-labelledby="buttons-heading">
          <h2 id="buttons-heading">Button Controls</h2>
          <div role="group" aria-labelledby="buttons-heading">
            <button
              id="delete-btn"
              type="button"
              aria-label="Delete item (destructive action)"
              aria-disabled="false"
            >
              Delete
            </button>
            <app-button
              id="save-btn"
              ariaLabel="Save changes"
            >
              Save
            </app-button>
            <app-button
              id="cancel-btn"
              ariaLabel="Cancel operation"
            >
              Cancel
            </app-button>
          </div>
        </section>

        <!-- Status/Loading indicators -->
        <section aria-labelledby="status-heading">
          <h2 id="status-heading">Loading States</h2>
          <app-button
            id="loading-btn"
            [loading]="isLoading"
            [ariaLabel]="isLoading ? 'Loading, please wait' : 'Load data'"
            [attr.aria-busy]="isLoading"
          >
            {{ isLoading ? 'Loading...' : 'Load Data' }}
          </app-button>
        </section>

        <!-- Form with proper labels -->
        <section aria-labelledby="form-heading">
          <h2 id="form-heading">Form Fields</h2>
          <form id="test-form">
            <fieldset>
              <legend>Personal Information</legend>

              <label for="first-name">First Name *</label>
              <input
                id="first-name"
                type="text"
                required
                aria-required="true"
                aria-describedby="firstname-hint"
              />
              <span id="firstname-hint">Required field</span>

              <label for="last-name">Last Name *</label>
              <input
                id="last-name"
                type="text"
                required
                aria-required="true"
              />

              <label>
                <input type="checkbox" id="agree-terms" />
                I agree to the terms
              </label>
            </fieldset>

            <fieldset>
              <legend>Preferences</legend>

              <label>
                <input type="radio" name="preference" value="opt1" />
                Option 1
              </label>

              <label>
                <input type="radio" name="preference" value="opt2" />
                Option 2
              </label>
            </fieldset>
          </form>
        </section>

        <!-- Error Messages -->
        <section aria-labelledby="error-heading">
          <h2 id="error-heading">Error Handling</h2>
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            id="validation-error"
          >
            <p *ngIf="hasError">{{ errorDetails }}</p>
          </div>
        </section>

        <!-- Landmarks Test -->
        <aside role="complementary" aria-label="Related content">
          <h3>Related Information</h3>
          <p>Sidebar content goes here</p>
        </aside>
      </main>

      <!-- Footer -->
      <footer role="contentinfo">
        <p>&copy; 2024 Test Application</p>
      </footer>
    </div>
  `,
  styles: [`
    .aria-test-container {
      padding: 2rem;
    }

    section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      width: 100%;
      max-width: 300px;
    }

    small {
      display: block;
      margin-top: 0.25rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    fieldset {
      border: 1px solid #e5e7eb;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    legend {
      font-weight: bold;
      padding: 0 0.5rem;
    }

    button {
      padding: 0.5rem 1rem;
      margin-right: 0.5rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    [role="alert"] {
      padding: 1rem;
      background-color: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      color: #c33;
    }

    [role="status"] {
      padding: 1rem;
      background-color: #efe;
      border: 1px solid #cfc;
      border-radius: 4px;
      color: #3c3;
    }
  `],
})
export class AriaComplianceTestComponent {
  tabs: Tab[] = [
    { id: 'settings', label: 'Settings', index: 0 },
    { id: 'status', label: 'Status', index: 1 },
    { id: 'help', label: 'Help', index: 2 },
  ];

  activeTabIndex = 0;
  isLoading = false;
  errorMessage = '';
  statusMessage = 'All systems operational';
  criticalMessage = '';
  hasError = false;
  errorDetails = '';
}

describe('ARIA Compliance Tests', () => {
  let component: AriaComplianceTestComponent;
  let fixture: ComponentFixture<AriaComplianceTestComponent>;
  let container: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AriaComplianceTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AriaComplianceTestComponent);
    component = fixture.componentInstance;
    container = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Landmark Regions', () => {
    it('should have main landmark', () => {
      const main = container.querySelector('main[role="main"]');
      expect(main).toBeTruthy();
    });

    it('should have navigation landmark', () => {
      const nav = container.querySelector('nav[role="navigation"]');
      expect(nav).toBeTruthy();
    });

    it('should have contentinfo landmark', () => {
      const footer = container.querySelector('footer[role="contentinfo"]');
      expect(footer).toBeTruthy();
    });

    it('should have complementary landmark', () => {
      const aside = container.querySelector('aside[role="complementary"]');
      expect(aside).toBeTruthy();
    });

    it('should have complementary landmark with aria-label', () => {
      const complementary = container.querySelector('[role="complementary"]');
      const ariaLabel = complementary?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(['Related content', 'Help information'].includes(ariaLabel || '')).toBe(true);
    });

    it('should have skip-to-main link', () => {
      const skipLink = container.querySelector('a[href="#main"]');
      expect(skipLink).toBeTruthy();
      expect(skipLink?.textContent).toContain('Skip to main content');
    });
  });

  describe('Tab Component ARIA', () => {
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
      const firstTab = container.querySelector('[role="tab"]');
      const ariaControls = firstTab?.getAttribute('aria-controls');

      expect(ariaControls).toBeTruthy();
      const panel = container.querySelector(`#${ariaControls}`);
      expect(panel).toBeTruthy();
    });

    it('should have tabpanel role', () => {
      const panels = container.querySelectorAll('[role="tabpanel"]');
      expect(panels.length).toBeGreaterThanOrEqual(3);
    });

    it('should have aria-labelledby on tabpanels', () => {
      const panels = container.querySelectorAll('[role="tabpanel"]');
      let hasAriaLabelledBy = false;

      panels.forEach(panel => {
        if (panel.hasAttribute('aria-labelledby')) {
          hasAriaLabelledBy = true;
        }
      });

      expect(hasAriaLabelledBy).toBe(true);
    });
  });

  describe('Form Labels', () => {
    it('should have labels for all inputs', () => {
      const inputs = container.querySelectorAll('input[type="text"], input[type="email"]');
      let allHaveLabels = true;

      inputs.forEach(input => {
        const id = input.getAttribute('id');
        const label = id ? container.querySelector(`label[for="${id}"]`) : null;

        if (!label && !input.hasAttribute('aria-label')) {
          allHaveLabels = false;
        }
      });

      expect(allHaveLabels).toBe(true);
    });

    it('should associate labels with inputs via for attribute', () => {
      const usernameLabel = container.querySelector('label[for="username"]');
      expect(usernameLabel).toBeTruthy();

      const usernameInput = container.querySelector('#username');
      expect(usernameInput).toBeTruthy();
    });

    it('should have aria-describedby linking help text', () => {
      const input = container.querySelector('#username') as HTMLElement;
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();
      const helpText = container.querySelector(`#${describedBy}`);
      expect(helpText).toBeTruthy();
    });

    it('should mark required fields with aria-required', () => {
      const requiredInputs = container.querySelectorAll('input[aria-required="true"]');
      expect(requiredInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Button Accessibility', () => {
    it('should have aria-label on buttons', () => {
      const deleteBtn = container.querySelector('#delete-btn');
      expect(deleteBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on app-button components', () => {
      const appButton = container.querySelector('#save-btn');
      expect(appButton).toBeTruthy();
      // The app-button should have aria-label passed through
      const nativeBtn = appButton?.querySelector('button');
      expect(nativeBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-disabled attribute', () => {
      const button = container.querySelector('#delete-btn');
      expect(button?.hasAttribute('aria-disabled')).toBe(true);
    });

    it('should support button groups with aria-label', () => {
      const group = container.querySelector('[role="group"]');
      expect(group?.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('should have aria-label for destructive actions', () => {
      const deleteBtn = container.querySelector('#delete-btn');
      const label = deleteBtn?.getAttribute('aria-label');
      expect(label).toContain('destructive');
    });
  });

  describe('Live Regions (Status/Alert)', () => {
    it('should have role="status" for status messages', () => {
      const status = container.querySelector('[role="status"]');
      expect(status).toBeTruthy();
    });

    it('should have aria-live="polite" for status updates', () => {
      const status = container.querySelector('[role="status"][aria-live="polite"]');
      expect(status).toBeTruthy();
    });

    it('should have aria-live="assertive" for critical messages', () => {
      const alert = container.querySelector('[role="status"][aria-live="assertive"]');
      expect(alert).toBeTruthy();
    });

    it('should have role="alert" for error messages', () => {
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    it('should have aria-atomic for live regions', () => {
      const status = container.querySelector('[role="status"][aria-atomic="true"]');
      expect(status).toBeTruthy();
    });

    it('should update live region content', () => {
      const status = container.querySelector('[role="status"]');
      expect(status?.textContent).toContain('All systems operational');

      // Update the status
      component.statusMessage = 'New status message';
      fixture.detectChanges();

      expect(status?.textContent).toContain('New status message');
    });
  });

  describe('Loading States', () => {
    it('should set aria-busy when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const btn = container.querySelector('#loading-btn');
      expect(btn?.getAttribute('aria-busy')).toBe('true');
    });

    it('should update aria-label during loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const btn = container.querySelector('#loading-btn');
      const label = btn?.getAttribute('aria-label') || btn?.querySelector('button')?.getAttribute('aria-label');
      expect(label).toContain('Loading');
    });

    it('should clear aria-busy when done loading', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const btn = container.querySelector('#loading-btn');
      expect(btn?.getAttribute('aria-busy')).toBe('false');
    });
  });

  describe('Error Handling', () => {
    it('should display error in alert role', () => {
      component.hasError = true;
      component.errorDetails = 'Username is required';
      fixture.detectChanges();

      const alert = container.querySelector('#validation-error');
      const textContent = alert?.textContent?.trim();
      expect(textContent).toContain('Username is required');
    });

    it('should have aria-live="assertive" on error alerts', () => {
      const validationError = container.querySelector('#validation-error');
      expect(validationError?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-atomic on error alerts', () => {
      const validationError = container.querySelector('#validation-error');
      expect(validationError?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should mark invalid inputs', () => {
      const emailInput = container.querySelector('#email') as HTMLElement;
      expect(emailInput?.hasAttribute('aria-invalid')).toBe(true);
    });
  });

  describe('Form Structure', () => {
    it('should have fieldsets for grouped inputs', () => {
      const fieldsets = container.querySelectorAll('fieldset');
      expect(fieldsets.length).toBeGreaterThanOrEqual(2);
    });

    it('should have legends for fieldsets', () => {
      const legends = container.querySelectorAll('legend');
      expect(legends.length).toBeGreaterThanOrEqual(2);
    });

    it('should have legend with meaningful text', () => {
      const legend = container.querySelector('legend');
      expect(legend?.textContent).toContain('Personal Information');
    });

    it('should support radio button groups', () => {
      const radios = container.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBeGreaterThanOrEqual(2);

      // All radios should have same name
      const names = Array.from(radios).map(r => (r as HTMLInputElement).name);
      expect(names.every(n => n === names[0])).toBe(true);
    });

    it('should support checkboxes', () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic h1 for main heading', () => {
      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toContain('ARIA Compliance Test Suite');
    });

    it('should use semantic h2 for section headings', () => {
      const h2s = container.querySelectorAll('h2');
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should use semantic h3 for subsection headings', () => {
      const h3s = container.querySelectorAll('h3');
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should use semantic nav for navigation', () => {
      const nav = container.querySelector('nav');
      expect(nav).toBeTruthy();
    });

    it('should use semantic main for main content', () => {
      const main = container.querySelector('main');
      expect(main).toBeTruthy();
    });

    it('should use semantic footer for footer', () => {
      const footer = container.querySelector('footer');
      expect(footer).toBeTruthy();
    });

    it('should use semantic aside for sidebar', () => {
      const aside = container.querySelector('aside');
      expect(aside).toBeTruthy();
    });
  });

  describe('Section Labeling', () => {
    it('should label sections with aria-labelledby', () => {
      const sections = container.querySelectorAll('section[aria-labelledby]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have corresponding heading IDs', () => {
      const section = container.querySelector('section[aria-labelledby]');
      const labelId = section?.getAttribute('aria-labelledby');

      if (labelId) {
        const heading = container.querySelector(`#${labelId}`);
        expect(heading).toBeTruthy();
      }
    });

    it('should label form with aria-labelledby', () => {
      const form = container.querySelector('form[aria-labelledby]');
      expect(form).toBeTruthy();
    });
  });
});
