import { Component, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SectionStore } from '../../core/services/section-store';
import { AboutComponent } from '../sections/about/about.component';
import { ExperienceComponent } from '../sections/experience/experience.component';
import { SkillsComponent } from '../sections/skills/skills.component';
import { ProjectsComponent } from '../sections/projects/projects.component';
import { ContactComponent } from '../sections/contact/contact.component';

/**
 * Sliding content panel that appears when the user clicks a hotspot.
 * Uses Angular animations to slide in from the right and fade a dim backdrop.
 *
 * Closes when:
 * - The close button (×) is clicked
 * - The backdrop is clicked
 * - Escape key is pressed (handled here via HostListener)
 */
@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [
    AboutComponent,
    ExperienceComponent,
    SkillsComponent,
    ProjectsComponent,
    ContactComponent,
  ],
  template: `
    @if (store.isPanelOpen()) {
      <!-- Backdrop dims the scene -->
      <div
        class="backdrop"
        (click)="store.close()"
        (keydown.escape)="store.close()"
        tabindex="0"
        role="button"
        aria-label="Close panel"
        @backdropAnim
      ></div>

      <!-- Sliding panel -->
      <aside
        class="panel"
        role="complementary"
        [attr.aria-label]="store.activeSection() + ' section'"
        @slideIn
      >
        <button
          class="close-btn"
          (click)="store.close()"
          aria-label="Close"
        >&#x2715;</button>

        <div class="panel-content scrollable">
          @switch (store.activeSection()) {
            @case ('about')      { <app-about /> }
            @case ('experience') { <app-experience /> }
            @case ('skills')     { <app-skills /> }
            @case ('projects')   { <app-projects /> }
            @case ('contact')    { <app-contact /> }
          }
        </div>
      </aside>
    }
  `,
  styleUrl: './panel.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('350ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
    trigger('backdropAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('250ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class PanelComponent {
  protected readonly store = inject(SectionStore);
}
