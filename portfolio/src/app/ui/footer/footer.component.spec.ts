import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('renders a footer element', () => {
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer).not.toBeNull();
  });

  it('contains the Masashi Kishimoto attribution', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Masashi Kishimoto');
    expect(text).toContain('Studio Pierrot');
    expect(text).toContain('Fan work');
  });

  it('has the correct ARIA role', () => {
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.getAttribute('role')).toBe('contentinfo');
  });
});
