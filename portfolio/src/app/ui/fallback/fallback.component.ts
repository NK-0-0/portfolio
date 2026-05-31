import { Component } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';

/**
 * 2D responsive fallback shown on mobile devices or when WebGL is unavailable.
 * Mirrors the same content as the 3D panels but in a scrollable page layout.
 * Styled with the same colour palette for visual consistency.
 */
@Component({
  selector: 'app-fallback',
  standalone: true,
  imports: [FooterComponent],
  template: `
    <div class="fallback scrollable">
      <header class="hero">
        <div class="hero-inner">
          <p class="hero-label">Portfolio</p>
          <h1 class="hero-name">Your Name</h1>
          <p class="hero-role">Full-Stack Engineer</p>
          <p class="hero-bio">
            Builder of scalable web applications with a bias for clean architecture
            and delightful user experiences.
          </p>
        </div>
      </header>

      <main class="sections">
        <!-- About -->
        <section class="section" id="about">
          <h2 class="section-heading">About Me</h2>
          <p>
            I became a developer because I wanted to build worlds. Every feature
            shipped is a small act of creation. Driven by the challenge of turning
            hard problems into elegant solutions.
          </p>
        </section>

        <!-- Experience -->
        <section class="section" id="experience">
          <h2 class="section-heading">Experience</h2>
          <ol class="timeline" role="list">
            <li class="timeline-item">
              <span class="company">Acme Corp</span>
              <span class="period">Jan 2022 – Present</span>
              <p class="title">Senior Software Engineer</p>
            </li>
            <li class="timeline-item">
              <span class="company">Startupland</span>
              <span class="period">Jun 2019 – Dec 2021</span>
              <p class="title">Software Engineer</p>
            </li>
          </ol>
        </section>

        <!-- Skills -->
        <section class="section" id="skills">
          <h2 class="section-heading">Skills</h2>
          <ul class="tags" role="list">
            @for (skill of skills; track skill) {
              <li class="tag">{{ skill }}</li>
            }
          </ul>
        </section>

        <!-- Projects -->
        <section class="section" id="projects">
          <h2 class="section-heading">Projects</h2>
          <p>This 3D portfolio itself is the featured project. Open it on a desktop to experience it fully.</p>
        </section>

        <!-- Contact -->
        <section class="section" id="contact">
          <h2 class="section-heading">Contact</h2>
          <ul class="contact-list" role="list">
            <li><a href="mailto:hello@yourname.dev">hello&#64;yourname.dev</a></li>
            <li><a href="https://github.com/your-handle" target="_blank" rel="noopener">GitHub</a></li>
            <li><a href="https://linkedin.com/in/your-profile" target="_blank" rel="noopener">LinkedIn</a></li>
          </ul>
        </section>
      </main>

      <app-footer />
    </div>
  `,
  styleUrl: './fallback.component.scss',
})
export class FallbackComponent {
  protected readonly skills = [
    'TypeScript', 'Angular 21+', 'React 18', 'Node.js',
    'Python', 'Go', 'Docker', 'AWS', 'Three.js',
  ];
}
