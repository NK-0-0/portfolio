import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

/**
 * Moon-style scene lighting:
 * - Dim ambient fill to preserve shadow depth
 * - Hemisphere sky/ground to simulate open-sky bounce
 * - Strong directional moonlight from upper-right
 * - Rim spotlight from behind-left to silhouette Kakashi
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

    <ngt-directional-light
      [position]="[6, 10, 4]"
      [intensity]="2.2"
      [color]="'#b8d4f0'"
      [castShadow]="true"
    />

    <!-- Rim light: teal tint from back-left for silhouette pop -->
    <ngt-directional-light
      [position]="[-4, 3, -6]"
      [intensity]="1.0"
      [color]="'#00e5ff'"
    />
  `,
})
export class LightingComponent {}
