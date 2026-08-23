import { ChangeDetectionStrategy, Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { EMPTY_SLOTS, PROJECTS, WORKS } from '../../content/portfolio.content';
import { WorldStateService } from '../../world/world-state.service';

/** Horizontal scroll step, one tile plus its gap. */
const RAIL_STEP = 258;

/**
 * Panel 01 — the project rail above the stage.
 *
 * Sits across the top rather than beside the avatar, so it can show several
 * projects at once. Tiles open the detail overlay; empty slots are inert
 * placeholders that disappear as `PROJECTS` grows.
 */
@Component({
  selector: 'app-works-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel panel--rail',
    '[class.is-open]': 'open()',
    'data-panel': '1',
  },
  template: `
    <div class="chip caption">
      <span class="eyebrow">{{ copy.eyebrow }}</span>
      <span class="meta">{{ copy.note }}</span>
    </div>

    <div class="row">
      <button type="button" class="nudge" aria-label="Scroll projects left" (click)="scroll(-1)">
        &lsaquo;
      </button>

      <ul #rail class="rail" data-rail>
        @for (project of projects; track project.title; let i = $index) {
          <li>
            <button
              type="button"
              class="card"
              [class.card--featured]="project.featured"
              (click)="state.openDetail(i)"
            >
              <span class="card__head">
                <span class="card__kind" [class.card__kind--web]="project.tone === 'web'">{{
                  project.kind
                }}</span>
                <span class="card__year">{{ project.year }}</span>
              </span>
              <span class="card__title">{{ project.title }}</span>
              <span class="card__stack">{{ project.stack }}</span>
              <span class="card__blurb">{{ project.blurb }}</span>
              <span class="card__cta">OPEN &rarr;</span>
            </button>
          </li>
        }
        @for (slot of slots; track slot.label) {
          <li>
            <div class="card card--empty">
              <span class="card__kind card__kind--muted">{{ slot.label }}</span>
              <span class="card__blurb">{{ slot.blurb }}</span>
            </div>
          </li>
        }
      </ul>

      <button type="button" class="nudge" aria-label="Scroll projects right" (click)="scroll(1)">
        &rsaquo;
      </button>
    </div>
  `,
  styleUrl: './works-panel.component.scss',
})
export class WorksPanelComponent {
  readonly open = input.required<boolean>();
  protected readonly state = inject(WorldStateService);
  protected readonly copy = WORKS;
  protected readonly projects = PROJECTS;
  protected readonly slots = EMPTY_SLOTS;

  private readonly rail = viewChild.required<ElementRef<HTMLElement>>('rail');

  protected scroll(direction: 1 | -1): void {
    this.rail().nativeElement.scrollBy({ left: direction * RAIL_STEP, behavior: 'smooth' });
  }
}
