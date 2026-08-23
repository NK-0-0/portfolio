import { clamp, hash, mix, pal } from './palette';

describe('mix', () => {
  it('returns the endpoints at t=0 and t=1', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('pads single-digit channels so the result is always 7 chars', () => {
    expect(mix('#000000', '#ffffff', 0.02)).toBe('#050505');
  });
});

describe('pal', () => {
  it('is the day palette at dawn and the night palette at the far end', () => {
    expect(pal(0).skyTop).toBe('#4fb8ea');
    expect(pal(1).skyTop).toBe('#070d26');
  });

  it('darkens the sky monotonically across the walk', () => {
    const brightness = [0, 0.25, 0.5, 0.75, 1].map((p) => parseInt(pal(p).skyTop.slice(1, 3), 16));
    for (let i = 1; i < brightness.length; i++) {
      expect(brightness[i]).toBeLessThanOrEqual(brightness[i - 1]);
    }
  });

  it('is continuous across the dusk keyframe', () => {
    // Smoothstep is applied per leg, so each leg must land exactly on the
    // shared dusk keyframe — otherwise the sky jumps mid-walk.
    expect(pal(0.7199).skyBot).toBe(pal(0.72).skyBot);
    expect(pal(0.7201).skyBot).toBe(pal(0.72).skyBot);
  });
});

describe('hash', () => {
  it('is deterministic and bounded to 0..1', () => {
    for (let i = 0; i < 50; i++) {
      expect(hash(i)).toBe(hash(i));
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
    }
  });
});

describe('clamp', () => {
  it('bounds on both sides and passes through in range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
