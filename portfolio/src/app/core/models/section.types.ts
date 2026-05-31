export type SectionId = 'about' | 'experience' | 'skills' | 'projects' | 'contact';

export interface Section {
  id: SectionId;
  label: string;
  bodyPart: string;
}

export const SECTIONS: Section[] = [
  { id: 'about',      label: 'About Me',   bodyPart: 'Face / Sharingan Eye' },
  { id: 'experience', label: 'Experience', bodyPart: 'Icha Icha Book'       },
  { id: 'skills',     label: 'Skills',     bodyPart: 'Kunai on Belt'        },
  { id: 'projects',   label: 'Projects',   bodyPart: 'ANBU Mask'            },
  { id: 'contact',    label: 'Contact',    bodyPart: 'Headband'             },
];
