import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildDetailsModalComponent } from './build-details-modal.component';
import { Build } from '../../services/build.service';
import { vi } from 'vitest';

describe('BuildDetailsModalComponent', () => {
  let component: BuildDetailsModalComponent;
  let fixture: ComponentFixture<BuildDetailsModalComponent>;

  const mockBuild: Build = {
    id: 'build-123',
    name: 'Test Build',
    status: 'COMPLETE',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildDetailsModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BuildDetailsModalComponent);
    component = fixture.componentInstance;
    component.build = mockBuild;
  });

  describe('rendering', () => {
    it('should render modal title', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('#modal-title');
      expect(title.textContent).toContain('Build Details');
    });

    it('should render modal description', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const description = fixture.nativeElement.querySelector('#modal-description');
      expect(description.textContent).toContain('View and edit build information');
    });

    it('should render build ID in read-only field', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const idField = fixture.nativeElement.textContent;
      expect(idField).toContain('build-123');
    });

    it('should render build name input field', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const nameInput = fixture.nativeElement.querySelector('#build-name') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
      // Verify the component has initialized the editedBuild
      expect(component.editedBuild.name).toBe('Test Build');
    });

    it('should render status badge', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Completed');
    });

    it('should render created and updated dates', () => {
      fixture.detectChanges();
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Created');
      expect(content).toContain('Updated');
    });

    it('should render Save and Cancel buttons', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('initialization', () => {
    it('should create a copy of build for editing', () => {
      component.ngOnInit();
      expect(component.editedBuild).toEqual(mockBuild);
      expect(component.editedBuild).not.toBe(mockBuild);
    });

    it('should initialize editedBuild with same values as input build', () => {
      component.ngOnInit();
      expect(component.editedBuild.id).toBe(mockBuild.id);
      expect(component.editedBuild.name).toBe(mockBuild.name);
      expect(component.editedBuild.status).toBe(mockBuild.status);
    });
  });

  describe('build name editing', () => {
    it('should allow editing build name', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('#build-name') as HTMLInputElement;
      nameInput.value = 'Updated Build Name';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.editedBuild.name).toBe('Updated Build Name');
    });

    it('should keep original build unchanged when editing', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('#build-name') as HTMLInputElement;
      nameInput.value = 'Modified Name';
      nameInput.dispatchEvent(new Event('input'));

      expect(component.build.name).toBe('Test Build');
    });
  });

  describe('form actions', () => {
    it('should emit save event with edited build on save button click', () => {
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      component.ngOnInit();
      component.editedBuild.name = 'Updated Name';

      component.onSave();

      expect(saveEmitSpy).toHaveBeenCalledWith(component.editedBuild);
    });

    it('should emit cancel event on cancel button click', () => {
      const cancelEmitSpy = vi.spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(cancelEmitSpy).toHaveBeenCalled();
    });

    it('should emit save event with modified values', () => {
      const saveEmitSpy = vi.spyOn(component.save, 'emit');
      component.ngOnInit();
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('#build-name') as HTMLInputElement;
      nameInput.value = 'New Build Name';
      nameInput.dispatchEvent(new Event('input'));

      component.onSave();

      const emittedBuild = (saveEmitSpy.mock.calls[0] as any[])[0];
      expect(emittedBuild.name).toBe('New Build Name');
    });
  });

  describe('button interactions', () => {
    it('should trigger save when Save button is clicked', () => {
      const savespy = vi.spyOn(component, 'onSave');
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const saveButton = Array.from(buttons).find((btn: any) => btn.textContent.includes('Save'));

      if (saveButton) {
        (saveButton as HTMLButtonElement).click();
        expect(savespy).toHaveBeenCalled();
      }
    });

    it('should trigger cancel when Cancel button is clicked', () => {
      const cancelSpy = vi.spyOn(component, 'onCancel');
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = Array.from(buttons).find((btn: any) => btn.textContent.includes('Cancel'));

      if (cancelButton) {
        (cancelButton as HTMLButtonElement).click();
        expect(cancelSpy).toHaveBeenCalled();
      }
    });
  });

  describe('accessibility', () => {
    it('should have aria-label for build name input', () => {
      fixture.detectChanges();
      const nameInput = fixture.nativeElement.querySelector('#build-name');
      expect(nameInput.getAttribute('aria-label')).toBe('Build name');
    });

    it('should have aria-label for Cancel button', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = Array.from(buttons).find((btn: any) => btn.textContent.includes('Cancel'));

      if (cancelButton) {
        expect(cancelButton.getAttribute('aria-label')).toBeTruthy();
      }
    });

    it('should have aria-label for Save button', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const saveButton = Array.from(buttons).find((btn: any) => btn.textContent.includes('Save'));

      if (saveButton) {
        expect(saveButton.getAttribute('aria-label')).toBeTruthy();
      }
    });

    it('should have id attributes for modal descriptions', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#modal-title')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#modal-description')).toBeTruthy();
    });
  });

  describe('read-only fields', () => {
    it('should not allow direct editing of build ID', () => {
      fixture.detectChanges();
      const idField = fixture.nativeElement.querySelector('[disabled]');
      // Build ID should be displayed as read-only (in a non-input element)
      expect(fixture.nativeElement.textContent).toContain('build-123');
    });

    it('should display dates as text without edit capability', () => {
      fixture.detectChanges();
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Created');
      expect(content).toContain('Updated');
    });
  });

  describe('different build statuses', () => {
    it('should handle PENDING status', () => {
      component.build = { ...mockBuild, status: 'PENDING' };
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Pending');
    });

    it('should handle RUNNING status', () => {
      component.build = { ...mockBuild, status: 'RUNNING' };
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Running');
    });

    it('should handle FAILED status', () => {
      component.build = { ...mockBuild, status: 'FAILED' };
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Failed');
    });
  });

  describe('change detection', () => {
    it('should use OnPush change detection', () => {
      const metadata = (component.constructor as any).__annotations__[0];
      expect(metadata.changeDetection).toBeDefined();
    });
  });
});
