import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HintComponent } from './hint.component';

describe('HintComponent', () => {
  let fixture: ComponentFixture<HintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HintComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HintComponent);
  });

  it('shows the idle hint when nothing is hovered and panel is closed', () => {
    fixture.componentRef.setInput('hoveredSection', null);
    fixture.componentRef.setInput('isPanelOpen', false);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.idle');
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Hover');
  });

  it('shows the active label when a section is hovered', () => {
    fixture.componentRef.setInput('hoveredSection', 'about');
    fixture.componentRef.setInput('isPanelOpen', false);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.active');
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('ABOUT');
  });

  it('hides the hint when the panel is open', () => {
    fixture.componentRef.setInput('hoveredSection', null);
    fixture.componentRef.setInput('isPanelOpen', true);
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.hint') as HTMLElement;
    expect(hint).not.toBeNull();
    expect(hint.classList.contains('hint--visible')).toBe(false);
  });
});
