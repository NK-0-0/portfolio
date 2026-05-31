import { Component } from '@angular/core';

/** Dummy data — replace with your real bio. */
const ABOUT = {
  name: 'Your Name',
  role: 'Full-Stack Engineer',
  summary: `
    Builder of things that matter. I craft scalable web applications with a bias
    for clean architecture and delightful user experiences. Equal parts pragmatist
    and idealist — I ship working software and keep raising the bar.
  `,
  why: `
    I became a developer because I wanted to build worlds. Every feature shipped is
    a small act of creation. I am driven by the challenge of turning hard problems
    into elegant solutions that feel inevitable in hindsight.
  `,
};

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <article>
      <h2 class="section-heading">About Me</h2>
      <p class="role">{{ about.role }}</p>
      <p class="bio">{{ about.summary }}</p>
      <h3 class="sub-heading">Why I Code</h3>
      <p class="bio">{{ about.why }}</p>
    </article>
  `,
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  protected readonly about = ABOUT;
}
