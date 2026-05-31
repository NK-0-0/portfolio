import { TestBed } from '@angular/core/testing';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
    }).compileComponents();
  });

  it('renders the section heading', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.section-heading');
    expect(heading?.textContent?.trim()).toBe('About Me');
  });

  it('renders the role line', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    const role = fixture.nativeElement.querySelector('.role');
    expect(role).not.toBeNull();
  });
});
