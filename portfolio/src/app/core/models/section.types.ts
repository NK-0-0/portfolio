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
