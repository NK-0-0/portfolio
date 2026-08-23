import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONTROLS, IDENTITY } from '../../content/portfolio.content';
import { CH } from '../../world/world.model';
import { WorldStateService } from '../../world/world-state.service';

/**
 * The persistent chrome: identity chip, time-of-day clock, chapter nav,
 * controls legend, the world-anchored interact prompt, and the progress bar.
 *
 * All of it reads `WorldStateService`. The original poked these elements from
 * inside the render loop via `querySelector`; here the loop only updates
 * signals and Angular does the DOM writes, so the world no longer knows the
 * HUD exists.
 */
@Component({
  selector: 'app-world-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="chip identity">
        <span class="dot" aria-hidden="true"></span>
        <span class="name">{{ identity.name }}</span>
        <span class="tagline">· {{ identity.tagline }}</span>
      </div>
      <span class="chip clock">{{ state.clock() }}</span>
    </header>

    <nav class="rail surface" aria-label="Chapters">
      @for (chapter of chapters; track chapter.label; let i = $index) {
        <button
          type="button"
          class="rail__link"
          [class.is-near]="state.nearest() === i"
          [attr.aria-current]="state.nearest() === i ? 'true' : null"
          (click)="state.travelTo(i)"
        >
          {{ chapter.label }}<span class="rail__tick" aria-hidden="true"></span>
        </button>
      }
    </nav>

    <div class="legend surface">
      <span class="legend__flags">
        <span class="legend__pip" aria-hidden="true"></span>
        FLAGS {{ state.visitedCount() }}/{{ chapters.length }}
      </span>
      @for (line of controls; track line) {
        <span class="legend__keys">{{ line }}</span>
      }
    </div>

    <div
      class="prompt"
      [class.is-open]="state.promptVisible()"
      [style.left.px]="state.promptX()"
      [style.top.px]="state.promptY()"
      aria-hidden="true"
    >
      <span class="prompt__key">E</span>
      <span class="prompt__label">{{ state.promptText() }}</span>
    </div>

    <div class="progress" role="presentation">
      <div class="progress__fill" [style.width.%]="state.phase() * 100"></div>
    </div>
  `,
  styleUrl: './world-hud.component.scss',
})
export class WorldHudComponent {
  protected readonly state = inject(WorldStateService);
  protected readonly identity = IDENTITY;
  protected readonly chapters = CH;
  protected readonly controls = CONTROLS;
}
