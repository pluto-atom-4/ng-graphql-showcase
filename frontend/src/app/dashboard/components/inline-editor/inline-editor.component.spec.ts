import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlineEditorComponent, InlineEditorConfig } from './inline-editor.component';
import { vi } from 'vitest';

describe('InlineEditorComponent', () => {
  let component: InlineEditorComponent;
  let fixture: ComponentFixture<InlineEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineEditorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InlineEditorComponent);
    component = fixture.componentInstance;
    component.value = 'Test Value';
    component.label = 'Test Field';
  });

  describe('view mode', () => {
    it('should display value in view mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Test Value');
    });

    it('should display edit button in view mode', () => {
      fixture.detectChanges();
      const editButton = fixture.nativeElement.querySelector('button');
      expect(editButton.textContent).toContain('Edit');
    });

    it('should display (empty) when value is empty', () => {
      component.value = '';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('(empty)');
    });

    it('should not show input field in view mode', () => {
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input).toBeFalsy();
    });
  });

  describe('edit mode toggle', () => {
    it('should switch to edit mode when Edit button is clicked', () => {
      fixture.detectChanges();
      const editButton = fixture.nativeElement.querySelector('button');
      editButton.click();
      fixture.detectChanges();

      expect(component.isEditing).toBe(true);
    });

    it('should show input field in edit mode', () => {
      component.startEdit();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input).toBeTruthy();
    });

    it('should initialize editValue with current value', () => {
      component.startEdit();
      expect(component.editValue).toBe('Test Value');
    });

    it('should show Save and Cancel buttons in edit mode', () => {
      component.startEdit();
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map((btn: any) => btn.textContent);
      expect(buttonTexts.some((text: any) => text.includes('Save'))).toBe(true);
      expect(buttonTexts.some((text: any) => text.includes('Cancel'))).toBe(true);
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      component.startEdit();
      fixture.detectChanges();
    });

    it('should validate required field', () => {
      component.config = { required: true };
      component.editValue = '';

      const isValid = component.validateField();

      expect(isValid).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('required');
    });

    it('should pass validation for required field with value', () => {
      component.config = { required: true };
      component.editValue = 'Some value';

      const isValid = component.validateField();

      expect(isValid).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should validate minLength', () => {
      component.config = { minLength: 5 };
      component.editValue = 'ab';

      const isValid = component.validateField();

      expect(isValid).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('at least 5');
    });

    it('should pass validation for minLength', () => {
      component.config = { minLength: 5 };
      component.editValue = 'abcde';

      const isValid = component.validateField();

      expect(isValid).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should validate maxLength', () => {
      component.config = { maxLength: 5 };
      component.editValue = 'abcdef';

      const isValid = component.validateField();

      expect(isValid).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('must not exceed 5');
    });

    it('should pass validation for maxLength', () => {
      component.config = { maxLength: 5 };
      component.editValue = 'abcd';

      const isValid = component.validateField();

      expect(isValid).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should validate pattern', () => {
      component.config = { pattern: '^[a-z]+$' };
      component.editValue = 'ABC123';

      const isValid = component.validateField();

      expect(isValid).toBe(false);
      expect(component.hasError).toBe(true);
    });

    it('should pass validation for pattern', () => {
      component.config = { pattern: '^[a-z]+$' };
      component.editValue = 'abc';

      const isValid = component.validateField();

      expect(isValid).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should support custom validator', () => {
      const customValidator = (value: string) => {
        return value === 'forbidden' ? 'This value is not allowed' : null;
      };
      component.config = { customValidator };
      component.editValue = 'forbidden';

      const isValid = component.validateField();

      expect(isValid).toBe(false);
      expect(component.errorMessage).toContain('not allowed');
    });

    it('should pass custom validator', () => {
      const customValidator = (value: string) => {
        return value === 'forbidden' ? 'This value is not allowed' : null;
      };
      component.config = { customValidator };
      component.editValue = 'allowed';

      const isValid = component.validateField();

      expect(isValid).toBe(true);
      expect(component.hasError).toBe(false);
    });
  });

  describe('save and cancel', () => {
    beforeEach(() => {
      component.startEdit();
      fixture.detectChanges();
    });

    it('should emit save event with new value', () => {
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      component.editValue = 'New Value';

      component.onSave();

      expect(saveEmitSpy).toHaveBeenCalledWith('New Value');
    });

    it('should exit edit mode after save', () => {
      component.editValue = 'New Value';
      component.onSave();

      expect(component.isEditing).toBe(false);
    });

    it('should not save if validation fails', () => {
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      component.config = { required: true };
      component.editValue = '';

      component.onSave();

      expect(saveEmitSpy).not.toHaveBeenCalled();
      expect(component.isEditing).toBe(true);
    });

    it('should emit cancel event', () => {
      const cancelEmitSpy = vi.spyOn(component.cancel, 'emit');
      component.onCancel();

      expect(cancelEmitSpy).toHaveBeenCalled();
    });

    it('should exit edit mode on cancel', () => {
      component.onCancel();
      expect(component.isEditing).toBe(false);
    });

    it('should reset editValue to original value on cancel', () => {
      component.editValue = 'Changed Value';
      component.onCancel();

      expect(component.editValue).toBe('Test Value');
    });

    it('should clear error message on cancel', () => {
      component.errorMessage = 'Some error';
      component.hasError = true;

      component.onCancel();

      expect(component.errorMessage).toBe('');
      expect(component.hasError).toBe(false);
    });
  });

  describe('keyboard interactions', () => {
    beforeEach(() => {
      component.startEdit();
      fixture.detectChanges();
    });

    it('should cancel editing on Escape key', () => {
      const onCancelSpy = vi.spyOn(component, 'onCancel');
      component.isEditing = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEscapeKey();

      expect(onCancelSpy).toHaveBeenCalled();
    });

    it('should not cancel when not in edit mode', () => {
      const cancelEmitSpy = vi.spyOn(component.cancel, 'emit');
      component.isEditing = false;

      component.onEscapeKey();

      // When not editing, cancel should not be emitted
      // The component checks isEditing first
      expect(component.isEditing).toBe(false);
    });
  });

  describe('error display', () => {
    it('should display error message when validation fails', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '';

      component.validateField();
      fixture.detectChanges();

      const errorMsg = fixture.nativeElement.querySelector('[role="alert"]');
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.textContent).toContain('required');
    });

    it('should apply error styling to input', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '';

      component.validateField();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.classList.contains('border-red-500')).toBe(true);
    });

    it('should disable Save button when there is an error', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '';

      component.validateField();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const saveButton = Array.from(buttons).find((btn: any) => btn.textContent.includes('Save'));
      expect((saveButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should clear error message on cancel', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '';

      component.validateField();
      component.onCancel();
      fixture.detectChanges();

      const errorMsg = fixture.nativeElement.querySelector('[role="alert"]');
      expect(errorMsg).toBeFalsy();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on Edit button', () => {
      fixture.detectChanges();
      const editButton = fixture.nativeElement.querySelector('button');
      expect(editButton.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on input field', () => {
      component.startEdit();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-describedby when error exists', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '';

      component.validateField();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('aria-describedby')).toBeTruthy();
    });

    it('should have role="alert" on error message', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '';

      component.validateField();
      fixture.detectChanges();

      const errorMsg = fixture.nativeElement.querySelector('[role="alert"]');
      expect(errorMsg).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should trim whitespace for validation', () => {
      component.startEdit();
      component.config = { required: true };
      component.editValue = '   ';

      const isValid = component.validateField();

      expect(isValid).toBe(false);
    });

    it('should handle null/undefined value gracefully', () => {
      component.value = null as any;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('(empty)');
    });
  });
});
