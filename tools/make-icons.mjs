// Draws the app icons with no dependencies: the mark is only circles, so each
// pixel is computed directly (4×4 supersampled) and written as a PNG with zlib.
// The mark: two rings and a bull, and a red dot that nearly hit it.
//   node tools/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const INK = [0x11, 0x11, 0x11];
const PAPER = [0xf2, 0xf2, 0xee];
const RED = [0xe4, 0x32, 0x2b];

/** Shapes in units of the icon size (0..1), drawn in order. */
function shapes(scale) {
  const c = 0.5;
  const s = (v) => v * scale;
  return [
    { kind: 'ring', x: c, y: c, r: s(0.34), w: s(0.045), color: PAPER },
    { kind: 'ring', x: c, y: c, r: s(0.2), w: s(0.045), color: PAPER },
    { kind: 'disc', x: c, y: c, r: s(0.055), color: PAPER },
    { kind: 'disc', x: c + s(0.105), y: c - s(0.085), r: s(0.085), color: RED },
  ];
}

function colorAt(x, y, list) {
  let col = INK;
  for (const sh of list) {
    const d = Math.hypot(x - sh.x, y - sh.y);
    if (sh.kind === 'disc' ? d <= sh.r : Math.abs(d - sh.r) <= sh.w / 2) col = sh.color;
  }
  return col;
}

function png(size, list) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const ss = 4;
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const c = colorAt((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, list);
          acc[0] += c[0];
          acc[1] += c[1];
          acc[2] += c[2];
        }
      const o = py * (size * 3 + 1) + 1 + px * 3;
      for (let k = 0; k < 3; k++) raw[o + k] = Math.round(acc[k] / (ss * ss));
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const table = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

mkdirSync('public/pwa', { recursive: true });
writeFileSync('public/pwa/icon-192.png', png(192, shapes(1)));
writeFileSync('public/pwa/icon-512.png', png(512, shapes(1)));
// Maskable: the mark inside the 80 % safe zone.
writeFileSync('public/pwa/maskable-512.png', png(512, shapes(0.78)));
writeFileSync('public/apple-touch-icon.png', png(180, shapes(0.9)));

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const svgShapes = shapes(1)
  .map((sh) =>
    sh.kind === 'disc'
      ? `<circle cx="${sh.x * 64}" cy="${sh.y * 64}" r="${(sh.r * 64).toFixed(2)}" fill="${hex(sh.color)}"/>`
      : `<circle cx="${sh.x * 64}" cy="${sh.y * 64}" r="${(sh.r * 64).toFixed(2)}" fill="none" stroke="${hex(sh.color)}" stroke-width="${(sh.w * 64).toFixed(2)}"/>`,
  )
  .join('');
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${hex(INK)}"/>${svgShapes}</svg>\n`,
);
console.log('icons written');
