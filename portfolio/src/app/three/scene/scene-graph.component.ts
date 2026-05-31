import { Component } from '@angular/core';
import { LightingComponent }  from '../environment/lighting.component';
import { ParticlesComponent } from '../environment/particles.component';
import { KakashiComponent }   from '../kakashi/kakashi.component';
import { MaskComponent }      from '../mask/mask.component';

/**
 * Scene graph rendered inside NgtCanvas.
 * Lighting, Kakashi (idle-animated), floating ANBU mask, and ambient particles.
 * Raycasting and post-processing removed — interaction is now scroll-driven.
 */
@Component({
  selector: 'app-scene-graph',
  standalone: true,
  imports: [LightingComponent, KakashiComponent, MaskComponent, ParticlesComponent],
  template: `
    <app-lighting />
    <app-kakashi />
    <app-mask />
    <app-particles />
  `,
})
export class SceneGraphComponent {}
