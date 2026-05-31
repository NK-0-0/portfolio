import { Component } from '@angular/core';

interface SkillGroup {
  cluster: string;
  skills: string[];
}

/** Dummy data — replace with your real skill set. */
const SKILL_GROUPS: SkillGroup[] = [
  {
    cluster: 'Languages',
    skills: ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL'],
  },
  {
    cluster: 'Frameworks & Libraries',
    skills: ['Angular 21+', 'React 18', 'Node.js', 'FastAPI', 'Three.js'],
  },
  {
    cluster: 'Tools & Workflow',
    skills: ['Git', 'Docker', 'Nx', 'Vitest', 'Playwright', 'ESLint'],
  },
  {
    cluster: 'Cloud & DevOps',
    skills: ['AWS (Lambda, S3, RDS)', 'GitHub Actions', 'Terraform', 'Datadog'],
  },
];

@Component({
  selector: 'app-skills',
  standalone: true,
  template: `
    <article>
      <h2 class="section-heading">Skills</h2>
      <div class="clusters">
        @for (group of groups; track group.cluster) {
          <section class="cluster">
            <h3 class="cluster-name">{{ group.cluster }}</h3>
            <ul class="tags" role="list">
              @for (skill of group.skills; track skill) {
                <li class="tag">{{ skill }}</li>
              }
            </ul>
          </section>
        }
      </div>
    </article>
  `,
  styleUrl: './skills.component.scss',
})
export class SkillsComponent {
  protected readonly groups = SKILL_GROUPS;
}
