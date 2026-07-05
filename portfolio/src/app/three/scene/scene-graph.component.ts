import { Component } from '@angular/core';
import { LightingComponent }        from '../environment/lighting.component';
import { ParticlesComponent }       from '../environment/particles.component';
import { HudCoreComponent }         from '../hud-core/hud-core.component';
import { SceneControllerComponent } from './scene-controller.component';
import { FloatingModelsComponent }  from '../floating-models/floating-models.component';

/**
 * Scene graph rendered inside NgtCanvas.
 *
 * HUD-core (procedural) is the primary 3D focal element, transitioning from a
 * large hero centrepiece to a per-section decoration. It replaced the ANBU mask
 * like-for-like (same per-section lerp targets), which is now orphaned pending
 * Milestone 1's asset cleanup.
 *
 * Order matters:
 *  1. SceneController — sets fog + camera parallax first
 *  2. Lighting        — reactive per-section colour
 *  3. HudCore         — hero focal point / About decoration
 *  4. FloatingModels  — book (Experience) + kunai (Skills)
 *  5. Particles       — ambient dust rendered last
 */
@Component({
  selector: 'app-scene-graph',
  standalone: true,
  imports: [
    SceneControllerComponent,
    LightingComponent,
    HudCoreComponent,
    FloatingModelsComponent,
    ParticlesComponent,
  ],
  template: `
    <app-scene-controller />
    <app-lighting />
    <app-hud-core />
    <app-floating-models />
    <app-particles />
  `,
})
export class SceneGraphComponent {}
