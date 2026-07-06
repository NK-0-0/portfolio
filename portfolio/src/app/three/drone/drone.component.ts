import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { beforeRender, NgtArgs } from 'angular-three';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  IcosahedronGeometry,
  BoxGeometry,
  Color,
} from 'three';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/**
 * Drone / signal-module — the Skills + Projects floating prop (procedural, no GLB).
 *
 * Replaces the kunai GLB. An `IcosahedronGeometry` core with four radiating
 * `BoxGeometry` struts capped by small emissive nodes — a satellite/relay
 * silhouette that stays visually distinct from HUD-core (torus-ringed focal) and
 * the data-shard (flat tablet).
 *
 * ONE prop reused across two sections (VISION.md "don't commission >2–3 props"):
 *   Skills   (section 3): parked right, node accents recolour terminal-green
 *   Projects (section 4): parked left,  node accents recolour live-amber
 * Green/amber are the section-named accent colours from FR-3 (element-level, not
 * the cyan↔magenta beat-sheet rim/fog axis — recolouring the 3D rim/fog to the
 * new axis is Milestone 3's job, not this swap).
 *
 * Position/scale/opacity and the idle spin are a like-for-like copy of the old
 * kunai target block so this changes *what* renders, not *when/where* it moves.
 */
const BODY_COLOR = 0x1a1e27; // matte gunmetal
const SKILLS_GREEN = 0x39ff9d;
const PROJECTS_AMBER = 0xffcc00;
const EMISSIVE_INTENSITY = 1.5; // FR-3 range 1.2–1.8

@Component({
  selector: 'app-drone',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (drone(); as group) {
        <ngt-primitive *args="[group]" />
      }
    }
  `,
})
export class DroneComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #scrollState = inject(ScrollStateService);

  readonly drone = signal<Group | null>(null);
  #group: Group | null = null;

  // Accent materials whose emissive is recoloured per section.
  readonly #accentMaterials: MeshStandardMaterial[] = [];
  readonly #accentColor = new Color(SKILLS_GREEN);
  readonly #targetColor = new Color(SKILLS_GREEN);

  #opacity = 0;
  #elapsed = 0;

  constructor() {
    if (this.isBrowser) {
      this.#group = this.#buildDrone();
      // Reused verbatim from the old kunai's first-frame park position.
      this.#group.position.set(8, 2.0, -1.5);
      this.drone.set(this.#group);
    }

    beforeRender(({ delta }) => {
      if (!this.#group) return;

      this.#elapsed += delta;
      const section = this.#scrollState.activeSection();

      // Reused verbatim from floating-models kunai target block.
      const targetOpacity = section === 3 || section === 4 ? 1.0 : 0.0;
      this.#opacity += (targetOpacity - this.#opacity) * Math.min(delta * 2.5, 1);

      const targetX = section === 4 ? -2.2 : 2.8; // right for Skills, left for Projects
      this.#group.position.x += (targetX - this.#group.position.x) * Math.min(delta * 3, 1);

      const t = this.#elapsed;
      this.#group.position.y = 2.0 + Math.sin(t * 1.1) * 0.14;
      this.#group.position.z = -1.5;
      this.#group.rotation.z += delta * 0.5; // idle spin

      // Recolour node accents to the active section's element-accent hue.
      this.#targetColor.set(section === 4 ? PROJECTS_AMBER : SKILLS_GREEN);
      this.#accentColor.lerp(this.#targetColor, Math.min(delta * 2.5, 1));
      for (const mat of this.#accentMaterials) {
        mat.emissive.copy(this.#accentColor);
      }

      this.#applyOpacity(this.#group, this.#opacity);
    });
  }

  #buildDrone(): Group {
    const group = new Group();

    const bodyMaterial = new MeshStandardMaterial({
      color: BODY_COLOR,
      roughness: 0.7,
      metalness: 0.8,
    });

    group.add(new Mesh(new IcosahedronGeometry(0.5, 0), bodyMaterial));

    const strutGeometry = new BoxGeometry(0.09, 0.09, 0.7);
    const nodeGeometry = new IcosahedronGeometry(0.11, 0);

    // Four struts radiating in the XZ plane at 90° intervals, each capped by an
    // emissive node. Nodes are the only emissive surfaces (accent-only rule).
    for (let i = 0; i < 4; i++) {
      const arm = new Group();
      arm.rotation.y = (i * Math.PI) / 2;

      const strut = new Mesh(strutGeometry, bodyMaterial);
      strut.position.z = 0.6;
      arm.add(strut);

      const nodeMaterial = new MeshStandardMaterial({
        color: BODY_COLOR,
        emissive: SKILLS_GREEN,
        emissiveIntensity: EMISSIVE_INTENSITY,
        roughness: 0.4,
        metalness: 0.0,
      });
      this.#accentMaterials.push(nodeMaterial);

      const node = new Mesh(nodeGeometry, nodeMaterial);
      node.position.z = 0.98;
      arm.add(node);

      group.add(arm);
    }

    return group;
  }

  #applyOpacity(root: Group, opacity: number): void {
    root.traverse(obj => {
      if (!(obj instanceof Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats as MeshStandardMaterial[]) {
        mat.transparent = true;
        mat.opacity = opacity;
        mat.depthWrite = opacity > 0.5; // avoid z-fighting while fading
      }
    });
  }
}
