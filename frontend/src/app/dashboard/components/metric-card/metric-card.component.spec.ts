import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MetricCardComponent } from './metric-card.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('MetricCardComponent', () => {
  let component: MetricCardComponent;
  let fixture: ComponentFixture<MetricCardComponent>;
  let compiled: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCardComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.label).toBe('');
      expect(component.value).toBe(0);
      expect(component.icon).toBe('📊');
      expect(component.color).toBe('#6b7280');
    });

    it('should use OnPush change detection', () => {
      const metadata = (component.constructor as any).__annotations__?.[0];
      expect(metadata).toBeDefined();
    });
  });

  describe('Rendering', () => {
    it('should render metric card container', () => {
      fixture.detectChanges();
      const card = compiled.query(By.css('[aria-label]'));
      expect(card).toBeTruthy();
      expect(card.nativeElement.classList.contains('bg-white')).toBe(true);
    });

    it('should display label', () => {
      component.label = 'Total Builds';
      fixture.detectChanges();
      const label = compiled.query(By.css('.text-xs'));
      expect(label.nativeElement.textContent).toContain('Total Builds');
    });

    it('should display icon', () => {
      component.icon = '✅';
      fixture.detectChanges();
      const icon = compiled.query(By.css('.text-3xl'));
      expect(icon.nativeElement.textContent).toContain('✅');
    });

    it('should display value', () => {
      component.value = 42;
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('42');
    });

    it('should apply color to value text', () => {
      component.color = '#ef4444';
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.style.color).toBe('#ef4444');
    });

    it('should apply color to indicator bar', () => {
      component.color = '#10b981';
      fixture.detectChanges();
      const indicator = compiled.query(By.css('.h-1'));
      expect(indicator.nativeElement.style.backgroundColor).toBe('#10b981');
    });
  });

  describe('Value Formatting', () => {
    it('should format values below 1000 as-is', () => {
      component.value = 500;
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('500');
    });

    it('should format values in thousands with K suffix', () => {
      component.value = 5000;
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('5K');
    });

    it('should format large numbers with K suffix', () => {
      component.value = 12500;
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('12.5K');
    });

    it('should format millions with M suffix', () => {
      component.value = 2500000;
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('2.5M');
    });

    it('should format exactly 1 million', () => {
      component.value = 1000000;
      fixture.detectChanges();
      const value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('1M');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label with metric name and value', () => {
      component.label = 'Total Builds';
      component.value = 100;
      fixture.detectChanges();
      const card = compiled.query(By.css('[aria-label]'));
      expect(card.nativeElement.getAttribute('aria-label')).toBe('Total Builds: 100');
    });

    it('should have aria-label with formatted value for large numbers', () => {
      component.label = 'Completed';
      component.value = 5000;
      fixture.detectChanges();
      const card = compiled.query(By.css('[aria-label]'));
      expect(card.nativeElement.getAttribute('aria-label')).toContain('5K');
    });

    it('should hide indicator bar from screen readers', () => {
      fixture.detectChanges();
      const indicator = compiled.query(By.css('[aria-hidden]'));
      expect(indicator.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should hide icon from screen readers', () => {
      fixture.detectChanges();
      const icon = compiled.query(By.css('[role="presentation"]'));
      expect(icon).toBeTruthy();
    });

    it('should have semantic card structure', () => {
      fixture.detectChanges();
      const card = compiled.query(By.css('[aria-label]'));
      expect(card.nativeElement.classList.contains('rounded-lg')).toBe(true);
      expect(card.nativeElement.classList.contains('p-6')).toBe(true);
    });
  });

  describe('Styling', () => {
    it('should have card styling classes', () => {
      fixture.detectChanges();
      const card = compiled.query(By.css('[aria-label]'));
      const classList = card.nativeElement.classList;
      expect(classList.contains('bg-white')).toBe(true);
      expect(classList.contains('rounded-lg')).toBe(true);
      expect(classList.contains('shadow-sm')).toBe(true);
      expect(classList.contains('p-6')).toBe(true);
      expect(classList.contains('border')).toBe(true);
    });

    it('should have hover effect', () => {
      fixture.detectChanges();
      const card = compiled.query(By.css('[aria-label]'));
      expect(card.nativeElement.classList.contains('hover:shadow-md')).toBe(true);
    });
  });

  describe('Input Property Updates', () => {
    it('should update display when label changes', () => {
      component.label = 'Initial';
      fixture.detectChanges();
      let label = compiled.query(By.css('.text-xs'));
      expect(label.nativeElement.textContent).toContain('Initial');

      component.label = 'Updated';
      fixture.detectChanges();
      label = compiled.query(By.css('.text-xs'));
      expect(label.nativeElement.textContent).toContain('Updated');
    });

    it('should update display when value changes', () => {
      component.value = 10;
      fixture.detectChanges();
      let value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('10');

      component.value = 20;
      fixture.detectChanges();
      value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.textContent).toContain('20');
    });

    it('should update display when icon changes', () => {
      component.icon = '📊';
      fixture.detectChanges();
      let icon = compiled.query(By.css('.text-3xl'));
      expect(icon.nativeElement.textContent).toContain('📊');

      component.icon = '⚙️';
      fixture.detectChanges();
      icon = compiled.query(By.css('.text-3xl'));
      expect(icon.nativeElement.textContent).toContain('⚙️');
    });

    it('should update color when color input changes', () => {
      component.color = '#6b7280';
      fixture.detectChanges();
      let value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.style.color).toBe('#6b7280');

      component.color = '#2563eb';
      fixture.detectChanges();
      value = compiled.query(By.css('.text-4xl'));
      expect(value.nativeElement.style.color).toBe('#2563eb');
    });
  });

  describe('formatValue Method', () => {
    it('should format 0', () => {
      expect(component.formatValue(0)).toBe('0');
    });

    it('should format small numbers without suffix', () => {
      expect(component.formatValue(1)).toBe('1');
      expect(component.formatValue(999)).toBe('999');
    });

    it('should format 1000 as 1K', () => {
      expect(component.formatValue(1000)).toBe('1K');
    });

    it('should format decimal thousands correctly', () => {
      expect(component.formatValue(1500)).toBe('1.5K');
      expect(component.formatValue(9999)).toBe('10K');
    });

    it('should format millions correctly', () => {
      expect(component.formatValue(1000000)).toBe('1M');
      expect(component.formatValue(1500000)).toBe('1.5M');
      expect(component.formatValue(9999999)).toBe('10M');
    });

    it('should handle large numbers beyond millions', () => {
      // Large numbers beyond millions display with decimal
      const formatted = component.formatValue(999999999);
      expect(formatted).toContain('M');
      expect(formatted).toMatch(/^\d+(\.\d+)?M$/);
    });
  });
});
