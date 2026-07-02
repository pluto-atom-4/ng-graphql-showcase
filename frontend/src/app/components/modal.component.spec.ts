import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should have default title', () => {
    expect(component.title()).toBe('Modal Title');
  });

  it('should have default confirmLabel', () => {
    expect(component.confirmLabel()).toBe('Confirm');
  });

  it('should have default isOpen as false', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('should accept custom title', () => {
    fixture.componentRef.setInput('title', 'Delete Item?');
    fixture.detectChanges();
    expect(component.title()).toBe('Delete Item?');
  });

  it('should accept custom confirmLabel', () => {
    fixture.componentRef.setInput('confirmLabel', 'Delete');
    fixture.detectChanges();
    expect(component.confirmLabel()).toBe('Delete');
  });

  it('should accept isOpen input', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);
  });

  it('should render dialog element', () => {
    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog).toBeTruthy();
  });

  it('should add modal-open class when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog.className).toContain('modal-open');
  });

  it('should not add modal-open class when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog.className).not.toContain('modal-open');
  });

  it('should render modal-box', () => {
    fixture.detectChanges();
    const modalBox = fixture.nativeElement.querySelector('.modal-box');
    expect(modalBox).toBeTruthy();
  });

  it('should render title in modal', () => {
    fixture.componentRef.setInput('title', 'Confirm Delete');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Confirm Delete');
  });

  it('should have cancel button', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have confirm button with custom label', () => {
    fixture.componentRef.setInput('confirmLabel', 'Yes, Delete');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Yes, Delete');
  });

  it('should emit closeModal on cancel button click', () => {
    fixture.detectChanges();
    let emitted = false;
    component.closeModal.subscribe(() => {
      emitted = true;
    });

    const cancelBtn = fixture.nativeElement.querySelector('.btn-ghost');
    cancelBtn.click();

    expect(emitted).toBe(true);
  });

  it('should emit confirm on confirm button click', () => {
    fixture.detectChanges();
    let emitted = false;
    component.confirm.subscribe(() => {
      emitted = true;
    });

    const confirmBtn = fixture.nativeElement.querySelector('.btn-primary');
    confirmBtn.click();

    expect(emitted).toBe(true);
  });

  it('should render ng-content slot', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('.py-4');
    expect(content).toBeTruthy();
  });
});
