#!/usr/bin/env node
// Lager delingsbildet (public/og.png, 1200×630) som vises når sider deles på LinkedIn, Facebook o.l.
// Bruk: node scripts/lag-delingsbilde.mjs <portrett.jpg> ["linje under navnet"]
import sharp from 'sharp';
import fs from 'node:fs';

const [portrett, linje = 'Synspunkter, bokmeldinger og ukentlig nyhetsbrev'] = process.argv.slice(2);
if (!portrett || !fs.existsSync(portrett)) { console.error('Bruk: node scripts/lag-delingsbilde.mjs <portrett.jpg> ["linje"]'); process.exit(1); }

const W = 1200, H = 630, D = 300; // D = diameter på portrettet
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#fbf8f3"/>
  <rect x="0" y="0" width="14" height="${H}" fill="#7a2e1f"/>
  <text x="96" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="700" fill="#2a2522">Rune Røsten</text>
  <text x="96" y="345" font-family="Georgia, serif" font-size="36" fill="#6e655d">${esc(linje).replace(/^(.{1,30})\s(.*)$/, '<tspan x="96">$1</tspan><tspan x="96" dy="48">$2</tspan>')}</text>
  <text x="96" y="530" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="#7a2e1f">RUNEROSTEN.NO</text>
  <circle cx="${W - 96 - D / 2}" cy="${H / 2}" r="${D / 2 + 8}" fill="#e2d9cc"/>
</svg>`;

const sirkel = Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}"/></svg>`);
const rundt = await sharp(portrett).rotate().resize(D, D, { fit: 'cover', kernel: 'lanczos3' })
  .composite([{ input: sirkel, blend: 'dest-in' }]).png().toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: rundt, left: W - 96 - D, top: (H - D) / 2 }])
  .png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('Laget public/og.png');
