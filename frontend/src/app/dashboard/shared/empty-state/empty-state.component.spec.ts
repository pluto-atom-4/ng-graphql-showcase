import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should render with default values', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent).toContain('No data found');
  });

  it('should display custom title', () => {
    component.title = 'No builds available';
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent).toContain('No builds available');
  });

  it('should display custom description', () => {
    component.description = 'Create a new build to get started';
    fixture.detectChanges();
    const paragraph = fixture.nativeElement.querySelector('p');
    expect(paragraph.textContent).toContain('Create a new build to get started');
  });

  it('should display custom icon', () => {
    component.icon = '🚀';
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.text-6xl');
    expect(icon.textContent).toContain('🚀');
  });

  it('should render CTA button when ctaLabel is provided', () => {
    component.ctaLabel = 'Create Build';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Create Build');
  });

  it('should not render CTA button when ctaLabel is not provided', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeFalsy();
  });

  it('should emit cta event when button is clicked', () => {
    let emitted = false;
    component.cta.subscribe(() => {
      emitted = true;
    });
    component.ctaLabel = 'Click me';
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(emitted).toBe(true);
  });

  it('should have centered layout', () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('[class*="items-center"]');
    expect(container).toBeTruthy();
  });

  it('should have correct aria-label on button', () => {
    component.ctaLabel = 'Create Build';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Create Build');
  });

  it('should be standalone component', () => {
    expect(component).toBeTruthy();
  });
});
