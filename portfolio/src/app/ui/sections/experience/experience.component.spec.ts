import { TestBed } from '@angular/core/testing';
import { ExperienceComponent } from './experience.component';

/** Mirrors the module-level EXPERIENCE constant in experience.component.ts. */
const EXPECTED = [
  { company: 'Acme Corp', title: 'Senior Software Engineer', period: 'Jan 2022 – Present' },
  { company: 'Startupland', title: 'Software Engineer', period: 'Jun 2019 – Dec 2021' },
  { company: 'Dev Agency', title: 'Junior Developer', period: 'Mar 2018 – May 2019' },
];

describe('ExperienceComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
    }).compileComponents();
  });

  it('renders the section heading', () => {
    const fixture = TestBed.createComponent(ExperienceComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.section-heading');
    expect(heading?.textContent?.trim()).toBe('Experience');
  });

  it('renders one item per role in the source data', () => {
    const fixture = TestBed.createComponent(ExperienceComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.role-item');
    expect(items).toHaveLength(EXPECTED.length);
  });

  it('renders each role with its company, title and period', () => {
    const fixture = TestBed.createComponent(ExperienceComponent);
    fixture.detectChanges();
    const items: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.role-item');
    EXPECTED.forEach((role, i) => {
      const item = items[i];
      expect(item.querySelector('.company')?.textContent?.trim()).toBe(role.company);
      expect(item.querySelector('.title')?.textContent?.trim()).toBe(role.title);
      expect(item.querySelector('.period')?.textContent?.trim()).toBe(role.period);
    });
  });
});
