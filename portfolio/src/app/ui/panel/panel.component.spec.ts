import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PanelComponent } from './panel.component';
import { SectionStore } from '../../core/services/section-store';

describe('PanelComponent', () => {
  let fixture: ComponentFixture<PanelComponent>;
  let store: SectionStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    store = TestBed.inject(SectionStore);
    fixture = TestBed.createComponent(PanelComponent);
    fixture.detectChanges();
  });

  it('renders nothing when no section is active', () => {
    const panel = fixture.nativeElement.querySelector('.panel');
    expect(panel).toBeNull();
  });

  it('renders the panel when a section is opened', async () => {
    store.open('about');
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.nativeElement.querySelector('.panel');
    expect(panel).not.toBeNull();
  });

  it('removes the panel when the store is closed', async () => {
    store.open('skills');
    fixture.detectChanges();
    await fixture.whenStable();

    store.close();
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector('.panel');
    expect(panel).toBeNull();
  });
});
