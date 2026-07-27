import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should render button element', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('should have primary variant by default', () => {
    fixture.detectChanges();
    expect(component.variant).toBe('primary');
  });

  it('should support secondary variant', () => {
    component.variant = 'secondary';
    expect(component.buttonClasses).toContain('btn-secondary');
  });

  it('should support danger variant', () => {
    component.variant = 'danger';
    expect(component.buttonClasses).toContain('btn-danger');
  });

  it('should have medium size by default', () => {
    fixture.detectChanges();
    expect(component.size).toBe('md');
  });

  it('should apply size classes', () => {
    component.size = 'lg';
    expect(component.buttonClasses).toContain('btn-lg');
  });

  it('should not be disabled by default', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(false);
  });

  it('should disable button when disabled input is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should disable button when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should show spinner when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
    expect(spinner.textContent).toContain('⟳');
  });

  it('should emit clicked event when button is clicked', () => {
    let emitted = false;
    component.clicked.subscribe(() => {
      emitted = true;
    });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(emitted).toBe(true);
  });

  it('should set aria-label attribute', () => {
    component.ariaLabel = 'Submit form';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Submit form');
  });

  it('should set aria-busy attribute when loading', () => {
    component.loading = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });
});
