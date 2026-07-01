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

  it('should have OnPush change detection', () => {
    const metadata = (BadgeComponent as any).ɵcmp;
    expect(metadata.changeDetection).toBe(0);
  });

  it('should render default label', () => {
    expect(fixture.nativeElement.textContent).toContain('Badge');
  });

  it('should render custom label', () => {
    component.label = 'Active';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Active');
  });

  it('should have base badge class', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.badge')).toBeTruthy();
  });

  it('should apply variant class', () => {
    component.variant = 'success';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Active');
    const classes = component.getClasses();
    expect(classes).toContain('badge-success');
  });

  it('should compute correct CSS classes', () => {
    component.variant = 'warning';
    const classes = component.getClasses();
    expect(classes).toContain('badge');
    expect(classes).toContain('badge-warning');
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

  variants.forEach(variant => {
    it(`should render ${variant} variant`, () => {
      component.variant = variant;
      const classes = component.getClasses();
      expect(classes).toContain(`badge-${variant}`);
    });
  });
});
