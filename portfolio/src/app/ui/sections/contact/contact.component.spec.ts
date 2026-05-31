import { TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
    }).compileComponents();
  });

  it('renders all three contact links', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.link-row');
    expect(links).toHaveLength(3);
  });

  it('has external links with rel=noopener', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
    const anchors: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    anchors.forEach((a) => {
      if (a.target === '_blank') {
        expect(a.rel).toContain('noopener');
      }
    });
  });
});
