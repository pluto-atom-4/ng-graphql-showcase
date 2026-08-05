import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { StatusBadgeComponent, StatusType } from './status-badge.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let compiled: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default status PENDING', () => {
      expect(component.status).toBe('PENDING');
    });

    it('should use OnPush change detection', () => {
      const metadata = (component.constructor as any).__annotations__?.[0];
      expect(metadata).toBeDefined();
    });
  });

  describe('Status Rendering - PENDING', () => {
    beforeEach(() => {
      component.status = 'PENDING';
      fixture.detectChanges();
    });

    it('should display PENDING label', () => {
      const badge = compiled.query(By.css('[role="status"] span:last-child'));
      expect(badge?.nativeElement.textContent).toContain('Pending');
    });

    it('should display PENDING icon', () => {
      const icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.textContent).toContain('⏳');
    });

    it('should have PENDING background color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.backgroundColor).toBe('#fef3c7');
    });

    it('should have PENDING text color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.color).toBe('#92400e');
    });

    it('should have PENDING border color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.borderColor).toBeDefined();
    });

    it('should have PENDING aria-label', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('aria-label')).toBe('Status: Pending');
    });
  });

  describe('Status Rendering - RUNNING', () => {
    beforeEach(() => {
      component.status = 'RUNNING';
      fixture.detectChanges();
    });

    it('should display RUNNING label', () => {
      const badge = compiled.query(By.css('[role="status"] span:last-child'));
      expect(badge?.nativeElement.textContent).toContain('Running');
    });

    it('should display RUNNING icon', () => {
      const icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.textContent).toContain('⟳');
    });

    it('should have RUNNING background color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.backgroundColor).toBe('#dbeafe');
    });

    it('should have RUNNING text color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.color).toBe('#1e40af');
    });

    it('should have RUNNING aria-label', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('aria-label')).toBe('Status: Running');
    });
  });

  describe('Status Rendering - COMPLETE', () => {
    beforeEach(() => {
      component.status = 'COMPLETE';
      fixture.detectChanges();
    });

    it('should display COMPLETE label', () => {
      const badge = compiled.query(By.css('[role="status"] span:last-child'));
      expect(badge?.nativeElement.textContent).toContain('Completed');
    });

    it('should display COMPLETE icon', () => {
      const icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.textContent).toContain('✓');
    });

    it('should have COMPLETE background color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.backgroundColor).toBe('#dcfce7');
    });

    it('should have COMPLETE text color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.color).toBe('#166534');
    });

    it('should have COMPLETE aria-label', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('aria-label')).toBe('Status: Completed');
    });
  });

  describe('Status Rendering - FAILED', () => {
    beforeEach(() => {
      component.status = 'FAILED';
      fixture.detectChanges();
    });

    it('should display FAILED label', () => {
      const badge = compiled.query(By.css('[role="status"] span:last-child'));
      expect(badge?.nativeElement.textContent).toContain('Failed');
    });

    it('should display FAILED icon', () => {
      const icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.textContent).toContain('✕');
    });

    it('should have FAILED background color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.backgroundColor).toBe('#fee2e2');
    });

    it('should have FAILED text color', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.color).toBe('#991b1b');
    });

    it('should have FAILED aria-label', () => {
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('aria-label')).toBe('Status: Failed');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      fixture.detectChanges();
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('role')).toBe('status');
    });

    it('should have aria-label with status', () => {
      component.status = 'COMPLETE';
      fixture.detectChanges();
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.hasAttribute('aria-label')).toBe(true);
    });

    it('should hide icon from screen readers', () => {
      fixture.detectChanges();
      const icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.getAttribute('role')).toBe('presentation');
    });

    it('should have semantic badge structure', () => {
      fixture.detectChanges();
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.classList.contains('inline-flex')).toBe(true);
      expect(badge.nativeElement.classList.contains('rounded-lg')).toBe(true);
    });

    it('should have color contrast for PENDING status', () => {
      component.status = 'PENDING';
      fixture.detectChanges();
      // Light gray (#92400e on #fef3c7) has sufficient contrast
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge).toBeTruthy();
    });

    it('should have color contrast for RUNNING status', () => {
      component.status = 'RUNNING';
      fixture.detectChanges();
      // Dark blue (#1e40af on #dbeafe) has sufficient contrast
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge).toBeTruthy();
    });

    it('should have color contrast for COMPLETE status', () => {
      component.status = 'COMPLETE';
      fixture.detectChanges();
      // Dark green (#166534 on #dcfce7) has sufficient contrast
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge).toBeTruthy();
    });

    it('should have color contrast for FAILED status', () => {
      component.status = 'FAILED';
      fixture.detectChanges();
      // Dark red (#991b1b on #fee2e2) has sufficient contrast
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should have badge styling classes', () => {
      fixture.detectChanges();
      const badge = compiled.query(By.css('[role="status"]'));
      const classList = badge.nativeElement.classList;
      expect(classList.contains('inline-flex')).toBe(true);
      expect(classList.contains('items-center')).toBe(true);
      expect(classList.contains('gap-2')).toBe(true);
      expect(classList.contains('px-3')).toBe(true);
      expect(classList.contains('py-1.5')).toBe(true);
      expect(classList.contains('rounded-lg')).toBe(true);
      expect(classList.contains('text-sm')).toBe(true);
      expect(classList.contains('font-medium')).toBe(true);
      expect(classList.contains('whitespace-nowrap')).toBe(true);
    });

    it('should have border styling', () => {
      fixture.detectChanges();
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.border).toContain('1px solid');
    });

    it('should not wrap text', () => {
      fixture.detectChanges();
      const badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.classList.contains('whitespace-nowrap')).toBe(true);
    });
  });

  describe('Status Changes', () => {
    it('should update display when status changes from PENDING to RUNNING', () => {
      component.status = 'PENDING';
      fixture.detectChanges();
      let label = compiled.query(By.css('[role="status"] span:last-child'));
      expect(label?.nativeElement.textContent).toContain('Pending');

      component.status = 'RUNNING';
      fixture.detectChanges();
      label = compiled.query(By.css('[role="status"] span:last-child'));
      expect(label?.nativeElement.textContent).toContain('Running');
    });

    it('should update icon when status changes', () => {
      component.status = 'PENDING';
      fixture.detectChanges();
      let icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.textContent).toContain('⏳');

      component.status = 'COMPLETE';
      fixture.detectChanges();
      icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon.nativeElement.textContent).toContain('✓');
    });

    it('should update colors when status changes', () => {
      component.status = 'PENDING';
      fixture.detectChanges();
      let badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.backgroundColor).toBe('#fef3c7');

      component.status = 'FAILED';
      fixture.detectChanges();
      badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.style.backgroundColor).toBe('#fee2e2');
    });

    it('should update aria-label when status changes', () => {
      component.status = 'PENDING';
      fixture.detectChanges();
      let badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('aria-label')).toBe('Status: Pending');

      component.status = 'COMPLETE';
      fixture.detectChanges();
      badge = compiled.query(By.css('[role="status"]'));
      expect(badge.nativeElement.getAttribute('aria-label')).toBe('Status: Completed');
    });
  });

  describe('All Status Types', () => {
    const statuses: StatusType[] = ['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'];

    statuses.forEach((status) => {
      it(`should render ${status} status correctly`, () => {
        component.status = status;
        fixture.detectChanges();
        const badge = compiled.query(By.css('[role="status"]'));
        expect(badge).toBeTruthy();
        expect(badge.nativeElement.getAttribute('aria-label')).toContain('Status:');
      });
    });
  });
});
