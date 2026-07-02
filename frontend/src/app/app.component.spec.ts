import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
// Import Apollo mock (vitest alias replaces apollo-angular)
import { Apollo } from 'apollo-angular';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Apollo, useClass: Apollo },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
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
});
