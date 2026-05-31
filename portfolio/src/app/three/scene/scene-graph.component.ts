import { Component } from '@angular/core';
import { LightingComponent }        from '../environment/lighting.component';
import { ParticlesComponent }       from '../environment/particles.component';
import { MaskComponent }            from '../mask/mask.component';
import { SceneControllerComponent } from './scene-controller.component';
import { FloatingModelsComponent }  from '../floating-models/floating-models.component';

/**
 * Scene graph rendered inside NgtCanvas.
 *
 * Kakashi has been removed — the ANBU mask is the primary 3D focal element,
 * transitioning from a large hero centrepiece to per-section decorations.
 *
 * Order matters:
 *  1. SceneController — sets fog + camera parallax first
 *  2. Lighting        — reactive per-section colour
 *  3. Mask            — hero focal point / About decoration
 *  4. FloatingModels  — book (Experience) + kunai (Skills)
 *  5. Particles       — ambient dust rendered last
 */
@Component({
  selector: 'app-scene-graph',
  standalone: true,
  imports: [
    SceneControllerComponent,
    LightingComponent,
    MaskComponent,
    FloatingModelsComponent,
    ParticlesComponent,
  ],
  template: `
    <app-scene-controller />
    <app-lighting />
    <app-mask />
    <app-floating-models />
    <app-particles />
  `,
})
export class SceneGraphComponent {}
