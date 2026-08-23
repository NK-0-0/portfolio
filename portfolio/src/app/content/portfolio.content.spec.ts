import { EMPTY_SLOTS, PROJECTS, SKILLS, clockLabel } from './portfolio.content';
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

/**
 * Positioning guards.
 *
 * The site is for a software engineer who does game dev on the side, not the
 * reverse. The two elements that carry an accent are the loudest signal a
 * skimmer gets, so they are asserted rather than left to whoever edits the
 * content next.
 */
describe('positioning', () => {
  it('spotlights exactly one project', () => {
    expect(PROJECTS.filter((p) => p.featured)).toHaveLength(1);
  });

  it('spotlights engineering work, not the game', () => {
    expect(PROJECTS.find((p) => p.featured)?.tone).toBe('web');
  });

  it('spotlights exactly one tool, and not the game engine', () => {
    const featured = SKILLS.filter((s) => s.featured);
    expect(featured).toHaveLength(1);
    expect(featured[0].label).not.toBe('UNREAL 5');
  });

  it('still shows the game work — it is the differentiator, just not the headline', () => {
    expect(PROJECTS.some((p) => p.tone === 'game')).toBe(true);
    expect(SKILLS.some((s) => s.label === 'UNREAL 5')).toBe(true);
  });

  it('does not advertise more empty slots than real projects', () => {
    expect(EMPTY_SLOTS.length).toBeLessThan(PROJECTS.length);
  });
});
