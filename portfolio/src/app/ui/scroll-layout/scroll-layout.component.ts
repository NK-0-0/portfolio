import {
  Component,
  PLATFORM_ID,
  OnDestroy,
  afterNextRender,
  inject,
  viewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis             from 'lenis';
import { ScrollStateService, type ActiveSection } from '../../core/services/scroll-state.service';
import { AboutComponent }      from '../sections/about/about.component';
import { ExperienceComponent } from '../sections/experience/experience.component';
import { SkillsComponent }     from '../sections/skills/skills.component';
import { ProjectsComponent }   from '../sections/projects/projects.component';
import { ContactComponent }    from '../sections/contact/contact.component';

/** CSS --bg-hue per section (0=hero … 5=contact). */
const SECTION_HUES: Record<number, number> = {
  0: 240, // deep navy
  1: 220, // indigo-blue
  2: 270, // deep violet
  3: 170, // dark teal
  4:  45, // amber
  5:   0, // crimson
};

/**
 * Full-page scrollable content layer.
 *
 * Lenis provides inertia scroll, GSAP ScrollTrigger drives all animations:
 *  - Hero text parallax out on scroll
 *  - Section cards slide+rotate in from left/right with scrub
 *  - Background hue (CSS --bg-hue) tweens per section
 *  - ScrollStateService signals updated on section enter/leave
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
    <!-- ── Hero ───────────────────────────────────────────────────────── -->
    <section class="section section--hero" #heroSection>
      <div class="hero-content" #heroContent>
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

    <!-- ── About ─────────────────────────────────────────────────── left -->
    <section class="section" id="about" #aboutSection>
      <div class="section__label" aria-hidden="true">01 / About</div>
      <div class="section-card section-card--left" #aboutCard>
        <app-about />
      </div>
    </section>

    <!-- ── Experience ────────────────────────────────────────────── right -->
    <section class="section" id="experience" #experienceSection>
      <div class="section__label section__label--right" aria-hidden="true">02 / Experience</div>
      <div class="section-card section-card--right" #experienceCard>
        <app-experience />
      </div>
    </section>

    <!-- ── Skills ────────────────────────────────────────────────── left -->
    <section class="section" id="skills" #skillsSection>
      <div class="section__label" aria-hidden="true">03 / Skills</div>
      <div class="section-card section-card--left" #skillsCard>
        <app-skills />
      </div>
    </section>

    <!-- ── Projects ──────────────────────────────────────────────── right -->
    <section class="section" id="projects" #projectsSection>
      <div class="section__label section__label--right" aria-hidden="true">04 / Projects</div>
      <div class="section-card section-card--right" #projectsCard>
        <app-projects />
      </div>
    </section>

    <!-- ── Contact ───────────────────────────────────────────────── left -->
    <section class="section" id="contact" #contactSection>
      <div class="section__label" aria-hidden="true">05 / Contact</div>
      <div class="section-card section-card--left" #contactCard>
        <app-contact />
      </div>
    </section>
  `,
  styleUrl: './scroll-layout.component.scss',
})
export class ScrollLayoutComponent implements OnDestroy {
  readonly #isBrowser   = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #scrollState = inject(ScrollStateService);

  // ── View references ─────────────────────────────────────────────────────

  private readonly heroContentRef    = viewChild.required<ElementRef>('heroContent');

  private readonly aboutSection      = viewChild.required<ElementRef>('aboutSection');
  private readonly experienceSection = viewChild.required<ElementRef>('experienceSection');
  private readonly skillsSection     = viewChild.required<ElementRef>('skillsSection');
  private readonly projectsSection   = viewChild.required<ElementRef>('projectsSection');
  private readonly contactSection    = viewChild.required<ElementRef>('contactSection');

  private readonly aboutCard         = viewChild.required<ElementRef>('aboutCard');
  private readonly experienceCard    = viewChild.required<ElementRef>('experienceCard');
  private readonly skillsCard        = viewChild.required<ElementRef>('skillsCard');
  private readonly projectsCard      = viewChild.required<ElementRef>('projectsCard');
  private readonly contactCard       = viewChild.required<ElementRef>('contactCard');

  // ── Internals ────────────────────────────────────────────────────────────

  #lenis?: Lenis;
  #rafId?: number;
  #hueProxy = { hue: SECTION_HUES[0] };

  constructor() {
    afterNextRender(() => {
      if (!this.#isBrowser) return;
      gsap.registerPlugin(ScrollTrigger);
      this.#initLenis();
      this.#initAnimations();
    });
  }

  // ── Lenis smooth scroll ───────────────────────────────────────────────────

  #initLenis(): void {
    this.#lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    this.#lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number): void => {
      this.#lenis!.raf(time);
      this.#rafId = requestAnimationFrame(raf);
    };
    this.#rafId = requestAnimationFrame(raf);
  }

  // ── GSAP ScrollTrigger animations ─────────────────────────────────────────

  #initAnimations(): void {
    const sections = [
      this.aboutSection(),
      this.experienceSection(),
      this.skillsSection(),
      this.projectsSection(),
      this.contactSection(),
    ].map(r => r.nativeElement as HTMLElement);

    const cards = [
      { el: this.aboutCard().nativeElement      as HTMLElement, isLeft: true  },
      { el: this.experienceCard().nativeElement as HTMLElement, isLeft: false },
      { el: this.skillsCard().nativeElement     as HTMLElement, isLeft: true  },
      { el: this.projectsCard().nativeElement   as HTMLElement, isLeft: false },
      { el: this.contactCard().nativeElement    as HTMLElement, isLeft: true  },
    ];

    // ── Hero content: drift up + fade on scroll ──────────────────────────
    gsap.to(this.heroContentRef().nativeElement, {
      y: -120,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: this.heroContentRef().nativeElement,
        start: 'top top',
        end: '+=600',
        scrub: true,
      },
    });

    // ── Cards: set invisible, then reveal on scroll ──────────────────────
    cards.forEach(({ el, isLeft }) => {
      gsap.set(el, { opacity: 0, x: isLeft ? -70 : 70, rotateY: isLeft ? -12 : 12 });
    });

    cards.forEach(({ el, isLeft }, i) => {
      const section = sections[i];
      gsap.to(el, {
        opacity: 1,
        x: 0,
        rotateY: 0,
        ease: 'power3.out',
        duration: 0.9,
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      });

      // section label
      const label = section.querySelector('.section__label') as HTMLElement | null;
      if (label) {
        gsap.set(label, { opacity: 0, y: 16 });
        gsap.to(label, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.15,
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    });

    // ── Background hue per section ───────────────────────────────────────
    sections.forEach((sectionEl, idx) => {
      const targetHue = SECTION_HUES[idx + 1];
      const prevHue   = SECTION_HUES[idx];

      gsap.to(this.#hueProxy, {
        hue: targetHue,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.6,
          onUpdate: () => {
            document.documentElement.style.setProperty(
              '--bg-hue',
              String(Math.round(this.#hueProxy.hue)),
            );
          },
          onLeaveBack: () => {
            gsap.to(this.#hueProxy, {
              hue: prevHue,
              duration: 0.8,
              ease: 'power2.out',
              onUpdate: () => {
                document.documentElement.style.setProperty(
                  '--bg-hue',
                  String(Math.round(this.#hueProxy.hue)),
                );
              },
            });
          },
        },
      });
    });

    // ── Active section signals ────────────────────────────────────────────
    sections.forEach((sectionEl, idx) => {
      ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter:     () => this.#scrollState.activeSection.set((idx + 1) as ActiveSection),
        onEnterBack: () => this.#scrollState.activeSection.set((idx + 1) as ActiveSection),
        onLeaveBack: () => {
          if (idx === 0) this.#scrollState.activeSection.set(0);
        },
      });
    });

    // ── Overall scroll progress ──────────────────────────────────────────
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => this.#scrollState.scrollProgress.set(self.progress),
    });

    ScrollTrigger.refresh();
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    if (this.#rafId !== undefined) cancelAnimationFrame(this.#rafId);
    this.#lenis?.destroy();
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
