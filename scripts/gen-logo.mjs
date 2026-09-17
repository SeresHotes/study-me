// Генерирует public/studyme-logo.png (512x512) для OAuth consent screen Google.
// Фиолетовый фон + белый знак ◐ (кольцо + залитая правая половина), как у иконки.
// Запуск: node scripts/gen-logo.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SIZE = 512;
const cx = SIZE / 2;
const cy = SIZE / 2;
const r = 150;
const strokeHalf = 17;

const bg = [108, 92, 231];
const white = [255, 255, 255];

const raw = Buffer.alloc((SIZE * 3 + 1) * SIZE);
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const onRing = Math.abs(d - r) <= strokeHalf;
    const filledHalf = dx >= 0 && d <= r - strokeHalf + 1;
    const c = onRing || filledHalf ? white : bg;
    raw[p++] = c[0];
    raw[p++] = c[1];
    raw[p++] = c[2];
  }
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 2;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'studyme-logo.png');
writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
