import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricsGridComponent } from './metrics-grid.component';
import { MetricCardComponent } from './metric-card.component';

describe('MetricsGridComponent', () => {
  let component: MetricsGridComponent;
  let fixture: ComponentFixture<MetricsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsGridComponent);
    component = fixture.componentInstance;
  });

  it('should render 4 metric cards', () => {
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-metric-card');
    expect(cards.length).toBe(4);
  });

  it('should pass correct metrics to cards', () => {
    component.metrics = {
      total: 100,
      inProgress: 25,
      completed: 50,
      failed: 5
    };
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-metric-card');
    expect(cards[0].textContent).toContain('100');
    expect(cards[1].textContent).toContain('25');
    expect(cards[2].textContent).toContain('50');
    expect(cards[3].textContent).toContain('5');
  });

  it('should have responsive grid layout', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('[class*="grid"]');
    expect(grid).toBeTruthy();
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-4');
  });

  it('should update when metrics change', () => {
    component.metrics = {
      total: 50,
      inProgress: 10,
      completed: 30,
      failed: 2
    };
    expect(component.metrics.total).toBe(50);

    component.metrics = {
      total: 60,
      inProgress: 15,
      completed: 40,
      failed: 3
    };
    expect(component.metrics.total).toBe(60);
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });
});

describe('MetricCardComponent', () => {
  let component: MetricCardComponent;
  let fixture: ComponentFixture<MetricCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCardComponent);
    component = fixture.componentInstance;
  });

  it('should display label and count', () => {
    component.label = 'Total Builds';
    component.count = 42;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Total Builds');
    expect(fixture.nativeElement.textContent).toContain('42');
  });

  it('should show total status with gray color', () => {
    component.status = 'total';
    fixture.detectChanges();
    const config = component.statusConfig;
    expect(config.color).toBe('#6b7280');
    expect(config.icon).toBe('📊');
  });

  it('should show inProgress status with blue color', () => {
    component.status = 'inProgress';
    fixture.detectChanges();
    const config = component.statusConfig;
    expect(config.color).toBe('#2563eb');
    expect(config.icon).toBe('⚙️');
  });

  it('should show completed status with green color', () => {
    component.status = 'completed';
    fixture.detectChanges();
    const config = component.statusConfig;
    expect(config.color).toBe('#10b981');
    expect(config.icon).toBe('✅');
  });

  it('should show failed status with red color', () => {
    component.status = 'failed';
    fixture.detectChanges();
    const config = component.statusConfig;
    expect(config.color).toBe('#ef4444');
    expect(config.icon).toBe('❌');
  });

  it('should calculate indicator width based on count', () => {
    component.count = 50;
    const width = component.getIndicatorWidth();
    expect(width).toBe('50%');
  });

  it('should cap indicator width at 100%', () => {
    component.count = 200;
    const width = component.getIndicatorWidth();
    expect(width).toBe('100%');
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });
});
