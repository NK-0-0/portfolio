import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { beforeRender } from 'angular-three';
import {
  BufferGeometry,
  PointsMaterial,
  AdditiveBlending,
  Float32BufferAttribute,
  BufferAttribute,
} from 'three';

const PARTICLE_COUNT = 120;

/**
 * Floating dust-mote / leaf particles that drift across the scene.
 * Particles are scattered in a volume around the focal prop and animate
 * with a slow upward drift + sinusoidal sway each frame.
 */
@Component({
  selector: 'app-particles',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (isBrowser) {
      <ngt-points [geometry]="geometry" [material]="material" />
    }
  `,
})
export class ParticlesComponent implements OnInit {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly geometry = new BufferGeometry();
  readonly material = new PointsMaterial({
    color: 0x00e5ff,
    size: 0.025,
    transparent: true,
    opacity: 0.45,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  #positions = new Float32Array(PARTICLE_COUNT * 3);
  #velocities = new Float32Array(PARTICLE_COUNT);
  #phases = new Float32Array(PARTICLE_COUNT);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.#positions[i * 3]     = (Math.random() - 0.5) * 8;
      this.#positions[i * 3 + 1] = (Math.random() - 0.5) * 5 + 1;
      this.#positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      this.#velocities[i] = 0.04 + Math.random() * 0.06;
      this.#phases[i]     = Math.random() * Math.PI * 2;
    }
    this.geometry.setAttribute('position', new Float32BufferAttribute(this.#positions, 3));
  }

  constructor() {
    let elapsed = 0;

    beforeRender(({ delta }) => {
      if (!this.isBrowser) return;
      elapsed += delta;

      const attr = this.geometry.attributes['position'] as BufferAttribute;
      const pos  = attr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        pos[idx + 1] += this.#velocities[i] * delta;
        pos[idx]     += Math.sin(elapsed + this.#phases[i]) * 0.004;
        if (pos[idx + 1] > 4) pos[idx + 1] = -2;
      }
      attr.needsUpdate = true;
    });
  }
}
