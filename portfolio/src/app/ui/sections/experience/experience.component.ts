import { Component } from '@angular/core';

interface Role {
  company: string;
  title: string;
  period: string;
  bullets: string[];
}

/** Dummy data — replace with your real work history. */
const EXPERIENCE: Role[] = [
  {
    company: 'Acme Corp',
    title: 'Senior Software Engineer',
    period: 'Jan 2022 – Present',
    bullets: [
      'Led migration of monolith to microservices, reducing P95 latency by 40%.',
      'Introduced feature-flag infrastructure adopted by 6 product squads.',
      'Mentored 3 junior engineers through structured code reviews.',
    ],
  },
  {
    company: 'Startupland',
    title: 'Software Engineer',
    period: 'Jun 2019 – Dec 2021',
    bullets: [
      'Built the customer-facing dashboard from scratch; 50k MAU at launch.',
      'Reduced CI pipeline duration from 22 min to 8 min via parallelisation.',
      'Integrated Stripe billing, handling £2M+ in monthly transactions.',
    ],
  },
  {
    company: 'Dev Agency',
    title: 'Junior Developer',
    period: 'Mar 2018 – May 2019',
    bullets: [
      'Delivered 12 client websites on time and within budget.',
      'Introduced automated E2E testing, cutting QA cycle by 30%.',
    ],
  },
];

@Component({
  selector: 'app-experience',
  standalone: true,
  template: `
    <article>
      <h2 class="section-heading">Experience</h2>
      <ol class="timeline" role="list">
        @for (role of experience; track role.company + role.period) {
          <li class="role-item">
            <div class="role-header">
              <span class="company">{{ role.company }}</span>
              <span class="period">{{ role.period }}</span>
            </div>
            <p class="title">{{ role.title }}</p>
            <ul class="bullets" role="list">
              @for (bullet of role.bullets; track bullet) {
                <li>{{ bullet }}</li>
              }
            </ul>
          </li>
        }
      </ol>
    </article>
  `,
  styleUrl: './experience.component.scss',
})
export class ExperienceComponent {
  protected readonly experience = EXPERIENCE;
}
