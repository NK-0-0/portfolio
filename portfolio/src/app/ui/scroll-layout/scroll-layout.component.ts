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
import { sectionIndexFromHash } from '../../core/models/section.types';
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
 *  0.20× — background decorative HUD glyphs (aria-hidden, never the label)
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
      <!-- Deep-parallax decorative HUD glyph (Boot Sequence) — moves slowest, aria-hidden -->
      <svg class="hud-glyph hud-glyph--hero" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M12 30V12H30M108 90V108H90" />
        <circle cx="60" cy="62" r="24" />
        <path d="M60 30V60" />
      </svg>

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
      <!-- Identity Core glyph — decorative, aria-hidden -->
      <svg class="hud-glyph" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M12 30V12H30M108 90V108H90" />
        <path d="M60 26 94 60 60 94 26 60Z" />
        <path d="M60 44 76 60 60 76 44 60Z" />
        <circle class="dot" cx="60" cy="60" r="3" />
      </svg>
      <p class="section__label">01 &nbsp;/&nbsp; About</p>
      <div class="section-card section-card--left" #aboutCard>
        <app-about />
      </div>
    </section>

    <!-- ── Experience ─────────────────────────────────────────── right -->
    <section class="section" id="experience" #experienceSection>
      <!-- Mission Log glyph — decorative, aria-hidden -->
      <svg class="hud-glyph" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M12 30V12H30M108 90V108H90" />
        <path d="M40 40V80" />
        <path d="M40 48H80" />
        <path d="M40 60H72" />
        <path d="M40 72H64" />
      </svg>
      <p class="section__label section__label--right">02 &nbsp;/&nbsp; Experience</p>
      <div class="section-card section-card--right" #experienceCard>
        <app-experience />
      </div>
    </section>

    <!-- ── Skills ─────────────────────────────────────────────── left -->
    <section class="section" id="skills" #skillsSection>
      <!-- Loadout glyph — decorative, aria-hidden -->
      <svg class="hud-glyph" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M12 30V12H30M108 90V108H90" />
        <path d="M60 30 86 45 86 75 60 90 34 75 34 45Z" />
        <circle cx="60" cy="60" r="11" />
      </svg>
      <p class="section__label">03 &nbsp;/&nbsp; Skills</p>
      <div class="section-card section-card--left" #skillsCard>
        <app-skills />
      </div>
    </section>

    <!-- ── Projects (clean parallax) ──────────────────────────── right -->
    <section class="section section--clean" id="projects" #projectsSection>
      <!-- Deployed Constructs glyph — decorative, aria-hidden -->
      <svg class="hud-glyph" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M12 30V12H30M108 90V108H90" />
        <rect x="36" y="36" width="30" height="30" />
        <rect x="54" y="54" width="30" height="30" />
      </svg>
      <p class="section__label section__label--right">04 &nbsp;/&nbsp; Projects</p>
      <div class="section-card section-card--right" #projectsCard>
        <app-projects />
      </div>
    </section>

    <!-- ── Contact (clean parallax) ───────────────────────────── left -->
    <section class="section section--clean" id="contact" #contactSection>
      <!-- Uplink glyph — decorative, aria-hidden -->
      <svg class="hud-glyph" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M12 30V12H30M108 90V108H90" />
        <circle class="dot" cx="60" cy="84" r="3.5" />
        <path d="M60 84V62" />
        <path d="M44 58A24 24 0 0 1 76 58" />
        <path d="M34 48A38 38 0 0 1 86 48" />
      </svg>
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
  /** [hero, about, experience, skills, projects, contact], indexed by ActiveSection. */
  #orderedSections: HTMLElement[] = [];
  readonly #onHashChange = (): void => this.#applyHash(window.location.hash, true);

  constructor() {
    afterNextRender(() => {
      if (!this.#isBrowser) return;
      gsap.registerPlugin(ScrollTrigger);
      this.#initLenis();
      this.#initParallax();
      // Deep-link on load: snap (never smooth-scroll) to a hashed section once
      // ScrollTrigger.refresh() has computed positions inside #initParallax.
      if (window.location.hash) this.#applyHash(window.location.hash, false);
      window.addEventListener('hashchange', this.#onHashChange);
    });
  }

  // ── Hash deep-linking (FR-10) ──────────────────────────────────────────────

  /**
   * Scroll to the section named by `hash` and sync `activeSection` immediately.
   * Section elements carry `id`s matching their `SectionId`, so Lenis's own
   * `scrollTo` keeps its internal offset in sync — a native hash jump or
   * `scrollIntoView` alone would desync it. `animated` false (initial load) or
   * reduced-motion forces an instant snap. Unknown/empty hash → hero/top.
   */
  #applyHash(hash: string, animated: boolean): void {
    if (!this.#lenis) return;
    const index = sectionIndexFromHash(hash) ?? 0;
    const immediate = !animated || this.#prefersReducedMotion();

    // Pass Lenis an absolute document offset, not the `#id` selector: a native
    // hash-jump momentarily desyncs the element's getBoundingClientRect from
    // Lenis's internal scroll, so the selector path computes a stale target.
    this.#lenis.scrollTo(this.#documentOffsetTop(this.#orderedSections[index]), { immediate });
    this.#scrollState.activeSection.set(index);
  }

  /** Absolute Y of an element from the document top — scroll- and Lenis-independent. */
  #documentOffsetTop(el?: HTMLElement): number {
    let y = 0;
    let node: HTMLElement | null = el ?? null;
    while (node) {
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return y;
  }

  #prefersReducedMotion(): boolean {
    return this.#isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    this.#orderedSections = [heroEl, ...sections];

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
    const heroGlyph   = heroEl.querySelector('.hud-glyph')    as HTMLElement;

    heroTl
      .to(heroGlyph,   { y: -160, opacity: 0, ease: 'none' }, 0)     // 0.20× speed feel
      .to(heroTagline, { y: -50,  opacity: 0, ease: 'none' }, 0)     // 0.70×
      .to(heroRole,    { y: -70,  opacity: 0, ease: 'none' }, 0)     // 0.85×
      .to(heroLabel,   { y: -85,  opacity: 0, ease: 'none' }, 0)     // surface
      .to(heroName,    { y: -100, opacity: 0, ease: 'none' }, 0)     // 1.00×
      .to(scrollCue,   { y: -40,  opacity: 0, ease: 'none' }, 0);

    // ── Background HUD glyph per section: drift upward at 0.35× ──────────
    sections.forEach(sectionEl => {
      const glyph = sectionEl.querySelector('.hud-glyph') as HTMLElement | null;
      if (!glyph) return;
      gsap.to(glyph, {
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
    if (this.#isBrowser) window.removeEventListener('hashchange', this.#onHashChange);
    if (this.#rafId !== undefined) cancelAnimationFrame(this.#rafId);
    this.#lenis?.destroy();
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
