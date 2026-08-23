/**
 * Pixel-art source data, lifted verbatim from the original design canvas.
 *
 * A sprite is an array of equal-length strings; each character is a key into
 * `PAL`, and `.` (or a space) means transparent. `WorldRenderer.sprite()` walks
 * these row-by-row and fills 1x1 rects, so the maps double as the art files —
 * edit a character here and the world changes.
 */

/** Character -> hex colour. Keys are single letters so sprite rows stay readable. */
export const PAL: Record<string, string> = {
  k: '#241d2b', o: '#3d3145',
  h: '#4a3324', n: '#6d4b31',
  s: '#f0c9a3', f: '#d3a67e', i: '#2c4a6b',
  j: '#2f7a63', g: '#215a48', l: '#43977c', d: '#1d5347', c: '#dbe7cc',
  p: '#364a72', q: '#27375a',
  b: '#5a4436', t: '#7b5c40',
  r: '#c9a06a', w: '#fffaf0', a: '#3a4a5a',
  u: '#c98a4b', v: '#8a5a2c', y: '#e8bd85',
  m: '#c94f4f', e: '#ef8f96', x: '#f7ead8'
};

/** The dog companion. */
export const DOG = {
  walkA: [
    '................','..........kkkk..','.kk......kyuuyk.','.kuk....kkuuuuuk','.kuuk..kkvuiuuuk',
    '.kuuuuuuuvuuuuvk','.kuuuuuuuuuuuuek','.kuuuuuuuummmkk.','.kuuuuuuuummkk..','.kuuxxuuuukk....',
    '..kuk..kuk......','..kkk..kkk......'],
  walkB: [
    '................','..........kkkk..','.kk......kyuuyk.','.kuk....kkuuuuuk','.kuuk..kkvuiuuuk',
    '.kuuuuuuuvuuuuvk','.kuuuuuuuuuuuuek','.kuuuuuuuummmkk.','.kuuuuuuuummkk..','.kuuxxuuuukk....',
    '.kuk....kuk.....','kkk......kkk....'],
  sit: [
    '................','..........kkkk..','.kk......kyuuyk.','.kuk....kkuuuuuk','.kuuk..kkvuiuuuk',
    '.kuuuuuuuvuuuuvk','.kuuuuuuuuuuuuek','.kuuuuuuuummmkk.','.kuuuuuuuummkk..','.kuuuuuuuukk....',
    '.kuuuuuukuk.....','.kkkkkkkkkk.....'],
  sitB: [
    '................','..........kkkk..','.........kyuuyk.','.k......kkuuuuuk','.kuk...kkvuiuuuk',
    '.kuuuuuuuvuuuuvk','.kuuuuuuuuuuuuek','.kuuuuuuuummmkk.','.kuuuuuuuummkk..','.kuuuuuuuukk....',
    '.kuuuuuukuk.....','.kkkkkkkkkk.....'],
  sleep: [
    '................','................','................','................','.....kkkkkk.....',
    '...kkuuuuuuykk..','..kuuuuuuuuyyuk.','.kuuxxuuuuuiuvk.','.kuuuuuuuuuuuek.','..kuuuuuuuuukk..',
    '..kkuuuuuuukk...','...kkkkkkkkk....']
};

/**
 * Avatar poses. `benchsit`, `point` and `sitCap` are aliases/variants derived
 * from the base poses rather than drawn separately.
 */
const BASE = {
  stand: [
    '................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....','...khfssssk.....',
    '...khsisssfk....','....kssosfkk....','....kkddkkk.....','...kljjjjgk.....','..kljjjjjjgk....',
    '..kljjjjjjgk....','..kjgcccgjk.....','...krrrrrrk.....','...kqppppqk.....','...kqpkkpqk.....',
    '...kbbk.kbbk....','..ktbbk.ktbbk...','................'],
  walkA: [
    '................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....','...khfssssk.....',
    '...khsisssfk....','....kssosfkk....','....kkddkkk.....','...kljjjjgk.....','..kljjjjjjgk....',
    '.kljjjjjjgk.....','..kjgcccgjk.....','...krrrrrrk.....','...kqppppqk.....','..kqpk.kpqk.....',
    '.kbbk...kbbk....','ktbbk....ktbbk..','................'],
  walkB: [
    '................','................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....',
    '...khfssssk.....','...khsisssfk....','....kssosfkk....','....kkddkkk.....','...kljjjjgk.....',
    '..kljjjjjjgk....','..kjgcccgjk.....','...krrrrrrk.....','....kqppqk......','....kqppqk......',
    '....kbbbbk......','...ktbbbbbk.....','................'],
  swing: [
    '................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....','...khfssssk.....',
    '...khsisssfk....','....kssosfkk....','...kkkddkkk.....','..skljjjjgks....','..skjgcccgjks...',
    '..kkljjjjgkk....','...krrrrrrrrk...','...kqppppppppqk.','....kkkkkqppqk..','.........kbbbk..',
    '.........ktbbk..','..........kkk...','................'],
  campsit: [
    '................','................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....',
    '...khfssssk.....','...khsisssfk....','....kssosfkk....','...kkkddkkkk....','..kljjjjjjgsk...',
    '..kjgcccgjjssk..','..kljjjjjjgkkk..','..krrrrrqppqk...','...kqppppppqk...','...kqppqkkpqk...',
    '....kbbk..ktbk..','.....kk....kk...','................'],
  sleep: [
    '................','................','................','................','................',
    '................','................','................','................','................',
    '..........kkk...','.........knnhk..','..kkkkkkkhnnhhk.','.kjjjjjjjkhsosk.','.kljjjjjjjkfssk.',
    '.kjggggggggkkk..','.kbbbbbbbbbbbk..','.kkkkkkkkkkkkk..'],
  present: [
    '................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....','...khfssssk.....',
    '...khsisssfk....','....kssosfkk....','....kkddkkkk....','...kljjjjjgkkk..','..kljjjjjjjjjsk.',
    '..kljjjjjjgkkk..','..kjgcccgjk.....','...krrrrrrk.....','...kqppppqk.....','...kqpkkpqk.....',
    '...kbbk.kbbk....','..ktbbk.ktbbk...','................'],
  fish: [
    '................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....','...khfssssk.....',
    '...khsisssfk....','....kssosfkk....','....kkddkkk.....','...kljjjjgkk....','..kljjjjjjsk....',
    '..kljjjjjjsk....','..kjgcccgjkk....','...krrrrrrk.....','...kqppppqk.....','...kqpkkpqk.....',
    '...kbbk.kbbk....','..ktbbk.ktbbk...','................'],
  wave: [
    '................','.....kkkkk...k..','....knnhhhhkksk.','...khnnhhhhkksk.','...khfsssskksk..',
    '...khsisssfksk..','....kssosfkkk...','....kkddkkk.....','...kljjjjgk.....','..kljjjjjjgk....',
    '..kljjjjjjgk....','..kjgcccgjk.....','...krrrrrrk.....','...kqppppqk.....','...kqpkkpqk.....',
    '...kbbk.kbbk....','..ktbbk.ktbbk...','................'],
  cheer: [
    '..k..........k..','..ksk.kkkkk.ksk.','..kskknnhhhhkksk','..kskkhnnhhhhksk','...kkkhfssssk.k.',
    '...khsisssfk....','....kssosfkk....','....kkddkkk.....','...kljjjjgk.....','..kljjjjjjgk....',
    '..kljjjjjjgk....','..kjgcccgjk.....','...krrrrrrk.....','...kqppppqk.....','...kqpkkpqk.....',
    '...kbbk.kbbk....','..ktbbk.ktbbk...','................'],
  sit: [
    '................','.....kkkkk......','....knnhhhhk....','...khnnhhhhk....','...khfssssk.....',
    '...khsisssfk....','....kssosfkk....','....kkddkkk.....','...kljjjjjgk....','..kljjjjjjjgk...',
    '..kjgcccgjjjk...','..krrrrrrrrqk...','..kkkkkkkkqpk...','.........kqpk...','.........kqpk...',
    '.........kqpk...','.........kbtk...','.........kkkk...']
};

export const S = {
  ...BASE,
  benchsit: BASE.sit,
  point: BASE.present,
  sitCap: [
    '................', '....kkkkkk......', '...kaaaaaak.....', '..kaaaaaaaaak...',
  ].concat(BASE.sit.slice(4)),
};

/** Every pose name the renderer can be asked to draw. */
export type Pose = keyof typeof S;
