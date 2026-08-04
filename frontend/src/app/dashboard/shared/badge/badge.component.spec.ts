import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render badge with PENDING status', () => {
    component.status = 'PENDING';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Pending');
    expect(badge.textContent).toContain('⏳');
  });

  it('should render badge with RUNNING status', () => {
    component.status = 'RUNNING';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Running');
    expect(badge.textContent).toContain('⟳');
  });

  it('should render badge with COMPLETE status', () => {
    component.status = 'COMPLETE';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Completed');
    expect(badge.textContent).toContain('✓');
  });

  it('should render badge with FAILED status', () => {
    component.status = 'FAILED';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Failed');
    expect(badge.textContent).toContain('✕');
  });

  it('should have role status for accessibility', () => {
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.getAttribute('role')).toBe('status');
  });

  it('should set aria-label with status', () => {
    component.status = 'RUNNING';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.getAttribute('aria-label')).toContain('Running');
  });

  it('should use custom label if provided', () => {
    component.customLabel = 'Custom Status';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.getAttribute('aria-label')).toBe('Custom Status');
  });

  it('should return status config for current status', () => {
    component.status = 'COMPLETE';
    const config = component.statusConfig;
    expect(config.label).toBe('Completed');
    expect(config.icon).toBe('✓');
  });

  it('should apply correct inline styles for RUNNING status', () => {
    component.status = 'RUNNING';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.style.backgroundColor).toBe('#dbeafe');
    expect(badge.style.color).toBe('#1e40af');
  });

  it('should apply static Tailwind classes for layout', () => {
    component.status = 'RUNNING';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    const classList = badge.className;

    expect(classList).toContain('inline-flex');
    expect(classList).toContain('items-center');
    expect(classList).toContain('px-3');
    expect(classList).toContain('py-1.5');
    expect(classList).toContain('rounded-lg');
    expect(classList).toContain('text-sm');
    expect(classList).toContain('font-medium');
    expect(classList).toContain('whitespace-nowrap');
  });

  it('should apply correct inline styles for PENDING status', () => {
    component.status = 'PENDING';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.style.backgroundColor).toBe('#fef3c7');
    expect(badge.style.color).toBe('#92400e');
  });

  it('should apply correct inline styles for COMPLETE status', () => {
    component.status = 'COMPLETE';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.style.backgroundColor).toBe('#dcfce7');
    expect(badge.style.color).toBe('#166534');
  });

  it('should apply correct inline styles for FAILED status', () => {
    component.status = 'FAILED';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge.style.backgroundColor).toBe('#fee2e2');
    expect(badge.style.color).toBe('#991b1b');
  });

  it('should have computed background color matching status', () => {
    component.status = 'COMPLETE';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span');
    const computedStyle = window.getComputedStyle(badge);

    // Browser converts #dcfce7 to rgb(220, 252, 231), but test env may return hex
    const bgColorResult = computedStyle.backgroundColor;
    expect(
      bgColorResult === 'rgb(220, 252, 231)' || bgColorResult === '#dcfce7'
    ).toBe(true, `Expected rgb(220, 252, 231) or #dcfce7 but got ${bgColorResult}`);

    const textColorResult = computedStyle.color;
    expect(
      textColorResult === 'rgb(22, 101, 52)' || textColorResult === '#166534'
    ).toBe(true, `Expected rgb(22, 101, 52) or #166534 but got ${textColorResult}`);
  });

  it('should be standalone component', () => {
    expect(component).toBeTruthy();
  });
});
