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

/** Movement in CSS px before a press stops being a tap and becomes a scrub. */
const DRAG_THRESHOLD = 10;
/** World pixels moved per CSS pixel dragged. */
const DRAG_GAIN = 1.4;

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
      /* Claim touch gestures: without this the browser's own pan/zoom wins and
         every tap-to-walk is swallowed as the start of a scroll. */
      touch-action: none;
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
  private pointerStartX: number | null = null;
  private pointerLastX = 0;
  private dragging = false;

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
      const onPointerDown = (e: PointerEvent) => this.onPointerDown(e);
      const onPointerMove = (e: PointerEvent) => this.onPointerMove(e, renderer);
      const onPointerUp = (e: PointerEvent) => this.onPointerUp(e, renderer);

      window.addEventListener('resize', onResize);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('wheel', onWheel, { passive: true });
      this.host.nativeElement.addEventListener('pointerdown', onPointerDown);
      this.host.nativeElement.addEventListener('pointermove', onPointerMove);
      this.host.nativeElement.addEventListener('pointerup', onPointerUp);
      this.host.nativeElement.addEventListener('pointercancel', onPointerUp);

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
        this.host.nativeElement.removeEventListener('pointermove', onPointerMove);
        this.host.nativeElement.removeEventListener('pointerup', onPointerUp);
        this.host.nativeElement.removeEventListener('pointercancel', onPointerUp);
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

  /**
   * Pointer down / move / up implement both gestures on one input.
   *
   * A press that never travels further than `DRAG_THRESHOLD` is a tap — walk
   * there, or poke whoever was tapped. A press that does travel becomes a
   * drag-scrub of the world, the touch equivalent of the wheel handler. The
   * decision is deferred to pointerup, so a tap is never mistaken for a
   * one-pixel drag on a shaky finger.
   */
  private onPointerDown(e: PointerEvent): void {
    if (this.state.detail() >= 0) return;
    if (e.target !== this.canvas().nativeElement) return;
    this.pointerStartX = e.clientX;
    this.pointerLastX = e.clientX;
    this.dragging = false;
    this.canvas().nativeElement.setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent, renderer: WorldRenderer): void {
    if (this.pointerStartX === null) return;
    if (!this.dragging && Math.abs(e.clientX - this.pointerStartX) > DRAG_THRESHOLD) {
      this.dragging = true;
      renderer.cancelTarget();
    }
    if (this.dragging) {
      // Drag left to travel right, as though pulling the world past you.
      renderer.nudge((this.pointerLastX - e.clientX) * DRAG_GAIN);
      this.pointerLastX = e.clientX;
    }
  }

  private onPointerUp(e: PointerEvent, renderer: WorldRenderer): void {
    if (this.pointerStartX === null) return;
    if (!this.dragging && this.state.detail() < 0) renderer.pointerAt(e.clientX);
    this.pointerStartX = null;
    this.dragging = false;
    if (this.canvas().nativeElement.hasPointerCapture(e.pointerId)) {
      this.canvas().nativeElement.releasePointerCapture(e.pointerId);
    }
  }
}
