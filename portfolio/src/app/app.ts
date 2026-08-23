import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CampfirePanelComponent } from './ui/panels/campfire-panel.component';
import { HillPanelComponent } from './ui/panels/hill-panel.component';
import { JettyPanelComponent } from './ui/panels/jetty-panel.component';
import { ToolbeltPanelComponent } from './ui/panels/toolbelt-panel.component';
import { TrailPanelComponent } from './ui/panels/trail-panel.component';
import { WorksPanelComponent } from './ui/panels/works-panel.component';
import { ProjectDetailComponent } from './ui/project-detail/project-detail.component';
import { WorldHudComponent } from './ui/hud/world-hud.component';
import { PixelWorldComponent } from './world/pixel-world.component';
import { WorldStateService } from './world/world-state.service';

/**
 * Root layout: the canvas world underneath, the DOM overlay on top.
 *
 * Panel visibility comes from a single `activePanel` signal — walking east
 * changes which index is nearest, and each panel fades itself in via CSS.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PixelWorldComponent,
    WorldHudComponent,
    HillPanelComponent,
    WorksPanelComponent,
    ToolbeltPanelComponent,
    TrailPanelComponent,
    JettyPanelComponent,
    CampfirePanelComponent,
    ProjectDetailComponent,
  ],
  template: `
    <app-pixel-world />

    <app-hill-panel [open]="active() === 0" />
    <app-works-panel [open]="active() === 1" />
    <app-toolbelt-panel [open]="active() === 2" />
    <app-trail-panel [open]="active() === 3" />
    <app-jetty-panel [open]="active() === 4" />
    <app-campfire-panel [open]="active() === 5" />

    <app-world-hud />
    <app-project-detail />
  `,
  styleUrl: './app.scss',
})
export class App {
  private readonly state = inject(WorldStateService);
  protected readonly active = this.state.activePanel;
}
