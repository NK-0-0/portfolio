export type SectionId = 'about' | 'experience' | 'skills' | 'projects' | 'contact';

export interface Section {
  id: SectionId;
  label: string;
}

export const SECTIONS: Section[] = [
  { id: 'about',      label: 'About Me'   },
  { id: 'experience', label: 'Experience' },
  { id: 'skills',     label: 'Skills'     },
  { id: 'projects',   label: 'Projects'   },
  { id: 'contact',    label: 'Contact'    },
];

/**
 * Maps a URL hash (e.g. `#experience`, with or without the leading `#`) to its
 * `ActiveSection` index, or `null` for an unknown/empty hash so the caller can
 * fall back to hero/top. Hero (index 0) has no `SectionId`; `SECTIONS[i]` maps
 * to `activeSection` `i + 1`.
 */
export function sectionIndexFromHash(hash: string): 1 | 2 | 3 | 4 | 5 | null {
  const id = hash.replace(/^#/, '');
  const idx = SECTIONS.findIndex((s) => s.id === id);
  return idx === -1 ? null : ((idx + 1) as 1 | 2 | 3 | 4 | 5);
}
