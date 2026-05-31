import { Component, CUSTOM_ELEMENTS_SCHEMA, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectBeforeRender, injectStore } from 'angular-three';
import { Color, DirectionalLight } from 'three';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/** Moonlight (upper-right directional) colour per section. */
const MOON_COLORS: Color[] = [
  new Color('#b8d4f0'), // hero    — cold moonlight
  new Color('#c8d8f8'), // about   — soft blue-white
  new Color('#d0c0f0'), // exp     — violet-tinged
  new Color('#b0e0d0'), // skills  — teal-mint
  new Color('#f0e0b0'), // projects — warm amber
  new Color('#f0b8b8'), // contact — warm rose
];

/** Rim (back-left directional) colour per section. */
const RIM_COLORS: Color[] = [
  new Color('#00e5ff'), // hero    — cyan
  new Color('#00c8ff'), // about   — sky
  new Color('#9060ff'), // exp     — violet
  new Color('#00ffcc'), // skills  — mint
  new Color('#ffcc00'), // projects — gold
  new Color('#ff6060'), // contact — coral
];

/**
 * Moon-style scene lighting with per-section colour shifts.
 * The template places the lights into the scene.
 * injectBeforeRender lerps their colours based on ScrollStateService.
 */
@Component({
  selector: 'app-lighting',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-ambient-light [intensity]="0.15" />

    <ngt-hemisphere-light
      [skyColor]="'#1a2a4a'"
      [groundColor]="'#0d0d0d'"
      [intensity]="0.4"
    />

    <!-- Moonlight: upper right — identified by position.x = 6 -->
    <ngt-directional-light
      [position]="[6, 10, 4]"
      [intensity]="2.2"
      [color]="'#b8d4f0'"
      [castShadow]="true"
    />

    <!-- Rim light: back-left — identified by position.x = -4 -->
    <ngt-directional-light
      [position]="[-4, 3, -6]"
      [intensity]="1.0"
      [color]="'#00e5ff'"
    />
  `,
})
export class LightingComponent {
  readonly #isBrowser   = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #store       = injectStore();
  readonly #scrollState = inject(ScrollStateService);

  // Cached light refs (populated on first traverse to avoid per-frame allocation)
  #moonLight: DirectionalLight | null = null;
  #rimLight:  DirectionalLight | null = null;

  constructor() {
    injectBeforeRender(({ delta }) => {
      if (!this.#isBrowser) return;

      // Lazy-find the two directional lights once
      if (!this.#moonLight || !this.#rimLight) {
        this.#store.snapshot.scene.traverse(obj => {
          if (!(obj instanceof DirectionalLight)) return;
          if (obj.position.x > 5)       this.#moonLight = obj;
          else if (obj.position.x < -3) this.#rimLight  = obj;
        });
        return; // wait one frame after finding them
      }

      const section = this.#scrollState.activeSection();
      const lf = Math.min(delta * 1.8, 1);
      this.#moonLight.color.lerp(MOON_COLORS[section], lf);
      this.#rimLight.color.lerp(RIM_COLORS[section],   lf);
    });
  }
}
