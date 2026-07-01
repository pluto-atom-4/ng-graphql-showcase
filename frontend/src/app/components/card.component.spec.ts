import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have OnPush change detection', () => {
    const metadata = (CardComponent as any).ɵcmp;
    expect(metadata.changeDetection).toBe(0);
  });

  it('should render title', () => {
    component.title = 'Test Title';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test Title');
  });

  it('should render description', () => {
    component.description = 'Test Description';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test Description');
  });

  it('should not render title when empty', () => {
    component.title = '';
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title).toBeFalsy();
  });

  it('should not render description when empty', () => {
    component.description = '';
    fixture.detectChanges();
    const description = fixture.nativeElement.querySelector('.text-gray-600');
    expect(description).toBeFalsy();
  });

  it('should render ng-content slot', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ng-content')).toBeTruthy();
  });

  it('should have card-factory class', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.card-factory')).toBeTruthy();
  });
});
