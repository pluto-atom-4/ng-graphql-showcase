import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should have builds array', () => {
    expect(component.builds).toBeDefined();
    expect(Array.isArray(component.builds)).toBe(true);
  });

  it('should have 3 default builds', () => {
    expect(component.builds.length).toBe(3);
  });

  it('should have Production Build', () => {
    const prodBuild = component.builds.find(b => b.name === 'Production Build');
    expect(prodBuild).toBeDefined();
  });

  it('should have Test Suite build', () => {
    const testBuild = component.builds.find(b => b.name === 'Test Suite');
    expect(testBuild).toBeDefined();
  });

  it('should have Staging Deploy build', () => {
    const stagingBuild = component.builds.find(b => b.name === 'Staging Deploy');
    expect(stagingBuild).toBeDefined();
  });

  it('should have unique build IDs', () => {
    const ids = component.builds.map(b => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should render header text', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Manufacturing Workflow Dashboard'
    );
  });

  it('should render description text', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Real-time build and test monitoring'
    );
  });

  it('should render gradient background', () => {
    const container = fixture.nativeElement.querySelector('.bg-gradient-to-br');
    expect(container).toBeTruthy();
  });

  it('should render daisyUI component library card', () => {
    expect(fixture.nativeElement.textContent).toContain('daisyUI Component Library');
  });

  it('should render button variants section', () => {
    expect(fixture.nativeElement.textContent).toContain('Button Variants');
  });

  it('should render status badges section', () => {
    expect(fixture.nativeElement.textContent).toContain('Status Badges');
  });

  it('should have app-build-progress-card components', () => {
    fixture.detectChanges();
    const buildCards = fixture.nativeElement.querySelectorAll('app-build-progress-card');
    expect(buildCards.length).toBe(3);
  });

  it('should pass buildName and buildId to each card', () => {
    fixture.detectChanges();
    const buildCards = fixture.nativeElement.querySelectorAll('app-build-progress-card');

    buildCards.forEach((card: any, index: number) => {
      expect(card.getAttribute('buildName')).toBe(component.builds[index].name);
      expect(card.getAttribute('buildId')).toBe(component.builds[index].id);
    });
  });

  it('should render app-card for component showcase', () => {
    fixture.detectChanges();
    const appCard = fixture.nativeElement.querySelector('app-card');
    expect(appCard).toBeTruthy();
  });

  it('should render app-button components', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render app-badge components', () => {
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('app-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should have max-w-6xl layout constraint', () => {
    const container = fixture.nativeElement.querySelector('.max-w-6xl');
    expect(container).toBeTruthy();
  });

  it('should have proper grid layout', () => {
    const grid = fixture.nativeElement.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });
});
