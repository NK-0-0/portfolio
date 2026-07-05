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

/** CSS --bg-hue per section. */
const SECTION_HUES: number[] = [240, 220, 270, 170, 45, 0];

/**
 * Full-page scrollable content layer.
 *
 * Parallax layers (slowest → fastest):
 *  0.20× — background kanji characters
 *  0.45× — section label / number
 *  0.70× — hero tagline
 *  0.85× — hero role
 *  1.00× — hero name (surface)
 *
 * Cards: 3D rotateY entrance on scroll-enter, depth-float on scrub.
 * Background: GSAP tweens --bg-hue CSS custom property per section.
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
    <section class="section section--hero" #heroSection>
      <!-- Deep parallax kanji — moves slowest -->
      <span class="kanji kanji--hero" aria-hidden="true">忍</span>

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
      <span class="kanji" aria-hidden="true">我</span>
      <p class="section__label">01 &nbsp;/&nbsp; About</p>
      <div class="section-card section-card--left" #aboutCard>
        <app-about />
      </div>
    </section>

    <!-- ── Experience ─────────────────────────────────────────── right -->
    <section class="section" id="experience" #experienceSection>
      <span class="kanji" aria-hidden="true">道</span>
      <p class="section__label section__label--right">02 &nbsp;/&nbsp; Experience</p>
      <div class="section-card section-card--right" #experienceCard>
        <app-experience />
      </div>
    </section>

    <!-- ── Skills ─────────────────────────────────────────────── left -->
    <section class="section" id="skills" #skillsSection>
      <span class="kanji" aria-hidden="true">技</span>
      <p class="section__label">03 &nbsp;/&nbsp; Skills</p>
      <div class="section-card section-card--left" #skillsCard>
        <app-skills />
      </div>
    </section>

    <!-- ── Projects (clean parallax) ──────────────────────────── right -->
    <section class="section section--clean" id="projects" #projectsSection>
      <span class="kanji" aria-hidden="true">創</span>
      <p class="section__label section__label--right">04 &nbsp;/&nbsp; Projects</p>
      <div class="section-card section-card--right" #projectsCard>
        <app-projects />
      </div>
    </section>

    <!-- ── Contact (clean parallax) ───────────────────────────── left -->
    <section class="section section--clean" id="contact" #contactSection>
      <span class="kanji" aria-hidden="true">繋</span>
      <p class="section__label">05 &nbsp;/&nbsp; Contact</p>
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

  // ── Section refs ─────────────────────────────────────────────────────────

  private readonly heroSectionRef    = viewChild.required<ElementRef>('heroSection');
  private readonly aboutSection      = viewChild.required<ElementRef>('aboutSection');
  private readonly experienceSection = viewChild.required<ElementRef>('experienceSection');
  private readonly skillsSection     = viewChild.required<ElementRef>('skillsSection');
  private readonly projectsSection   = viewChild.required<ElementRef>('projectsSection');
  private readonly contactSection    = viewChild.required<ElementRef>('contactSection');

  // ── Card refs ────────────────────────────────────────────────────────────

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
      this.#initParallax();
    });
  }

  // ── Lenis ─────────────────────────────────────────────────────────────────

  #initLenis(): void {
    this.#lenis = new Lenis({
      lerp: 0.075,
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

  // ── Parallax ──────────────────────────────────────────────────────────────

  #initParallax(): void {
    const heroEl  = this.heroSectionRef().nativeElement as HTMLElement;

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

    // ── Hero multi-layer parallax ─────────────────────────────────────────
    // Each element exits at a different speed (depth illusion)
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: '+=680',
        scrub: 1.2,
      },
    });

    const heroLabel   = heroEl.querySelector('.hero-label')   as HTMLElement;
    const heroName    = heroEl.querySelector('.hero-name')    as HTMLElement;
    const heroRole    = heroEl.querySelector('.hero-role')    as HTMLElement;
    const heroTagline = heroEl.querySelector('.hero-tagline') as HTMLElement;
    const scrollCue   = heroEl.querySelector('.scroll-cue')   as HTMLElement;
    const heroKanji   = heroEl.querySelector('.kanji')        as HTMLElement;

    heroTl
      .to(heroKanji,   { y: -160, opacity: 0, ease: 'none' }, 0)     // 0.20× speed feel
      .to(heroTagline, { y: -50,  opacity: 0, ease: 'none' }, 0)     // 0.70×
      .to(heroRole,    { y: -70,  opacity: 0, ease: 'none' }, 0)     // 0.85×
      .to(heroLabel,   { y: -85,  opacity: 0, ease: 'none' }, 0)     // surface
      .to(heroName,    { y: -100, opacity: 0, ease: 'none' }, 0)     // 1.00×
      .to(scrollCue,   { y: -40,  opacity: 0, ease: 'none' }, 0);

    // ── Background kanji per section: drift upward at 0.35× ──────────────
    sections.forEach(sectionEl => {
      const kanji = sectionEl.querySelector('.kanji') as HTMLElement | null;
      if (!kanji) return;
      gsap.to(kanji, {
        y: -110,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // ── Section labels: drift up at 0.55× ────────────────────────────────
    sections.forEach(sectionEl => {
      const label = sectionEl.querySelector('.section__label') as HTMLElement | null;
      if (!label) return;
      gsap.set(label, { opacity: 0, y: 20 });
      gsap.to(label, {
        opacity: 1, y: 0,
        duration: 0.7, delay: 0.1,
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      });
      // Gentle ongoing parallax once visible
      gsap.to(label, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top center',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // ── Card entrance: 3D rotateY slide-in ───────────────────────────────
    cards.forEach(({ el, isLeft }) => {
      gsap.set(el, { opacity: 0, x: isLeft ? -65 : 65, rotateY: isLeft ? -14 : 14 });
    });

    cards.forEach(({ el }, i) => {
      gsap.to(el, {
        opacity: 1, x: 0, rotateY: 0,
        ease: 'power3.out',
        duration: 0.85,
        scrollTrigger: {
          trigger: sections[i],
          start: 'top 76%',
          toggleActions: 'play none none reverse',
        },
      });

      // Depth float: card drifts upward slowly as you scroll through
      gsap.to(el, {
        y: -36,
        ease: 'none',
        scrollTrigger: {
          trigger: sections[i],
          start: 'top center',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // ── Background hue tween ─────────────────────────────────────────────
    sections.forEach((sectionEl, idx) => {
      gsap.to(this.#hueProxy, {
        hue: SECTION_HUES[idx + 1],
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.5,
          onUpdate: () =>
            document.documentElement.style.setProperty(
              '--bg-hue', String(Math.round(this.#hueProxy.hue)),
            ),
          onLeaveBack: () =>
            gsap.to(this.#hueProxy, {
              hue: SECTION_HUES[idx],
              duration: 0.7,
              onUpdate: () =>
                document.documentElement.style.setProperty(
                  '--bg-hue', String(Math.round(this.#hueProxy.hue)),
                ),
            }),
        },
      });
    });

    // ── Active section signals ────────────────────────────────────────────
    sections.forEach((sectionEl, idx) => {
      ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 55%',
        end:   'bottom 55%',
        onEnter:     () => this.#scrollState.activeSection.set((idx + 1) as ActiveSection),
        onEnterBack: () => this.#scrollState.activeSection.set((idx + 1) as ActiveSection),
        onLeaveBack: () => { if (idx === 0) this.#scrollState.activeSection.set(0); },
      });
    });

    // ── Overall scroll progress ───────────────────────────────────────────
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
