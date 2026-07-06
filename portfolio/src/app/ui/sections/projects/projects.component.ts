import { Component } from '@angular/core';

interface Project {
  title: string;
  description: string;
  stack: string[];
  liveUrl?: string;
  githubUrl?: string;
}

/** Dummy data — replace with your real projects. */
const PROJECTS: Project[] = [
  {
    title: 'Interactive 3D Portfolio',
    description: 'This very site. Angular 21 + Three.js scroll-driven 3D portfolio with a fixed WebGL scene that reacts to scroll position.',
    stack: ['Angular 21', 'Three.js', 'angular-three', 'SCSS'],
    githubUrl: 'https://github.com/your-handle/portfolio',
  },
  {
    title: 'Real-Time Collaboration Tool',
    description: 'Notion-like collaborative editor with CRDT conflict resolution for concurrent edits.',
    stack: ['React', 'Y.js', 'WebSocket', 'Node.js', 'PostgreSQL'],
    liveUrl: '#',
    githubUrl: '#',
  },
  {
    title: 'Event-Driven Microservices Platform',
    description: 'Distributed order-processing system processing 10k events/s at sub-50ms latency.',
    stack: ['Go', 'Kafka', 'Docker', 'Kubernetes', 'Prometheus'],
    githubUrl: '#',
  },
  {
    title: 'ML-Powered Code Review Bot',
    description: 'GitHub Action that runs an LLM against pull request diffs and posts actionable feedback.',
    stack: ['Python', 'FastAPI', 'OpenAI API', 'GitHub Actions'],
    githubUrl: '#',
  },
];

@Component({
  selector: 'app-projects',
  standalone: true,
  template: `
    <article>
      <h2 class="section-heading">Projects</h2>
      <ul class="project-list" role="list">
        @for (project of projects; track project.title) {
          <li class="project-card">
            <div class="card-header">
              <h3 class="project-title">{{ project.title }}</h3>
              <div class="links">
                @if (project.liveUrl) {
                  <a [href]="project.liveUrl" target="_blank" rel="noopener" aria-label="Live site">
                    ↗ Live
                  </a>
                }
                @if (project.githubUrl) {
                  <a [href]="project.githubUrl" target="_blank" rel="noopener" aria-label="GitHub">
                    GitHub
                  </a>
                }
              </div>
            </div>
            <p class="description">{{ project.description }}</p>
            <ul class="tags" role="list">
              @for (tech of project.stack; track tech) {
                <li class="tag">{{ tech }}</li>
              }
            </ul>
          </li>
        }
      </ul>
    </article>
  `,
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  protected readonly projects = PROJECTS;
}
