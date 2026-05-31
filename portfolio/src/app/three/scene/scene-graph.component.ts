import { Component } from '@angular/core';
import { LightingComponent }        from '../environment/lighting.component';
import { ParticlesComponent }       from '../environment/particles.component';
import { KakashiComponent }         from '../kakashi/kakashi.component';
import { MaskComponent }            from '../mask/mask.component';
import { SceneControllerComponent } from './scene-controller.component';
import { FloatingModelsComponent }  from '../floating-models/floating-models.component';

/**
 * Scene graph rendered inside NgtCanvas.
 *
 * Order matters:
 *  1. SceneController — sets fog + drives camera, runs first
 *  2. Lighting        — reactive colours follow scroll state
 *  3. Kakashi         — shifts laterally per section
 *  4. Mask            — fades prominently on About
 *  5. FloatingModels  — book + kunai appear on their sections
 *  6. Particles       — ambient dust on top of everything
 */
@Component({
  selector: 'app-scene-graph',
  standalone: true,
  imports: [
    SceneControllerComponent,
    LightingComponent,
    KakashiComponent,
    MaskComponent,
    FloatingModelsComponent,
    ParticlesComponent,
  ],
  template: `
    <app-scene-controller />
    <app-lighting />
    <app-kakashi />
    <app-mask />
    <app-floating-models />
    <app-particles />
  `,
})
export class SceneGraphComponent {}
