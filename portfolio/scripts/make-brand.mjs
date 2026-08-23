#!/usr/bin/env node
// Generates the site's brand marks from a single pixel grid.
//
// The logo is the flag the avatar plants at each stop in the world — the same
// gold pennant `world-renderer.ts` draws in `flags()`, and the same token the
// HUD counts as "FLAGS n/6". Defining it as a character grid keeps it
// consistent with `src/app/world/sprites.ts`, where all the other art lives:
// each character indexes PALETTE, '.' is transparent.
//
// Outputs (committed, not built on the fly):
//   public/favicon.svg          crisp at any size, with the navy field
//   public/mark.svg             the same mark, no field, for use on the panels
//   public/favicon.ico          16/32/48, for the browser's implicit request
//   public/apple-touch-icon.png 192x192 (an exact 12x of the grid — a non-integer
//                               multiple like 180 gives visibly uneven pixel widths)
//
// Re-run with `npm run brand` after editing GRID or PALETTE.

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const PALETTE = {
  '.': null, // transparent
  n: '#0a1230', // field — the world's night sky
  o: '#9a8464', // pole
  h: '#ffe6ac', // pennant, lit edge
  g: '#ffd98a', // pennant — --accent
  s: '#e0b062', // pennant, shadowed edge
  e: '#3a9440', // grass — brighter than the in-world green so it survives 16px
  d: '#215a48', // grass, shadowed
};

// 16x16, and sized for the smallest case: at a 16px favicon the mark gets one
// grid pixel per screen pixel, so the pennant is deliberately large in frame —
// an earlier, daintier version simply read as a yellow smudge in a browser tab.
const GRID = [
  'nnnnnnnnnnnnnnnn',
  'nnnonnnnnnnnnnnn',
  'nnnohhhhhhhhhhhn',
  'nnnogggggggggsnn',
  'nnnoggggggggsnnn',
  'nnnogggggggsnnnn',
  'nnnoggggggsnnnnn',
  'nnnogggggsnnnnnn',
  'nnnoggggsnnnnnnn',
  'nnnoggsnnnnnnnnn',
  'nnnogsnnnnnnnnnn',
  'nnnonnnnnnnnnnnn',
  'nnnonnnnnnnnnnnn',
  'nnnonnnnnnnnnnnn',
  'nneeeeeeennnnnnn',
  'deeeeeeeeeeddnnn',
];

const W = GRID[0].length;
GRID.forEach((row, y) => {
  if (row.length !== W) throw new Error(`row ${y} is ${row.length} chars, expected ${W}`);
  [...row].forEach((c) => {
    if (!(c in PALETTE)) throw new Error(`row ${y}: unknown palette key '${c}'`);
  });
});

const rgba = (hex) =>
  hex === null
    ? [0, 0, 0, 0]
    : [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(255);

/** Nearest-neighbour scale to `size`, then encode as a PNG. */
function png(size) {
  if (size % W !== 0) {
    throw new Error(`${size} is not a whole multiple of the ${W}px grid — pixels would be uneven`);
  }
  const scale = size / W;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 4);
    const gy = Math.floor(y / scale);
    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / scale);
      row.set(rgba(PALETTE[GRID[gy][gx]]), x * 4);
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows.map((r) => Buffer.concat([Buffer.from([0]), r])));
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let TABLE;
function crc32(buf) {
  if (!TABLE) {
    TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLE[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** ICO wrapping PNG payloads — supported by every browser still in use. */
function ico(sizes) {
  const images = sizes.map(png);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + sizes.length * 16;
  const entries = sizes.map((size, i) => {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(images[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += images[i].length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images]);
}

/**
 * One <rect> per run of same-coloured pixels, so the file stays small.
 *
 * `field: false` drops the navy backdrop. The favicon needs the field to stay
 * legible against arbitrary browser chrome; in-page the mark sits on the
 * frosted panels, where a solid square would read as a heavy box.
 */
function svg({ field = true } = {}) {
  const parts = [];
  GRID.forEach((row, y) => {
    let x = 0;
    while (x < W) {
      const c = row[x];
      let run = 1;
      while (x + run < W && row[x + run] === c) run++;
      if (PALETTE[c] && (field || c !== 'n')) {
        parts.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PALETTE[c]}"/>`);
      }
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${GRID.length}" shape-rendering="crispEdges">${parts.join('')}</svg>\n`;
}

writeFileSync(join(OUT, 'favicon.svg'), svg());
writeFileSync(join(OUT, 'mark.svg'), svg({ field: false }));
writeFileSync(join(OUT, 'favicon.ico'), ico([16, 32, 48]));
writeFileSync(join(OUT, 'apple-touch-icon.png'), png(192));
console.log('wrote favicon.svg, mark.svg, favicon.ico, apple-touch-icon.png');
