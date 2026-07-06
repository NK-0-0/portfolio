import { Component } from '@angular/core';
import { LightingComponent }        from '../environment/lighting.component';
import { ParticlesComponent }       from '../environment/particles.component';
import { HudCoreComponent }         from '../hud-core/hud-core.component';
import { SceneControllerComponent } from './scene-controller.component';
import { DataShardComponent }       from '../data-shard/data-shard.component';
import { DroneComponent }           from '../drone/drone.component';

/**
 * Scene graph rendered inside NgtCanvas.
 *
 * Three procedural props (zero GLBs) — HUD-core (focal), data-shard (Experience),
 * and one drone reused across Skills + Projects. They preserve the previous
 * props' per-section lerp targets like-for-like; the earlier GLB-based props and
 * their assets were removed in Milestone 1.
 *
 * Order matters:
 *  1. SceneController — sets fog + camera parallax first
 *  2. Lighting        — reactive per-section colour
 *  3. HudCore         — hero focal point / About decoration
 *  4. DataShard       — Experience prop
 *  5. Drone           — Skills + Projects prop (reused)
 *  6. Particles       — ambient dust rendered last
 */
@Component({
  selector: 'app-scene-graph',
  standalone: true,
  imports: [
    SceneControllerComponent,
    LightingComponent,
    HudCoreComponent,
    DataShardComponent,
    DroneComponent,
    ParticlesComponent,
  ],
  template: `
    <app-scene-controller />
    <app-lighting />
    <app-hud-core />
    <app-data-shard />
    <app-drone />
    <app-particles />
  `,
})
export class SceneGraphComponent {}
