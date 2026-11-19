#!/usr/bin/env node
// Lager toppbildet til nyhetsbrevet (public/bilder/nyhetsbrev/topp.png, 1200×440, vises som 600×220 i e-posten).
// Bruk: node scripts/lag-nyhetsbrevtopp.mjs <portrett.jpg> ["Tittel"] ["slagord"] ["navn"]
import sharp from 'sharp';
import fs from 'node:fs';

const [portrett, tittel = 'Nyhetsbrev', linje = 'Start fredagen med noe å tenke på', navn = 'Rune Røsten'] = process.argv.slice(2);
if (!portrett || !fs.existsSync(portrett)) { console.error('Bruk: node scripts/lag-nyhetsbrevtopp.mjs <portrett.jpg> ["Tittel"] ["slagord"] ["navn"]'); process.exit(1); }

const W = 1200, H = 440, R = 310, D = 270; // R = høyden på den røde flaten, D = diameter på portrettet
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const cx = W - 90 - D / 2; // portrettet til høyre
// Skillet mellom rødt og lyst deler portrettet i det gylne snitt: 61,8 % i det røde, 38,2 % i det lyse.
const cy = R - D * (0.618 - 0.5);
// Rød flate øverst med tittel og slagord, lys stripe under med navnet. Portrettet bryter skillelinja.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#fbf8f3"/>
  <rect width="${W}" height="${R}" fill="#7a2e1f"/>
  <text x="64" y="170" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="700" fill="#fbf8f3">${esc(tittel)}</text>
  <text x="66" y="236" font-family="Georgia, 'Times New Roman', serif" font-size="36" fill="#f3d9cf">${esc(linje)}</text>
  <text x="66" y="392" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-weight="700" fill="#2a2522">${esc(navn)}</text>
  <circle cx="${cx}" cy="${cy}" r="${D / 2 + 10}" fill="#fbf8f3"/>
</svg>`;

const sirkel = Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}"/></svg>`);
const rundt = await sharp(portrett).rotate().resize(D, D, { fit: 'cover', kernel: 'lanczos3' })
  .composite([{ input: sirkel, blend: 'dest-in' }]).png().toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: rundt, left: cx - D / 2, top: Math.round(cy - D / 2) }])
  .png({ compressionLevel: 9 }).toFile('public/bilder/nyhetsbrev/topp.png');
console.log('Laget public/bilder/nyhetsbrev/topp.png');
