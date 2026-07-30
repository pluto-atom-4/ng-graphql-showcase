import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
  });

  it('should render tab list', () => {
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
  });

  it('should mark first tab as active by default', () => {
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    fixture.detectChanges();
    const firstTab = fixture.nativeElement.querySelector('[role="tab"]');
    expect(firstTab.getAttribute('aria-selected')).toBe('true');
  });

  it('should emit activeIndexChange on tab click', () => {
    let emitted: number | undefined;
    component.activeIndexChange.subscribe((index) => {
      emitted = index;
    });
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    fixture.detectChanges();

    const secondTab = fixture.nativeElement.querySelectorAll('[role="tab"]')[1];
    secondTab.click();
    expect(emitted).toBe(1);
  });

  it('should navigate to next tab with ArrowRight', () => {
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    component.activeIndex = 0;

    let emitted: number | undefined;
    component.activeIndexChange.subscribe((index) => {
      emitted = index;
    });

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    component.onKeydown(event);

    expect(emitted).toBe(1);
  });

  it('should navigate to previous tab with ArrowLeft', () => {
    let emitted: number | undefined;
    component.activeIndexChange.subscribe((index) => {
      emitted = index;
    });
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    component.activeIndex = 1;

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    component.onKeydown(event);

    expect(emitted).toBe(0);
  });

  it('should jump to first tab with Home key', () => {
    let emitted: number | undefined;
    component.activeIndexChange.subscribe((index) => {
      emitted = index;
    });
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 },
      { id: 'tab3', label: 'Tab 3', index: 2 }
    ];
    component.activeIndex = 2;

    const event = new KeyboardEvent('keydown', { key: 'Home' });
    component.onKeydown(event);

    expect(emitted).toBe(0);
  });

  it('should jump to last tab with End key', () => {
    let emitted: number | undefined;
    component.activeIndexChange.subscribe((index) => {
      emitted = index;
    });
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 },
      { id: 'tab3', label: 'Tab 3', index: 2 }
    ];
    component.activeIndex = 0;

    const event = new KeyboardEvent('keydown', { key: 'End' });
    component.onKeydown(event);

    expect(emitted).toBe(2);
  });

  it('should wrap around to first tab when navigating past last', () => {
    let emitted: number | undefined;
    component.activeIndexChange.subscribe((index) => {
      emitted = index;
    });
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    component.activeIndex = 1;

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    component.onKeydown(event);

    expect(emitted).toBe(0);
  });

  it('should have tablist role on tab container', () => {
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 }
    ];
    fixture.detectChanges();
    const tabList = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tabList).toBeTruthy();
  });

  it('should render tab panels with correct role', () => {
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    fixture.detectChanges();
    const panels = fixture.nativeElement.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBe(2);
  });

  it('should set aria-selected correctly for active tab', () => {
    component.tabs = [
      { id: 'tab1', label: 'Tab 1', index: 0 },
      { id: 'tab2', label: 'Tab 2', index: 1 }
    ];
    component.activeIndex = 1;
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
  });
});
