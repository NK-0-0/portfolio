import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink],
  template: `
    <header class="header">
      <div class="chip identity">
        <!--
          The generated mark (scripts/make-brand.mjs), fieldless variant so it
          sits on the frosted chip rather than punching a navy box through it.
          Referenced rather than inlined so there is one definition of the logo.
        -->
        <img class="mark" src="mark.svg" alt="" width="16" height="16" />
        <span class="name">{{ identity.name }}</span>
        <span class="tagline">· {{ identity.tagline }}</span>
      </div>
      <div class="header__end">
        <!--
          Deliberately prominent. Plenty of readers will not want to walk a
          world to find out where someone worked, and burying the way out is
          how a portfolio loses them.
        -->
        <a class="chip chip--link" routerLink="/read">READ AS A PAGE &rarr;</a>
        <span class="chip clock">{{ state.clock() }}</span>
      </div>
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
      @for (line of controls.keyboard; track line) {
        <span class="legend__line legend__line--keys">{{ line }}</span>
      }
      @for (line of controls.touch; track line) {
        <span class="legend__line legend__line--touch">{{ line }}</span>
      }
    </div>

    <!--
      The prompt doubles as the touch interact control. It already appears
      exactly when an interaction is available and already names it, so making
      it pressable adds the whole touch affordance without adding any UI.
      Hidden from the a11y tree while inactive so it can't be tabbed to.
    -->
    <button
      type="button"
      class="prompt"
      [class.is-open]="state.promptVisible()"
      [style.left.px]="state.promptX()"
      [style.top.px]="state.promptY()"
      [attr.tabindex]="state.promptVisible() ? 0 : -1"
      [attr.aria-hidden]="!state.promptVisible()"
      (click)="state.interact()"
    >
      <span class="prompt__key" aria-hidden="true">E</span>
      <span class="prompt__label">{{ state.promptText() }}</span>
    </button>

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
