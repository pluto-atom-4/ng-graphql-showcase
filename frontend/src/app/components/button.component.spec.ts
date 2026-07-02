import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ButtonComponent, ButtonVariant, ButtonSize } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let buttonEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    buttonEl = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Signals', () => {
    it('should render default label', () => {
      expect(buttonEl.nativeElement.textContent).toContain('Button');
    });

    it('should render custom label', () => {
      fixture.componentRef.setInput('label', 'Click Me');
      fixture.detectChanges();
      expect(buttonEl.nativeElement.textContent).toContain('Click Me');
    });

    it('should apply default variant class (primary)', () => {
      fixture.detectChanges();
      expect(buttonEl.nativeElement.className).toContain('btn-primary');
    });

    it('should apply custom variant class', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();
      expect(buttonEl.nativeElement.className).toContain('btn-secondary');
    });

    it('should apply custom size class', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      expect(buttonEl.nativeElement.className).toContain('btn-lg');
    });

    it('should not apply size class for md (default)', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      expect(buttonEl.nativeElement.className).not.toContain('btn-md');
    });

    it('should show spinner when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      const spinner = buttonEl.nativeElement.querySelector('.loading');
      expect(spinner).toBeTruthy();
    });

    it('should hide label when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(buttonEl.nativeElement.textContent).not.toContain('Button');
    });
  });

  describe('Computed Signals', () => {
    it('should compute isDisabled from disabled input', () => {
      fixture.componentRef.setInput('disabled', true);
      expect(component.isDisabled()).toBe(true);
    });

    it('should compute isDisabled from loading input', () => {
      fixture.componentRef.setInput('loading', true);
      expect(component.isDisabled()).toBe(true);
    });

    it('should compute isDisabled as OR of both inputs', () => {
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      expect(component.isDisabled()).toBe(false);

      fixture.componentRef.setInput('disabled', true);
      expect(component.isDisabled()).toBe(true);

      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', true);
      expect(component.isDisabled()).toBe(true);
    });

    it('should set disabled attribute when isDisabled is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(buttonEl.nativeElement.disabled).toBe(true);
    });

    it('should remove disabled attribute when isDisabled is false', () => {
      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();
      expect(buttonEl.nativeElement.disabled).toBe(false);
    });

    it('should compute correct CSS classes', () => {
      fixture.componentRef.setInput('variant', 'accent');
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      const classes = component.classes();
      expect(classes).toContain('btn');
      expect(classes).toContain('font-semibold');
      expect(classes).toContain('btn-accent');
      expect(classes).toContain('btn-sm');
    });
  });

  describe('Output Events', () => {
    it('should emit trigger when clicked', () => {
      let emitted = false;
      component.trigger.subscribe(() => {
        emitted = true;
      });
      buttonEl.nativeElement.click();
      expect(emitted).toBe(true);
    });

    it('should not emit trigger when disabled', () => {
      let emitted = false;
      component.trigger.subscribe(() => {
        emitted = true;
      });
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      buttonEl.nativeElement.click();
      expect(emitted).toBe(false);
    });

    it('should not emit trigger when loading', () => {
      let emitted = false;
      component.trigger.subscribe(() => {
        emitted = true;
      });
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      buttonEl.nativeElement.click();
      expect(emitted).toBe(false);
    });
  });


  describe('Variant Types', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'ghost', 'outline'];

    variants.forEach(variant => {
      it(`should render ${variant} variant`, () => {
        fixture.componentRef.setInput('variant', variant);
        fixture.detectChanges();
        expect(buttonEl.nativeElement.className).toContain(`btn-${variant}`);
      });
    });
  });

  describe('Size Types', () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];

    sizes.forEach(size => {
      it(`should render ${size} size`, () => {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();

        if (size !== 'md') {
          expect(buttonEl.nativeElement.className).toContain(`btn-${size}`);
        } else {
          expect(buttonEl.nativeElement.className).not.toContain('btn-md');
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple state changes reactively', () => {
      let emitCount = 0;
      component.trigger.subscribe(() => {
        emitCount++;
      });

      // Initial state: clickable
      buttonEl.nativeElement.click();
      expect(emitCount).toBe(1);

      // Disable button
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      buttonEl.nativeElement.click();
      expect(emitCount).toBe(1);

      // Re-enable button
      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();
      buttonEl.nativeElement.click();
      expect(emitCount).toBe(2);
    });

    it('should update all signal-derived values when inputs change', () => {
      fixture.componentRef.setInput('label', 'Save');
      fixture.componentRef.setInput('variant', 'primary');
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('disabled', false);

      fixture.detectChanges();

      expect(buttonEl.nativeElement.textContent).toContain('Save');
      expect(component.isDisabled()).toBe(false);
      expect(component.classes()).toContain('btn-primary');
      expect(component.classes()).toContain('btn-lg');
    });
  });
});
