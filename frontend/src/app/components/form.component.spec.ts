import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormComponent } from './form.component';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormComponent, ReactiveFormsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should accept required formGroup input', () => {
    const form = fb.group({ name: [''] });
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    expect(component.formGroup()).toBe(form);
  });

  it('should have default submit label', () => {
    const form = fb.group({});
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    expect(component.submitLabel()).toBe('Submit');
  });

  it('should accept custom submit label', () => {
    const form = fb.group({});
    fixture.componentRef.setInput('formGroup', form);
    fixture.componentRef.setInput('submitLabel', 'Save');
    fixture.detectChanges();
    expect(component.submitLabel()).toBe('Save');
  });

  it('should have form element', () => {
    const form = fb.group({});
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    const formEl = fixture.nativeElement.querySelector('form');
    expect(formEl).toBeTruthy();
  });

  it('should bind formGroup to form element', () => {
    const form = fb.group({ test: ['value'] });
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    const formEl = fixture.nativeElement.querySelector('form');
    expect(formEl).toBeTruthy();
  });

  it('should have space-y-4 class for layout', () => {
    const form = fb.group({});
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    const formEl = fixture.nativeElement.querySelector('form');
    expect(formEl.className).toContain('space-y-4');
  });

  it('should render submit button', () => {
    const form = fb.group({});
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button).toBeTruthy();
  });

  it('should disable submit button when form invalid', () => {
    const form = fb.group({ email: ['', Validators.required] });
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('should enable submit button when form valid', () => {
    const form = fb.group({ email: ['test@example.com'] });
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(false);
  });

  it('should emit formSubmit event on submit', () => {
    const form = fb.group({ name: ['John'] });
    fixture.componentRef.setInput('formGroup', form);
    fixture.detectChanges();

    let emitted: any;
    component.formSubmit.subscribe(value => {
      emitted = value;
    });

    const formEl = fixture.nativeElement.querySelector('form');
    formEl.dispatchEvent(new Event('ngSubmit'));

    expect(emitted).toBeDefined();
    expect(emitted.name).toBe('John');
  });
});
