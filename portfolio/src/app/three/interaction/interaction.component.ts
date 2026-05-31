import {
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectStore } from 'angular-three';
import { Raycaster, Vector2, Mesh, Object3D } from 'three';
import type { SectionId } from '../../core/models/section.types';
import { SectionStore } from '../../core/services/section-store';
import { MASK_OBJECT_NAME } from '../mask/mask.component';

/**
 * HOTSPOT_MAP — maps Three.js Object3D.name values to portfolio sections.
 *
 * ── HOW TO UPDATE ────────────────────────────────────────────────────
 * 1. Run `npm start` and open the browser DevTools console.
 * 2. Find the "[Kakashi] mesh names:" log printed by KakashiComponent.
 * 3. Identify which names belong to the face, book, kunai, headband.
 * 4. Replace the placeholder keys below with the exact strings from the log.
 *
 * The hierarchy walk (#resolveSectionId) checks parent nodes too, so
 * mapping the root group name works even if the raycast hits a child mesh.
 *
 * Current values are placeholder guesses — they MUST be updated.
 * ────────────────────────────────────────────────────────────────────
 */
const HOTSPOT_MAP: Record<string, SectionId> = {
  // ── Kakashi character (replace with real names from DevTools log) ──
  'Head':       'about',
  'Face':       'about',
  'Sharingan':  'about',
  'Book':       'experience',
  'Icha_Icha':  'experience',
  'Kunai':      'skills',
  'Belt_Pouch': 'skills',
  'Hitai_ate':  'contact',
  'Headband':   'contact',

  // ── Floating ANBU mask (matched by the scene-root name we set) ──
  [MASK_OBJECT_NAME]: 'projects',
};

/**
 * Handles pointer raycasting INSIDE the NGT scene graph so that
 * `injectStore()` (which requires the NgtCanvas DI context) is valid.
 *
 * Attaches mousemove / click listeners directly to the WebGLRenderer's
 * canvas DOM element after the canvas is initialised.
 *
 * On hit: updates SectionStore (hover state, selected meshes) and changes
 * the canvas cursor. On click: opens the corresponding section panel.
 */
@Component({
  selector: 'app-interaction',
  standalone: true,
  template: '',
})
export class InteractionComponent implements OnDestroy {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #store     = injectStore();
  readonly #section   = inject(SectionStore);

  readonly #raycaster = new Raycaster();
  readonly #mouse     = new Vector2();
  #cleanup?: () => void;

  constructor() {
    if (!this.#isBrowser) return;

    afterNextRender(() => {
      const canvas = this.#store.snapshot.gl.domElement;

      const onMove  = (e: MouseEvent) => this.#cast(e, canvas, false);
      const onClick = (e: MouseEvent) => this.#cast(e, canvas, true);

      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('click', onClick);
      this.#cleanup = () => {
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('click', onClick);
      };
    });
  }

  #cast(event: MouseEvent, canvas: HTMLCanvasElement, isClick: boolean): void {
    const rect = canvas.getBoundingClientRect();
    this.#mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    this.#mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

    const { camera, scene } = this.#store.snapshot;
    this.#raycaster.setFromCamera(this.#mouse, camera);

    const intersects = this.#raycaster.intersectObjects(scene.children, true);

    let hitSection: SectionId | null = null;
    const hitMeshes: Mesh[] = [];

    for (const hit of intersects) {
      const id = this.#resolveSectionId(hit.object);
      if (id) {
        hitSection = id;
        if (hit.object instanceof Mesh) hitMeshes.push(hit.object);
        break;
      }
    }

    this.#section.setHovered(hitSection, hitMeshes);
    canvas.style.cursor = hitSection ? 'pointer' : 'default';

    if (isClick && hitSection) this.#section.open(hitSection);
  }

  /** Walk Object3D hierarchy upward to find a named hotspot entry. */
  #resolveSectionId(object: Object3D): SectionId | null {
    let node: Object3D | null = object;
    while (node) {
      if (HOTSPOT_MAP[node.name]) return HOTSPOT_MAP[node.name];
      node = node.parent;
    }
    return null;
  }

  ngOnDestroy(): void {
    this.#cleanup?.();
  }
}
