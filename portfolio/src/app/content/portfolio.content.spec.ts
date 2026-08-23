import { clockLabel } from './portfolio.content';
import { CH } from '../world/world.model';

describe('clockLabel', () => {
  it('runs morning through nightfall across the walk', () => {
    expect(clockLabel(0)).toBe('MORNING');
    expect(clockLabel(0.3)).toBe('MIDDAY');
    expect(clockLabel(0.5)).toBe('AFTERNOON');
    expect(clockLabel(0.7)).toBe('GOLDEN HOUR');
    expect(clockLabel(1)).toBe('NIGHTFALL');
  });

  it('never returns an empty label for any phase', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      expect(clockLabel(p)).toMatch(/\S/);
    }
  });
});

describe('content wiring', () => {
  it('has one HUD entry per chapter', () => {
    // The panels are selected by chapter index, so a mismatch here silently
    // opens the wrong panel.
    expect(CH.length).toBe(6);
  });
});
