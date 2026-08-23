import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { SKILLS, TOOLBELT } from '../../content/portfolio.content';

/** Panel 02 — the toolbelt grid, shown at the bench. */
@Component({
  selector: 'app-toolbelt-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel panel--side',
    '[class.is-open]': 'open()',
    'data-panel': '2',
  },
  template: `
    <div class="head">
      <span class="eyebrow">{{ copy.eyebrow }}</span>
      <span class="meta">EQUIPPED {{ skills.length }}/{{ skills.length }}</span>
    </div>
    <ul class="grid">
      @for (skill of skills; track skill.label) {
        <li class="tile" [class.tile--featured]="skill.featured">
          @if (broken().has(skill.label)) {
            <span class="tile__fallback">{{ skill.fallback }}</span>
          } @else {
            <img
              class="tile__icon"
              [class.tile__icon--invert]="skill.invert"
              [src]="skill.icon"
              [alt]="skill.label"
              width="32"
              height="32"
              loading="lazy"
              (error)="markBroken(skill.label)"
            />
          }
          <span class="tile__label">{{ skill.label }}</span>
        </li>
      }
    </ul>
    <p class="footnote">{{ copy.footnote }}</p>
  `,
  styleUrl: './toolbelt-panel.component.scss',
})
export class ToolbeltPanelComponent {
  readonly open = input.required<boolean>();
  protected readonly copy = TOOLBELT;
  protected readonly skills = SKILLS;

  /**
   * Icons come from a CDN, so any of them can fail. Track the failures and
   * swap in the text fallback rather than leaving a broken-image glyph.
   */
  protected readonly broken = signal(new Set<string>());

  protected markBroken(label: string): void {
    this.broken.update((set) => new Set(set).add(label));
  }
}
