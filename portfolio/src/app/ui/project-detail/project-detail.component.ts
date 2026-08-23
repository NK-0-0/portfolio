import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PROJECTS } from '../../content/portfolio.content';
import { WorldStateService } from '../../world/world-state.service';

/**
 * Full-screen case study for one project.
 *
 * Replaces the design's two hand-duplicated `data-detail` blocks with a single
 * component driven by `WorldStateService.detail()`. Escape is handled by the
 * world's global key handler, which routes through the same service.
 */
@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'scrim',
    '[class.is-open]': 'project() !== null',
    '[attr.aria-hidden]': 'project() === null',
    'data-detail': '',
  },
  template: `
    @let current = project();
    @if (current) {
      <div class="sheet" role="dialog" aria-modal="true" [attr.aria-label]="current.title">
        <div class="body">
          <div class="kicker">
            <span class="eyebrow">{{ current.kind }} · {{ current.year }}</span>
            <span class="kicker__line"></span>
          </div>
          <h2>{{ current.title }}</h2>
          <p class="summary">{{ current.summary }}</p>

          <dl class="facts">
            <div>
              <dt>ROLE</dt>
              <dd>{{ current.detail.role }}</dd>
            </div>
            <div>
              <dt>STACK</dt>
              <dd>{{ current.detail.stack }}</dd>
            </div>
          </dl>

          <ul class="points">
            @for (point of current.detail.points; track point) {
              <li><span class="points__arrow" aria-hidden="true">&rarr;</span>{{ point }}</li>
            }
          </ul>

          <div class="links">
            @for (link of current.detail.links; track link.label) {
              <a
                class="btn"
                [class.btn--primary]="link.primary"
                [href]="link.href"
                rel="noopener noreferrer"
                >{{ link.label }}</a
              >
            }
          </div>
        </div>

        <div class="shot">
          @if (current.detail.image) {
            <img [src]="current.detail.image" [alt]="current.detail.imageAlt" />
          } @else {
            <p class="shot__empty">{{ current.detail.imageAlt }}</p>
          }
        </div>

        <button type="button" class="close" (click)="state.closeDetail()">ESC — CLOSE</button>
      </div>
    }
  `,
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  protected readonly state = inject(WorldStateService);

  protected readonly project = computed(() => {
    const i = this.state.detail();
    return i >= 0 && i < PROJECTS.length ? PROJECTS[i] : null;
  });
}
