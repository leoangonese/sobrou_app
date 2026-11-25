const fs = require('fs');
const path = require('path');

const VERSION = 4;
const SIZE = 17 + VERSION * 4;
const DATA_BYTES = 80;
const ECC_BYTES = 20;
const OUT = path.join(__dirname, '..', 'assets');

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}
function rsRemainder(data, degree) {
  let gen = [1];
  let root = 1;
  for (let i = 0; i < degree; i++) {
    const next = Array(gen.length + 1).fill(0);
    gen.forEach((v, j) => { next[j] ^= v; next[j + 1] ^= gfMul(v, root); });
    gen = next;
    root = gfMul(root, 2);
  }
  const msg = [...data, ...Array(degree).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = msg[i];
    if (factor) gen.forEach((v, j) => { msg[i + j] ^= gfMul(v, factor); });
  }
  return msg.slice(data.length);
}
function makeQr(text) {
  const payload = Buffer.from(text, 'utf8');
  if (payload.length > 78) throw new Error('QR payload exceeds version 4-L capacity');
  const bits = [];
  const push = (value, count) => { for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  push(4, 4);
  push(payload.length, 8);
  payload.forEach(byte => push(byte, 8));
  for (let i = 0; i < Math.min(4, DATA_BYTES * 8 - bits.length); i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((n, bit) => n * 2 + bit, 0));
  for (let pad = 0xec; data.length < DATA_BYTES; pad ^= 0xec ^ 0x11) data.push(pad);
  const codewords = [...data, ...rsRemainder(data, ECC_BYTES)];

  const matrix = Array.from({length: SIZE}, () => Array(SIZE).fill(null));
  const finder = (top, left) => {
    for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) {
      const y = top + dy, x = left + dx;
      if (y < 0 || x < 0 || y >= SIZE || x >= SIZE) continue;
      const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
      matrix[y][x] = inside && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
    }
  };
  finder(0, 0); finder(0, SIZE - 7); finder(SIZE - 7, 0);
  for (let i = 8; i < SIZE - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  for (const cy of [6, SIZE - 7]) for (const cx of [6, SIZE - 7]) {
    if (matrix[cy][cx] !== null) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) matrix[cy + dy][cx + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
  }
  // Format locations and the fixed dark module are reserved before data placement.
  for (let i = 0; i <= 5; i++) matrix[i][8] = false;
  matrix[7][8] = matrix[8][8] = matrix[8][7] = false;
  for (let i = 9; i < 15; i++) matrix[8][14 - i] = false;
  for (let i = 0; i < 8; i++) matrix[8][SIZE - 1 - i] = false;
  for (let i = 8; i < 15; i++) matrix[SIZE - 15 + i][8] = false;
  matrix[SIZE - 8][8] = true;

  const dataBits = codewords.flatMap(byte => Array.from({length: 8}, (_, i) => (byte >>> (7 - i)) & 1));
  let bitIndex = 0, upward = true;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right--;
    for (let vert = 0; vert < SIZE; vert++) {
      const y = upward ? SIZE - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (matrix[y][x] !== null) continue;
        let dark = bitIndex < dataBits.length ? dataBits[bitIndex++] === 1 : false;
        if ((y + x) % 2 === 0) dark = !dark;
        matrix[y][x] = dark;
      }
    }
    upward = !upward;
  }
  if (bitIndex !== dataBits.length) throw new Error('QR data placement mismatch');

  // L error correction, mask 0, then BCH format information.
  const formatData = 1 << 3;
  let rem = formatData;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537);
  const format = ((formatData << 10) | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) matrix[i][8] = ((format >>> i) & 1) !== 0;
  matrix[7][8] = ((format >>> 6) & 1) !== 0;
  matrix[8][8] = ((format >>> 7) & 1) !== 0;
  matrix[8][7] = ((format >>> 8) & 1) !== 0;
  for (let i = 9; i < 15; i++) matrix[8][14 - i] = ((format >>> i) & 1) !== 0;
  for (let i = 0; i < 8; i++) matrix[8][SIZE - 1 - i] = ((format >>> i) & 1) !== 0;
  for (let i = 8; i < 15; i++) matrix[SIZE - 15 + i][8] = ((format >>> i) & 1) !== 0;
  matrix[SIZE - 8][8] = true;

  const quiet = 4, view = SIZE + quiet * 2;
  const cells = [];
  matrix.forEach((row, y) => row.forEach((dark, x) => { if (dark) cells.push(`M${x + quiet},${y + quiet}h1v1h-1z`); }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" shape-rendering="crispEdges"><rect width="${view}" height="${view}" fill="#fff"/><path d="${cells.join('')}" fill="#123d2e"/></svg>`;
}

const codes = [
  ['qr-landing.svg', 'https://leoangonese.github.io/sobrou_app/index.html'],
  ['qr-app-demo.svg', 'https://leoangonese.github.io/sobrou_app/app.html']
];
for (const [name, url] of codes) {
  fs.writeFileSync(path.join(OUT, name), makeQr(url), 'utf8');
  console.log(`${name}: ${url}`);
}
