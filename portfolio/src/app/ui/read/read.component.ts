import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CAMPFIRE,
  COLOPHON,
  EDUCATION,
  EXPERIENCE,
  HILL,
  IDENTITY,
  JETTY,
  PROJECTS,
  SKILLS,
  TOOLBELT,
} from '../../content/portfolio.content';

/**
 * The whole portfolio as one plain document.
 *
 * Deliberately not a second showpiece. The world is the statement; this is the
 * reference — for someone who wants the facts in thirty seconds, is reading on
 * a locked-down browser, or is printing to PDF for an application. It renders
 * from the same `portfolio.content.ts` as the panels, so the two can never
 * disagree.
 *
 * Ordering is by what an engineering reader wants first: what I do, what I
 * built, what with, where I've been. The game work is present and specific but
 * doesn't lead — the positioning is "engineer whose game habit shows up in the
 * product work", not a career pivot.
 */
@Component({
  selector: 'app-read',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a class="skip" href="#work">Skip to work</a>

    <header class="masthead">
      <div>
        <p class="kicker">{{ identity.name }}</p>
        <p class="kicker kicker--dim">{{ identity.tagline }}</p>
      </div>
      <a class="btn" routerLink="/">ENTER THE WORLD &rarr;</a>
    </header>

    <main>
      <section class="lede">
        <h1>{{ hill.heading }}</h1>
        <p class="standfirst">{{ hill.body }}</p>
      </section>

      <section id="work">
        <h2>Selected work</h2>
        @for (project of projects; track project.title) {
          <article class="project">
            <header>
              <h3>{{ project.title }}</h3>
              <p class="meta">{{ project.kind }} · {{ project.year }} · {{ project.detail.stack }}</p>
            </header>
            <p>{{ project.summary }}</p>
            <ul class="points">
              @for (point of project.detail.points; track point) {
                <li>{{ point }}</li>
              }
            </ul>
            <p class="links">
              @for (link of project.detail.links; track link.label) {
                <a [href]="link.href" rel="noopener noreferrer">{{ link.label }}</a>
              }
            </p>
          </article>
        }
      </section>

      <section>
        <h2>Tools</h2>
        <p class="tools">
          @for (skill of skills; track skill.label) {
            <span class="tool" [class.tool--featured]="skill.featured">{{ skill.label }}</span>
          }
        </p>
        <p class="aside">{{ toolbeltNote }}</p>
      </section>

      <section>
        <h2>Experience</h2>
        <dl class="timeline">
          @for (entry of work; track entry.period) {
            <div>
              <dt>{{ entry.period }}</dt>
              <dd>
                <strong>{{ entry.role }}</strong>
                @if (entry.detail) {
                  <span>{{ entry.detail }}</span>
                }
              </dd>
            </div>
          }
        </dl>

        <h2>Education</h2>
        <dl class="timeline">
          @for (entry of education; track entry.period) {
            <div>
              <dt>{{ entry.period }}</dt>
              <dd>
                <strong>{{ entry.role }}</strong>
                @if (entry.detail) {
                  <span>{{ entry.detail }}</span>
                }
              </dd>
            </div>
          }
        </dl>
      </section>

      <section>
        <h2>{{ jetty.heading }}</h2>
        <p>{{ jetty.body }}</p>
        <ol class="principles">
          @for (principle of jetty.principles; track principle) {
            <li>{{ principle }}</li>
          }
        </ol>
      </section>

      <section class="colophon">
        <h2>{{ colophon.heading }}</h2>
        <p>{{ colophon.body }}</p>
        <dl class="timeline">
          @for (fact of colophon.facts; track fact.label) {
            <div>
              <dt>{{ fact.label }}</dt>
              <dd><strong>{{ fact.value }}</strong></dd>
            </div>
          }
        </dl>
        <p class="links">
          <a [href]="colophon.source.href" rel="noopener noreferrer">{{
            colophon.source.label
          }}</a>
        </p>
      </section>

      <section id="contact">
        <h2>{{ campfire.heading }}</h2>
        <p>{{ campfire.body }}</p>
        <p class="links">
          @for (link of campfire.links; track link.label) {
            <a [href]="link.href" rel="noopener noreferrer">{{ link.label }}</a>
          }
        </p>
      </section>
    </main>

    <footer>
      <a class="btn" routerLink="/">ENTER THE WORLD &rarr;</a>
    </footer>
  `,
  styleUrl: './read.component.scss',
})
export class ReadComponent {
  protected readonly identity = IDENTITY;
  protected readonly hill = HILL;
  protected readonly projects = PROJECTS;
  protected readonly skills = SKILLS;
  protected readonly toolbeltNote = TOOLBELT.footnote;
  protected readonly work = EXPERIENCE;
  protected readonly education = EDUCATION;
  protected readonly jetty = JETTY;
  protected readonly colophon = COLOPHON;
  protected readonly campfire = CAMPFIRE;
}
