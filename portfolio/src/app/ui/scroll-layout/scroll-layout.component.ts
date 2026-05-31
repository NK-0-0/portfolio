import {
  Component,
  PLATFORM_ID,
  OnDestroy,
  WritableSignal,
  afterNextRender,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AboutComponent }      from '../sections/about/about.component';
import { ExperienceComponent } from '../sections/experience/experience.component';
import { SkillsComponent }     from '../sections/skills/skills.component';
import { ProjectsComponent }   from '../sections/projects/projects.component';
import { ContactComponent }    from '../sections/contact/contact.component';

/**
 * Full-page scrollable content layer that sits above the fixed 3D canvas.
 * Five section cards alternate left/right and reveal via CSS transition
 * when each enters the viewport (IntersectionObserver).
 */
@Component({
  selector: 'app-scroll-layout',
  standalone: true,
  imports: [
    AboutComponent,
    ExperienceComponent,
    SkillsComponent,
    ProjectsComponent,
    ContactComponent,
  ],
  template: `
    <!-- ── Hero ─────────────────────────────────────────────────────── -->
    <section class="section section--hero">
      <div class="hero-content">
        <span class="hero-label">Portfolio</span>
        <h1 class="hero-name">Your Name</h1>
        <p class="hero-role">Full-Stack Engineer</p>
        <p class="hero-tagline">Building things that matter.</p>
      </div>
      <a class="scroll-cue" href="#about" aria-label="Scroll to content">
        <span class="scroll-cue__text">scroll</span>
        <span class="scroll-cue__arrow" aria-hidden="true">↓</span>
      </a>
    </section>

    <!-- ── About ──────────────────────────────────────────────── left -->
    <section class="section" id="about" #aboutSection>
      <div class="section-card section-card--left"
           [class.section-card--visible]="aboutVisible()">
        <app-about />
      </div>
    </section>

    <!-- ── Experience ──────────────────────────────────────────────── right -->
    <section class="section" id="experience" #experienceSection>
      <div class="section-card section-card--right"
           [class.section-card--visible]="experienceVisible()">
        <app-experience />
      </div>
    </section>

    <!-- ── Skills ─────────────────────────────────────────────── left -->
    <section class="section" id="skills" #skillsSection>
      <div class="section-card section-card--left"
           [class.section-card--visible]="skillsVisible()">
        <app-skills />
      </div>
    </section>

    <!-- ── Projects ───────────────────────────────────────────── right -->
    <section class="section" id="projects" #projectsSection>
      <div class="section-card section-card--right"
           [class.section-card--visible]="projectsVisible()">
        <app-projects />
      </div>
    </section>

    <!-- ── Contact ────────────────────────────────────────────── left -->
    <section class="section" id="contact" #contactSection>
      <div class="section-card section-card--left"
           [class.section-card--visible]="contactVisible()">
        <app-contact />
      </div>
    </section>
  `,
  styleUrl: './scroll-layout.component.scss',
})
export class ScrollLayoutComponent implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly aboutRef      = viewChild.required<ElementRef>('aboutSection');
  private readonly experienceRef = viewChild.required<ElementRef>('experienceSection');
  private readonly skillsRef     = viewChild.required<ElementRef>('skillsSection');
  private readonly projectsRef   = viewChild.required<ElementRef>('projectsSection');
  private readonly contactRef    = viewChild.required<ElementRef>('contactSection');

  protected readonly aboutVisible      = signal(false);
  protected readonly experienceVisible = signal(false);
  protected readonly skillsVisible     = signal(false);
  protected readonly projectsVisible   = signal(false);
  protected readonly contactVisible    = signal(false);

  #observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => this.#setup());
  }

  #setup(): void {
    if (!this.isBrowser) return;

    const sigMap: Record<string, WritableSignal<boolean>> = {
      about:      this.aboutVisible,
      experience: this.experienceVisible,
      skills:     this.skillsVisible,
      projects:   this.projectsVisible,
      contact:    this.contactVisible,
    };

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).id;
            sigMap[id]?.set(true);
          }
        }
      },
      { threshold: 0.15 },
    );

    for (const ref of [
      this.aboutRef(),
      this.experienceRef(),
      this.skillsRef(),
      this.projectsRef(),
      this.contactRef(),
    ]) {
      this.#observer.observe(ref.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.#observer?.disconnect();
  }
}
