import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CampfirePanelComponent } from '../panels/campfire-panel.component';
import { HillPanelComponent } from '../panels/hill-panel.component';
import { JettyPanelComponent } from '../panels/jetty-panel.component';
import { ToolbeltPanelComponent } from '../panels/toolbelt-panel.component';
import { TrailPanelComponent } from '../panels/trail-panel.component';
import { WorksPanelComponent } from '../panels/works-panel.component';
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { WorldHudComponent } from '../hud/world-hud.component';
import { PixelWorldComponent } from '../../world/pixel-world.component';
import { WorldStateService } from '../../world/world-state.service';

/**
 * The interactive world: canvas underneath, DOM overlay on top.
 *
 * Panel visibility comes from a single `activePanel` signal — walking east
 * changes which index is nearest, and each panel fades itself in via CSS.
 *
 * This is the default route. `/read` renders the same content as a plain
 * document for anyone who would rather skim than walk.
 */
@Component({
  selector: 'app-world-shell',
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
  styleUrl: './world-shell.component.scss',
})
export class WorldShellComponent {
  private readonly state = inject(WorldStateService);
  protected readonly active = this.state.activePanel;
}
