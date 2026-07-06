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

  it('renders a copyright line with the current year', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('©');
    expect(text).toContain(String(new Date().getFullYear()));
    expect(text).toContain('All rights reserved');
  });

  it('has the correct ARIA role', () => {
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.getAttribute('role')).toBe('contentinfo');
  });
});
