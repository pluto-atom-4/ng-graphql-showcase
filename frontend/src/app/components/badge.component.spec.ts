import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent, BadgeVariant } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should render default label', () => {
    expect(fixture.nativeElement.textContent).toContain('Badge');
  });

  it('should render custom label', () => {
    fixture.componentRef.setInput('label', 'Active');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Active');
  });

  it('should have base badge class', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.badge-base')).toBeTruthy();
  });

  it('should apply variant class', () => {
    fixture.componentRef.setInput('variant', 'success');
    fixture.detectChanges();
    const classes = component.getClasses();
    expect(classes).toContain('bg-green-100');
    expect(classes).toContain('text-green-800');
  });

  it('should compute correct CSS classes', () => {
    fixture.componentRef.setInput('variant', 'warning');
    const classes = component.getClasses();
    expect(classes).toContain('badge-base');
    expect(classes).toContain('bg-yellow-100');
    expect(classes).toContain('text-yellow-800');
  });

  const variants: BadgeVariant[] = [
    'primary',
    'secondary',
    'accent',
    'ghost',
    'success',
    'warning',
    'error',
    'info',
  ];

  const variantColors: Record<BadgeVariant, [string, string]> = {
    'primary': ['bg-blue-100', 'text-blue-800'],
    'secondary': ['bg-gray-100', 'text-gray-800'],
    'accent': ['bg-purple-100', 'text-purple-800'],
    'ghost': ['bg-gray-50', 'text-gray-900'],
    'success': ['bg-green-100', 'text-green-800'],
    'warning': ['bg-yellow-100', 'text-yellow-800'],
    'error': ['bg-red-100', 'text-red-800'],
    'info': ['bg-blue-100', 'text-blue-800'],
  };

  variants.forEach(variant => {
    it(`should render ${variant} variant`, () => {
      fixture.componentRef.setInput('variant', variant);
      const classes = component.getClasses();
      const [bgColor, textColor] = variantColors[variant];
      expect(classes).toContain(bgColor);
      expect(classes).toContain(textColor);
    });
  });
});
