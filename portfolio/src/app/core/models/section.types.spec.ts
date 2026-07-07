import { SECTIONS, sectionIndexFromHash } from './section.types';

describe('sectionIndexFromHash', () => {
  it('maps each SectionId hash to activeSection index i + 1', () => {
    SECTIONS.forEach((section, i) => {
      expect(sectionIndexFromHash(`#${section.id}`)).toBe(i + 1);
    });
  });

  it('accepts a hash without the leading "#"', () => {
    expect(sectionIndexFromHash('experience')).toBe(2);
  });

  it('returns null for an unrecognized hash', () => {
    expect(sectionIndexFromHash('#nonexistent')).toBeNull();
  });

  it('returns null for an empty hash (caller falls back to hero/top)', () => {
    expect(sectionIndexFromHash('')).toBeNull();
    expect(sectionIndexFromHash('#')).toBeNull();
  });

  it('does not treat "hero" as a section (hero has no SectionId)', () => {
    expect(sectionIndexFromHash('#hero')).toBeNull();
  });
});
