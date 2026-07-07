import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ScrollLayoutComponent } from './scroll-layout.component';
import { SECTIONS } from '../../core/models/section.types';

// The Lenis/GSAP/ScrollTrigger pipeline is set up inside afterNextRender, which
// Angular does not run on the server platform. Mounting with PLATFORM_ID
// 'server' therefore renders the template without instantiating Lenis or GSAP,
// letting us assert the DOM contract that hash deep-linking (FR-10) relies on:
// the ordered section elements #applyHash scrolls to via #orderedSections[index].
//
// The hash -> ActiveSection index mapping itself is a pure function covered by
// section.types.spec.ts. Driving #applyHash end-to-end (browser platform +
// afterNextRender firing the real Lenis/GSAP init) would require mocking that
// entire scroll pipeline for no additional correctness coverage, so it is
// deliberately not attempted here.
describe('ScrollLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollLayoutComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
  });

  it('renders the hero section plus one section per SectionId', () => {
    const fixture = TestBed.createComponent(ScrollLayoutComponent);
    fixture.detectChanges();
    const sections = fixture.nativeElement.querySelectorAll('.section');
    expect(fixture.nativeElement.querySelector('.section--hero')).not.toBeNull();
    // hero + the five content sections
    expect(sections).toHaveLength(SECTIONS.length + 1);
  });

  it('gives every SectionId a matching element id for hash deep-linking to target', () => {
    const fixture = TestBed.createComponent(ScrollLayoutComponent);
    fixture.detectChanges();
    SECTIONS.forEach((section) => {
      expect(fixture.nativeElement.querySelector(`#${section.id}`)).not.toBeNull();
    });
  });

  it('orders the content section ids to match SECTIONS (so index i+1 resolves correctly)', () => {
    const fixture = TestBed.createComponent(ScrollLayoutComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const domIds = Array.from(root.querySelectorAll<HTMLElement>('.section[id]')).map(
      (el) => el.id,
    );
    expect(domIds).toEqual(SECTIONS.map((s) => s.id));
  });
});
