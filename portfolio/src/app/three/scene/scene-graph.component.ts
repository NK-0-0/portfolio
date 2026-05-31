import { Component } from '@angular/core';
import { LightingComponent } from '../environment/lighting.component';
import { ParticlesComponent } from '../environment/particles.component';
import { KakashiComponent } from '../kakashi/kakashi.component';
import { MaskComponent } from '../mask/mask.component';
import { EffectsComponent } from '../post-processing/effects.component';
import { InteractionComponent } from '../interaction/interaction.component';

/**
 * Scene graph rendered inside NgtCanvas.
 * Composes all 3D elements: lighting, the Kakashi character,
 * the floating ANBU mask, ambient particles, post-processing, and
 * the interaction manager (raycasting — must live inside the canvas context).
 */
@Component({
  selector: 'app-scene-graph',
  standalone: true,
  imports: [
    LightingComponent,
    KakashiComponent,
    MaskComponent,
    ParticlesComponent,
    EffectsComponent,
    InteractionComponent,
  ],
  template: `
    <app-lighting />
    <app-kakashi />
    <app-mask />
    <app-particles />
    <app-effects />
    <app-interaction />
  `,
})
export class SceneGraphComponent {}
