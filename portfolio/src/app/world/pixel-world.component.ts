import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { WorldRenderer } from './world-renderer';
import { WorldStateService } from './world-state.service';

/**
 * Host for the pixel world canvas.
 *
 * Owns the animation frame loop and all global input listeners, and publishes
 * the simulation's derived state to `WorldStateService` once per frame. The
 * drawing itself lives in `WorldRenderer`, which knows nothing about Angular.
 *
 * Everything browser-only is deferred to `afterNextRender`, so the component
 * is inert during the static prerender pass.
 */
@Component({
  selector: 'app-pixel-world',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #world class="world" aria-hidden="true"></canvas>`,
  styles: `
    .world {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
      cursor: pointer;
    }
  `,
})
export class PixelWorldComponent {
  /** Walk speed multiplier. */
  readonly walkSpeed = input(1);
  /** Forced pixel scale; 0 derives one from viewport height. */
  readonly pixelSize = input(0);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('world');
  private readonly state = inject(WorldStateService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private renderer: WorldRenderer | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const options = { walkSpeed: this.walkSpeed(), pixelSize: this.pixelSize() };
      this.renderer?.setOptions(options);
    });

    afterNextRender(() => {
      const renderer = new WorldRenderer({
        walkSpeed: this.walkSpeed(),
        pixelSize: this.pixelSize(),
      });
      renderer.attach(this.canvas().nativeElement);
      this.renderer = renderer;
      this.state.attach(renderer);

      const onResize = () => renderer.resize();
      const onKeyDown = (e: KeyboardEvent) => this.onKeyDown(e, renderer);
      const onKeyUp = (e: KeyboardEvent) => this.onKeyUp(e, renderer);
      const onWheel = (e: WheelEvent) => this.onWheel(e, renderer);
      const onPointerDown = (e: PointerEvent) => this.onPointerDown(e, renderer);

      window.addEventListener('resize', onResize);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('wheel', onWheel, { passive: true });
      this.host.nativeElement.addEventListener('pointerdown', onPointerDown);

      let raf = 0;
      let logged = false;
      const loop = () => {
        try {
          renderer.step();
          this.state.sync(renderer);
        } catch (err) {
          // One frame failing should not spam the console sixty times a second.
          if (!logged) {
            logged = true;
            console.error('world step failed', err);
          }
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('wheel', onWheel);
        this.host.nativeElement.removeEventListener('pointerdown', onPointerDown);
        this.state.detach();
        this.renderer = null;
      });
    });
  }

  private onKeyDown(e: KeyboardEvent, renderer: WorldRenderer): void {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        renderer.input.left = true;
        renderer.cancelTarget();
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
        renderer.input.right = true;
        renderer.cancelTarget();
        e.preventDefault();
        break;
      case 'Shift':
        renderer.input.run = true;
        break;
      case 'Escape':
        this.state.closeDetail();
        break;
      case 'e':
      case 'E':
        if (this.state.detail() < 0) {
          renderer.toggleAction();
          e.preventDefault();
        }
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent, renderer: WorldRenderer): void {
    if (e.key === 'ArrowLeft' || e.key === 'a') renderer.input.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') renderer.input.right = false;
    if (e.key === 'Shift') renderer.input.run = false;
  }

  /**
   * Wheel and trackpad scrub the avatar along the world. Gestures that start
   * inside a panel or the project rail belong to that element, not the world.
   */
  private onWheel(e: WheelEvent, renderer: WorldRenderer): void {
    if (this.state.detail() >= 0) return;
    const target = e.target as Element | null;
    if (target?.closest?.('[data-rail], [data-panel], [data-detail]')) return;
    renderer.nudge(e.deltaY * 0.5 + e.deltaX * 0.5);
  }

  private onPointerDown(e: PointerEvent, renderer: WorldRenderer): void {
    if (this.state.detail() >= 0) return;
    if (e.target !== this.canvas().nativeElement) return;
    renderer.pointerAt(e.clientX);
  }
}
