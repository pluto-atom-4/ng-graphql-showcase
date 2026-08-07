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
});
