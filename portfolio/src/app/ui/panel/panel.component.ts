import { Component, HostListener, inject } from '@angular/core';
import { SectionStore } from '../../core/services/section-store';
import { AboutComponent } from '../sections/about/about.component';
import { ExperienceComponent } from '../sections/experience/experience.component';
import { SkillsComponent } from '../sections/skills/skills.component';
import { ProjectsComponent } from '../sections/projects/projects.component';
import { ContactComponent } from '../sections/contact/contact.component';

/**
 * Sliding content panel that appears when the user clicks a hotspot.
 * Always in the DOM — CSS transitions handle slide-in/out and backdrop fade.
 *
 * Closes when:
 * - The close button (×) is clicked
 * - The backdrop is clicked
 * - Escape key is pressed
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
    <!-- Backdrop dims the scene -->
    <div
      class="backdrop"
      [class.backdrop--visible]="store.isPanelOpen()"
      (click)="store.close()"
      [attr.aria-hidden]="!store.isPanelOpen()"
    ></div>

    <!-- Sliding panel -->
    <aside
      class="panel"
      [class.panel--open]="store.isPanelOpen()"
      role="complementary"
      [attr.aria-label]="(store.activeSection() ?? '') + ' section'"
      [attr.aria-hidden]="!store.isPanelOpen()"
    >
      <button
        class="close-btn"
        (click)="store.close()"
        aria-label="Close"
      >&#x2715;</button>

      <div class="panel-content scrollable">
        @if (store.isPanelOpen()) {
          @switch (store.activeSection()) {
            @case ('about')      { <app-about /> }
            @case ('experience') { <app-experience /> }
            @case ('skills')     { <app-skills /> }
            @case ('projects')   { <app-projects /> }
            @case ('contact')    { <app-contact /> }
          }
        }
      </div>
    </aside>
  `,
  styleUrl: './panel.component.scss',
})
export class PanelComponent {
  protected readonly store = inject(SectionStore);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.store.isPanelOpen()) this.store.close();
  }
}
