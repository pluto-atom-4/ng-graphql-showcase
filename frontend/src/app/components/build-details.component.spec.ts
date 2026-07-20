import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildDetailsComponent } from './build-details.component';
import { WorkflowService } from '../api/workflow.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BuildDetailsComponent', () => {
  let component: BuildDetailsComponent;
  let fixture: ComponentFixture<BuildDetailsComponent>;
  let getWorkflowsByBuildSpy: any;

  const mockBuild = {
    id: 'build-123',
    name: 'Test Build',
    description: 'Test Description',
    status: 'COMPLETE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    parts: [
      {
        id: 'part-1',
        name: 'Component A',
        sku: 'SKU-001',
        quantity: 5,
      },
    ],
    testRuns: [
      {
        id: 'test-1',
        status: 'PASSED' as const,
        result: 'All tests passed',
        fileUrl: null,
      },
    ],
  };

  beforeEach(async () => {
    getWorkflowsByBuildSpy = vi.fn().mockReturnValue(
      of([
        {
          id: 'workflow-123',
          buildId: 'build-123',
          status: 'Completed',
          startedAt: new Date(),
          completedAt: new Date(),
          activities: [],
          history: [],
        },
      ])
    );

    const mockWorkflowService = {
      getWorkflowsByBuild: getWorkflowsByBuildSpy,
      subscribeToWorkflowUpdates: vi.fn().mockReturnValue(of(null)),
      subscribeToHistoryAdded: vi.fn().mockReturnValue(of(null)),
      unsubscribeFromWorkflow: vi.fn(),
      getWorkflow: vi.fn(),
      getWorkflowHistory: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BuildDetailsComponent, NoopAnimationsModule],
      providers: [
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BuildDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display build name in header', () => {
    fixture.componentRef.setInput('build', mockBuild);
    fixture.componentRef.setInput('onClose', () => {});
    fixture.detectChanges();

    const headerElement = fixture.nativeElement.querySelector('h3');
    expect(headerElement.textContent).toContain('Build Details: Test Build');
  });

  it('should switch to parts tab and display parts', () => {
    fixture.componentRef.setInput('build', mockBuild);
    fixture.componentRef.setInput('onClose', () => {});
    fixture.detectChanges();

    component.activeTab.set('parts');
    fixture.detectChanges();

    const partName = fixture.nativeElement.textContent;
    expect(partName).toContain('Component A');
    expect(partName).toContain('SKU-001');
  });

  it('should switch to test runs tab and display test results', () => {
    fixture.componentRef.setInput('build', mockBuild);
    fixture.componentRef.setInput('onClose', () => {});
    fixture.detectChanges();

    component.activeTab.set('testRuns');
    fixture.detectChanges();

    const testContent = fixture.nativeElement.textContent;
    expect(testContent).toContain('PASSED');
  });

  it('should call onClose callback when close button clicked', () => {
    const onCloseSpy = vi.fn();
    fixture.componentRef.setInput('build', mockBuild);
    fixture.componentRef.setInput('onClose', onCloseSpy);
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('button[class*="btn-circle"]');
    closeButton.click();

    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('should call onClose callback when backdrop clicked', () => {
    const onCloseSpy = vi.fn();
    fixture.componentRef.setInput('build', mockBuild);
    fixture.componentRef.setInput('onClose', onCloseSpy);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    backdrop.click();

    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('should load workflows for build on input change', () => {
    fixture.componentRef.setInput('build', mockBuild);
    fixture.componentRef.setInput('onClose', () => {});
    fixture.detectChanges();

    expect(getWorkflowsByBuildSpy).toHaveBeenCalledWith('build-123');
  });
});
