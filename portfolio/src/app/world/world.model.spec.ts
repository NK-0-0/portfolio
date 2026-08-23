import { CH, WORLD } from './world.model';
import { S } from './sprites';

describe('world layout', () => {
  it('orders chapters west to east', () => {
    const xs = CH.map((c) => c.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });

  it('keeps every chapter inside the walkable range', () => {
    for (const c of CH) {
      expect(c.x).toBeGreaterThanOrEqual(60);
      expect(c.x).toBeLessThanOrEqual(WORLD - 60);
    }
  });

  it('gives each chapter a pose the sprite sheet actually has', () => {
    for (const c of CH) {
      expect(S[c.act]).toBeDefined();
    }
  });

  it('keeps interaction radii from overlapping between neighbours', () => {
    for (let i = 1; i < CH.length; i++) {
      const gap = CH[i].x - CH[i - 1].x;
      expect(gap).toBeGreaterThan(CH[i].r + CH[i - 1].r);
    }
  });
});

describe('sprite maps', () => {
  it('uses rectangular grids so rows line up when drawn', () => {
    for (const [name, rows] of Object.entries(S)) {
      const widths = new Set(rows.map((r) => r.length));
      expect(widths, `${name} has ragged rows`).toHaveProperty('size', 1);
    }
  });
});
