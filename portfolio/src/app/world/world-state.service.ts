import { Injectable, computed, signal } from '@angular/core';
import { clockLabel } from '../content/portfolio.content';
import { CH } from './world.model';
import type { WorldRenderer } from './world-renderer';

/**
 * The bridge between the canvas simulation and the DOM overlay.
 *
 * `PixelWorldComponent` pushes a snapshot here once per frame; everything in
 * `ui/` reads the signals and never talks to the renderer directly. Because
 * signals skip equal writes, a frame where nothing meaningful changed costs no
 * change detection — only `phase` and the prompt position update while walking.
 *
 * Commands go the other way and are no-ops until a renderer attaches, which
 * keeps the UI safe to render during prerender when there is no canvas.
 */
@Injectable({ providedIn: 'root' })
export class WorldStateService {
  private renderer: WorldRenderer | null = null;

  /** 0..1 walk progress. Drives the progress bar and time of day. */
  readonly phase = signal(0);
  /** Index of the closest chapter. */
  readonly nearest = signal(0);
  private readonly nearestDistance = signal(Number.POSITIVE_INFINITY);
  /** Chapter the avatar can interact with, or -1. */
  readonly actionable = signal(-1);
  /** Chapter being acted out, or null. */
  readonly acting = signal<number | null>(null);
  /** How many of the six stops have been walked past. */
  readonly visitedCount = signal(0);
  /** Screen position of the "press E" prompt, in CSS pixels. */
  readonly promptX = signal(0);
  readonly promptY = signal(0);
  private readonly still = signal(true);
  /** Open project overlay index, or -1. */
  readonly detail = signal(-1);

  readonly clock = computed(() => clockLabel(this.phase()));

  /**
   * Which chapter panel is showing, or -1.
   *
   * The stage panel (1) sits across the top rather than beside the avatar, so
   * it gets a wider reach — you see the project rail before you arrive.
   */
  readonly activePanel = computed(() => {
    const i = this.nearest();
    const reach = i === 1 ? 330 : 260;
    return this.nearestDistance() < reach ? i : -1;
  });

  readonly promptVisible = computed(
    () => this.detail() < 0 && this.still() && (this.acting() !== null || this.actionable() >= 0),
  );

  readonly promptText = computed(() => {
    if (this.acting() !== null) return 'GET UP';
    const i = this.actionable();
    return i >= 0 ? CH[i].hint : 'INTERACT';
  });

  attach(renderer: WorldRenderer): void {
    this.renderer = renderer;
  }

  detach(): void {
    this.renderer = null;
  }

  /** Called once per animation frame by the canvas host. */
  sync(renderer: WorldRenderer): void {
    const s = renderer.snapshot();
    this.phase.set(s.phase);
    this.nearest.set(s.nearest);
    this.nearestDistance.set(s.nearestDistance);
    this.actionable.set(s.actionable);
    this.acting.set(s.acting);
    this.visitedCount.set(s.visited.filter(Boolean).length);
    this.promptX.set(s.promptAt.x);
    this.promptY.set(s.promptAt.y);
    this.still.set(renderer.isStill);
  }

  travelTo(chapter: number): void {
    this.renderer?.travelTo(chapter);
  }

  openDetail(index: number): void {
    this.detail.set(index);
    this.renderer?.setDetailOpen(index);
  }

  closeDetail(): void {
    this.detail.set(-1);
    this.renderer?.setDetailOpen(-1);
  }
}
