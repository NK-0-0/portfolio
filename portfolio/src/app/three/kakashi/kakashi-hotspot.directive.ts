import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectStore } from 'angular-three';
import { Raycaster, Vector2, Mesh, Object3D } from 'three';
import type { SectionId } from '../../core/models/section.types';
import { SectionStore } from '../../core/services/section-store';
import { MASK_OBJECT_NAME } from '../mask/mask.component';

/**
 * HOTSPOT_MAP — maps Three.js mesh names to portfolio section IDs.
 *
 * HOW TO FILL THIS IN:
 * 1. Run `npm start` and open the browser DevTools console.
 * 2. Look for the "[Kakashi] mesh names:" log printed by KakashiComponent.
 * 3. Identify which names correspond to the face, book, kunai, ANBU mask patch,
 *    and headband on the model.
 * 4. Replace the placeholder keys below with those exact strings.
 *
 * The current values are best-guess placeholders based on common Sketchfab exports.
 * You MUST update them for hotspot detection to work on the real model.
 */
const HOTSPOT_MAP: Record<string, SectionId> = {
  // ── Kakashi character meshes (update with real names from gltf.report) ──
  'Head':        'about',
  'Face':        'about',
  'Sharingan':   'about',
  'Book':        'experience',
  'Icha_Icha':   'experience',
  'Kunai':       'skills',
  'Belt_Pouch':  'skills',
  'Hitai_ate':   'contact',
  'Headband':    'contact',

  // ── Floating ANBU mask (separate model — uses scene-root name) ──
  [MASK_OBJECT_NAME]: 'projects',
};

/**
 * Placed on the canvas wrapper `<div>` in SceneComponent.
 * Listens to pointer events, performs Three.js raycasting each frame,
 * and updates SectionStore with what is hovered / clicked.
 *
 * Does NOT belong inside the NGT scene graph — it is a DOM-level directive
 * that accesses the Three.js context via `injectStore()`.
 * `injectStore()` works here because SceneComponent provides NgtCanvas
 * and this directive lives in the same injector subtree.
 */
@Directive({
  selector: '[appKakashiHotspot]',
  standalone: true,
})
export class KakashiHotspotDirective implements OnInit, OnDestroy {
  readonly sectionHovered = output<SectionId | null>();

  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #el        = inject(ElementRef<HTMLElement>);
  readonly #store     = injectStore();
  readonly #section   = inject(SectionStore);

  readonly #raycaster = new Raycaster();
  readonly #mouse     = new Vector2();

  /** Currently hovered section — shared with EffectsComponent for outline */
  readonly hoveredSection = signal<SectionId | null>(null);

  ngOnInit(): void {
    if (this.#isBrowser) {
      this.#el.nativeElement.style.cursor = 'default';
    }
  }

  ngOnDestroy(): void {}

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.#isBrowser) return;
    this.#updateMouse(event);
    this.#castRay(false);
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.#isBrowser) return;
    this.#updateMouse(event);
    this.#castRay(true);
  }

  #updateMouse(event: MouseEvent): void {
    const rect = this.#el.nativeElement.getBoundingClientRect();
    this.#mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    this.#mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
  }

  #castRay(isClick: boolean): void {
    const { camera, scene } = this.#store.snapshot;
    this.#raycaster.setFromCamera(this.#mouse, camera);

    const intersects = this.#raycaster.intersectObjects(scene.children, true);

    let hitSection: SectionId | null = null;
    const hitMeshes: Mesh[] = [];

    for (const hit of intersects) {
      const sectionId = this.#resolveSectionId(hit.object);
      if (sectionId) {
        hitSection = sectionId;
        if (hit.object instanceof Mesh) {
          hitMeshes.push(hit.object);
        }
        break;
      }
    }

    this.hoveredSection.set(hitSection);
    this.sectionHovered.emit(hitSection);
    this.#section.setHovered(hitSection, hitMeshes);
    this.#el.nativeElement.style.cursor = hitSection ? 'pointer' : 'default';

    if (isClick && hitSection) {
      this.#section.open(hitSection);
    }
  }

  /** Walk up the Object3D hierarchy to find a named hotspot. */
  #resolveSectionId(object: Object3D): SectionId | null {
    let current: Object3D | null = object;
    while (current) {
      if (HOTSPOT_MAP[current.name]) return HOTSPOT_MAP[current.name];
      current = current.parent;
    }
    return null;
  }
}
