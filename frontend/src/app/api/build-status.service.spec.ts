import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';
import { BuildStatusService, BuildStatusUpdate } from './build-status.service';
import { BuildStatusUpdatedSubscription } from './generated/graphql';

describe('BuildStatusService', () => {
  let service: BuildStatusService;
  let apolloMock: jasmine.SpyObj<Apollo>;

  beforeEach(() => {
    apolloMock = jasmine.createSpyObj('Apollo', ['subscribe']);

    TestBed.configureTestingModule({
      providers: [
        BuildStatusService,
        { provide: Apollo, useValue: apolloMock }
      ]
    });

    service = TestBed.inject(BuildStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe to buildStatusUpdated', () => {
    const mockSubscription = of({
      data: {
        buildStatusUpdated: {
          buildId: '123',
          oldStatus: 'Pending',
          newStatus: 'Running',
          timestamp: new Date()
        }
      }
    } as any);

    apolloMock.subscribe.and.returnValue(mockSubscription);

    service.subscribeToBuildStatus('123');

    expect(apolloMock.subscribe).toHaveBeenCalled();
  });

  it('should emit buffered updates every 250ms', (done) => {
    const mockSubscription = of({
      data: {
        buildStatusUpdated: {
          buildId: '123',
          oldStatus: 'Pending',
          newStatus: 'Running',
          timestamp: new Date()
        }
      }
    } as any);

    apolloMock.subscribe.and.returnValue(mockSubscription);

    service.subscribeToBuildStatus('123');

    service.getBufferedUpdates().subscribe(updates => {
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].buildId).toBe('123');
      done();
    });
  });

  it('should clear updates', () => {
    service.clearUpdates();
    service.buildStatus$.subscribe(updates => {
      expect(updates.length).toBe(0);
    });
  });
});
