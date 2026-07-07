import { TestBed } from '@angular/core/testing';
import { ProjectsComponent } from './projects.component';

// Mirrors the module-level PROJECTS constant: 4 cards, all 4 have githubUrl,
// but only 1 (the collaboration tool) has a liveUrl — the @if-gated "Live"
// link must therefore render fewer times than the card count.
const EXPECTED_CARD_COUNT = 4;
const EXPECTED_LIVE_LINKS = 1;
const EXPECTED_GITHUB_LINKS = 4;

describe('ProjectsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
    }).compileComponents();
  });

  it('renders the section heading', () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.section-heading');
    expect(heading?.textContent?.trim()).toBe('Projects');
  });

  it('renders one card per project in the source data', () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.project-card');
    expect(cards).toHaveLength(EXPECTED_CARD_COUNT);
  });

  it('only renders a live link for projects that have a liveUrl', () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();
    const anchors: NodeListOf<HTMLAnchorElement> =
      fixture.nativeElement.querySelectorAll('.links a');
    const liveLinks = Array.from(anchors).filter((a) => a.getAttribute('aria-label') === 'Live site');
    const githubLinks = Array.from(anchors).filter((a) => a.getAttribute('aria-label') === 'GitHub');

    expect(liveLinks).toHaveLength(EXPECTED_LIVE_LINKS);
    expect(githubLinks).toHaveLength(EXPECTED_GITHUB_LINKS);
    // The @if gate must suppress live links where the data omits liveUrl.
    expect(liveLinks.length).toBeLessThan(EXPECTED_CARD_COUNT);
  });

  it('has external links with rel=noopener', () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();
    const anchors: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    anchors.forEach((a) => {
      if (a.target === '_blank') {
        expect(a.rel).toContain('noopener');
      }
    });
  });
});
