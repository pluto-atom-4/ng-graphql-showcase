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

  it('should apply correct badge classes', () => {
    component.status = 'RUNNING';
    const classes = component.badgeClasses;
    expect(classes).toContain('bg-[#dbeafe]');
    expect(classes).toContain('text-[#1e40af]');
  });

  it('should be standalone component', () => {
    expect(component).toBeTruthy();
  });
});
