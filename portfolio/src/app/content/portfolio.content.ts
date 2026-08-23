/**
 * Every word and link on the site.
 *
 * This is the file to edit for content changes — nothing below the `ui/`
 * components hardcodes copy. Chapter order here must match `CH` in
 * `world/world.model.ts`, since the walk position selects the panel by index.
 *
 * Values marked TODO are placeholders carried over from the original design
 * and still need real details.
 */

export interface Identity {
  /** TODO: replace with your name. */
  readonly name: string;
  readonly tagline: string;
}

export interface SkillTile {
  readonly label: string;
  /** Shown if the remote icon fails to load. */
  readonly fallback: string;
  readonly icon: string;
  /** Renders with the accent border — the "signature" tool. */
  readonly featured?: boolean;
  /** Icon needs inverting to read on a dark tile. */
  readonly invert?: boolean;
}

export interface TimelineEntry {
  readonly period: string;
  readonly role: string;
  readonly detail?: string;
}

export interface ProjectLink {
  readonly label: string;
  readonly href: string;
  readonly primary?: boolean;
}

export interface ProjectDetail {
  readonly role: string;
  readonly stack: string;
  readonly points: readonly string[];
  readonly links: readonly ProjectLink[];
  /** Screenshot; null renders the empty frame with `imageAlt` as the prompt. */
  readonly image: string | null;
  readonly imageAlt: string;
}

export interface ProjectCard {
  /**
   * Draws the accent border on the rail. Exactly one project should carry it,
   * and it should be the one that matches the roles being applied for — this
   * is the first thing a skimmer's eye lands on.
   */
  readonly featured?: boolean;
  readonly kind: string;
  /** Accent for the kind label. */
  readonly tone: 'game' | 'web';
  readonly year: string;
  readonly title: string;
  readonly stack: string;
  readonly blurb: string;
  readonly summary: string;
  readonly detail: ProjectDetail;
}

export interface EmptySlot {
  readonly label: string;
  readonly blurb: string;
}

export const IDENTITY: Identity = {
  name: 'YOUR NAME',
  tagline: 'FULL-STACK & GAMES',
};

/** Panel 00 — the opening hill. */
export const HILL = {
  eyebrow: '00 — THE HILL',
  heading: 'I build products by day and worlds by night.',
  body: 'Full-stack engineer — Angular, .NET, Postgres — with a gameplay habit that keeps sneaking into the day job. Walk right, or click where you want to go.',
  cue: 'PRESS →',
};

/** Panel 01 — the project rail above the stage. */
export const WORKS = {
  eyebrow: '01 — THE WORKS',
  note: 'CLICK A TILE TO OPEN THE CASE STUDY',
};

export const PROJECTS: readonly ProjectCard[] = [
  {
    featured: true,
    kind: 'WEB',
    tone: 'web',
    year: '2026',
    title: 'FinFree',
    stack: 'ANGULAR · .NET · PG',
    blurb: 'Envelope budgeting that stays honest offline.',
    summary:
      'Envelope budgeting for people who go days without signal. Every mutation is queued locally and reconciled on reconnect, so the balance you see is the balance you have.',
    detail: {
      role: 'Solo — full stack',
      stack: 'Angular, .NET, Postgres',
      points: [
        'Offline-first write queue with deterministic replay, so a week offline still reconciles cleanly.',
        'Envelope maths runs identically on client and server; the server is the tiebreak, not the source.',
        'Postgres row-level security means a tenant leak is a schema error, not a code review miss.',
      ],
      links: [
        { label: 'VISIT', href: 'https://example.com', primary: true },
        { label: 'SOURCE', href: 'https://github.com' },
      ],
      image: null,
      imageAlt: 'Product screenshot — drop one in public/projects/finfree.png',
    },
  },
  {
    kind: 'GAME',
    tone: 'game',
    year: '2025',
    title: 'Cosmic Collector',
    stack: 'UNREAL 5 · C++',
    blurb: 'Orbital scavenger built around a gravity tether.',
    summary:
      'A single-stick orbital scavenger. You tether to debris, swing around a dying satellite, and pull scrap out of the atmosphere before it burns. Built solo in Unreal 5 over four months.',
    detail: {
      role: 'Solo — design & code',
      stack: 'Unreal 5, C++, Blueprints',
      points: [
        'Gravity-tether traversal written in C++, exposed to Blueprints so tuning stayed in the editor.',
        'Procedural debris fields seeded per run, with hand-authored set pieces layered on top.',
        'Twelve playtests; the grab window moved four times before the pickup felt fair.',
      ],
      links: [
        { label: 'PLAY BUILD', href: 'https://itch.io', primary: true },
        { label: 'DEVLOG', href: 'https://github.com' },
      ],
      image: null,
      imageAlt: 'Gameplay screenshot — drop one in public/projects/cosmic-collector.png',
    },
  },
];

/** Filler tiles on the rail. Delete these as real projects land. */
export const EMPTY_SLOTS: readonly EmptySlot[] = [
  {
    label: 'SLOT 03 — OPEN',
    blurb: 'The rail scrolls, so there is room for what comes next. Got something in mind?',
  },
];

/** Panel 02 — the toolbelt. */
export const TOOLBELT = {
  eyebrow: '02 — TOOLBELT',
  footnote:
    'Daily drivers, not a wishlist. The engine is where the interaction ideas come from; the rest is what ships them.',
};

const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

export const SKILLS: readonly SkillTile[] = [
  {
    label: 'TYPESCRIPT',
    fallback: 'TS',
    icon: `${DEVICON}/typescript/typescript-original.svg`,
    featured: true,
  },
  { label: 'C#', fallback: 'C#', icon: `${DEVICON}/csharp/csharp-original.svg` },
  { label: '.NET', fallback: '.NET', icon: `${DEVICON}/dotnetcore/dotnetcore-original.svg` },
  { label: 'POSTGRES', fallback: 'PG', icon: `${DEVICON}/postgresql/postgresql-original.svg` },
  { label: 'ANGULAR', fallback: 'NG', icon: `${DEVICON}/angularjs/angularjs-original.svg` },
  {
    label: 'UNREAL 5',
    fallback: 'UE5',
    icon: `${DEVICON}/unrealengine/unrealengine-original.svg`,
    invert: true,
  },
];

/** Panel 03 — the trail. TODO: replace the placeholder employers and school. */
export const TRAIL = {
  eyebrow: '03 — THE TRAIL',
  meta: 'SIX YEARS WALKED',
  heading: 'Where the road has been.',
};

export const EXPERIENCE: readonly TimelineEntry[] = [
  {
    period: '2023—NOW',
    role: 'Full-Stack Engineer',
    detail: 'Company Name — Angular, .NET, Postgres',
  },
  { period: '2021—23', role: 'Software Engineer', detail: 'Company Name — internal tools, API work' },
  { period: '2020—21', role: 'Junior Developer — Company Name' },
];

export const EDUCATION: readonly TimelineEntry[] = [
  { period: '2017—20', role: 'BSc Computer Science', detail: 'University Name — graphics & systems' },
  { period: 'ONGOING', role: 'Game dev, self-taught — Unreal 5, gameplay C++' },
];

/** Panel 04 — the jetty. */
export const JETTY = {
  eyebrow: '04 — THE JETTY',
  heading: 'Games taught me to ship the feel first.',
  body: "Grey-box the flow, put it in someone's hands the same day, then spend the real time on the twenty details that make it feel good. The loop that tunes a jump arc tunes a checkout.",
  principles: [
    'Prototype rough, prototype early',
    'Playtest with strangers, not friends',
    'Polish is a schedule item, not a bonus',
  ],
  footnote: "Press E on the jetty and he'll cast a line.",
};

/** Panel 05 — the campfire. TODO: replace with your real contact details. */
export const CAMPFIRE = {
  eyebrow: '05 — THE CAMPFIRE',
  heading: 'Fires are better shared.',
  body: 'Hiring, collaborating, or just want to argue about coyote time — I answer everything.',
  links: [
    { label: 'EMAIL', href: 'mailto:you@example.com', primary: true },
    { label: 'GITHUB', href: 'https://github.com' },
    { label: 'LINKEDIN', href: 'https://linkedin.com' },
  ] as readonly ProjectLink[],
  footnote: "Press E by the fire, stay a while, and he'll doze off.",
};

/**
 * Controls legend. Both variants render; CSS shows whichever suits the
 * viewport, so no JS has to guess at the input device.
 */
export const CONTROLS = {
  keyboard: [
    'E — INTERACT · CLICK GROUND — WALK THERE · CLICK HIM — HE WAVES · CLICK THE DOG',
    '← → WALK · SHIFT RUN · ESC CLOSE',
  ],
  touch: ['TAP THE GROUND TO WALK · DRAG TO SCRUB', 'TAP HIM, THE DOG, OR THE PROMPT'],
};

/**
 * What this site is, stated plainly.
 *
 * The world reads as a toy until someone knows what it's made of; these are
 * the numbers that reframe it as an engineering artifact. Keep them honest —
 * `npm run build` prints the bundle size, `npm run lighthouse` the scores.
 */
export const COLOPHON = {
  heading: 'About this site',
  body: 'No engine and no images — the world is a 2D canvas, and every sprite is a grid of characters in a TypeScript file. The simulation is a plain class that knows nothing about Angular; it publishes state to signals, and the DOM overlay you are reading renders from those.',
  facts: [
    { label: 'BUILT WITH', value: 'Angular 21, zoneless signals, Canvas 2D' },
    { label: 'BUNDLE', value: '300 kB raw · 81 kB transferred' },
    {
      label: 'LIGHTHOUSE',
      value: '100 accessibility · 100 best practices · 100 SEO · 99 performance',
    },
    { label: 'TESTED', value: '23 unit specs · 32 e2e across Chromium, Firefox and WebKit' },
    { label: 'GATED', value: 'Lint, typecheck, unit, e2e, Lighthouse and a frame-timing budget in CI' },
  ],
  source: { label: 'READ THE SOURCE', href: 'https://github.com/NK-0-0/portfolio' },
};

/** Time-of-day label shown in the header, driven by walk phase. */
export function clockLabel(phase: number): string {
  if (phase < 0.25) return 'MORNING';
  if (phase < 0.48) return 'MIDDAY';
  if (phase < 0.68) return 'AFTERNOON';
  if (phase < 0.86) return 'GOLDEN HOUR';
  return 'NIGHTFALL';
}
