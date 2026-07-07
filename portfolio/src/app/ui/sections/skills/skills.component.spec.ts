import { TestBed } from '@angular/core/testing';
import { SkillsComponent } from './skills.component';

/** Mirrors the module-level SKILL_GROUPS constant in skills.component.ts. */
const EXPECTED = [
  { cluster: 'Languages', skillCount: 5 },
  { cluster: 'Frameworks & Libraries', skillCount: 5 },
  { cluster: 'Tools & Workflow', skillCount: 6 },
  { cluster: 'Cloud & DevOps', skillCount: 4 },
];

describe('SkillsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
    }).compileComponents();
  });

  it('renders the section heading', () => {
    const fixture = TestBed.createComponent(SkillsComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.section-heading');
    expect(heading?.textContent?.trim()).toBe('Skills');
  });

  it('renders one cluster per group in the source data', () => {
    const fixture = TestBed.createComponent(SkillsComponent);
    fixture.detectChanges();
    const clusters = fixture.nativeElement.querySelectorAll('.cluster');
    expect(clusters).toHaveLength(EXPECTED.length);
  });

  it('renders each cluster with its name and tag count', () => {
    const fixture = TestBed.createComponent(SkillsComponent);
    fixture.detectChanges();
    const clusters: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cluster');
    EXPECTED.forEach((group, i) => {
      const cluster = clusters[i];
      expect(cluster.querySelector('.cluster-name')?.textContent?.trim()).toBe(group.cluster);
      expect(cluster.querySelectorAll('.tag')).toHaveLength(group.skillCount);
    });
  });
});
