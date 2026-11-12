// Lager illustrasjonen til «Selvrefererende forbedring»: artikkelen om Claude, på et nettsted Claude bygget,
// illustrert av Claude – som et bilde av artikkelen, i artikkelen, i artikkelen …
// Kjør: node src/assets-src/selvreferanse.mjs  (skriver SVG og PNG)
import fs from 'node:fs';
import sharp from 'sharp';

const C = { bg: '#f3ede3', page: '#fbf8f3', bar: '#efe7da', line: '#e2d9cc', text: '#2a2522', muted: '#8b8279', accent: '#7a2e1f' };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "Menlo, 'SF Mono', Monaco, monospace";
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Ett nettleservindu med artikkelen. Bildefeltet inneholder neste vindu, i mindre skala.
function windowAt(x, y, w, depth) {
  const h = w * 0.625;
  const r = Math.max(1, w * 0.012);
  let s = '';
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${C.page}" stroke="${C.line}" stroke-width="${Math.max(0.3, w * 0.0018)}"/>`;
  if (w < 14) return s + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${C.accent}"/>`;

  // Adresselinje
  const bar = w * 0.045;
  s += `<path d="M${x} ${y + bar} V${y + r} q0 ${-r} ${r} ${-r} H${x + w - r} q${r} 0 ${r} ${r} V${y + bar} Z" fill="${C.bar}"/>`;
  ['#d9a29a', '#e3b04b', '#a7b89a'].forEach((c, i) => {
    s += `<circle cx="${x + w * (0.025 + i * 0.022)}" cy="${y + bar / 2}" r="${w * 0.0065}" fill="${c}"/>`;
  });
  s += `<rect x="${x + w * 0.11}" y="${y + bar * 0.22}" width="${w * 0.6}" height="${bar * 0.56}" rx="${bar * 0.28}" fill="${C.page}"/>`;
  if (w > 220) s += `<text x="${x + w * 0.125}" y="${y + bar * 0.66}" font-family="${SANS}" font-size="${w * 0.016}" fill="${C.muted}">runerosten.no/artikler/selvrefererende-forbedring</text>`;

  // Dato, tittel og ingress
  const L = x + w * 0.204; // samme venstrekant som bildefeltet
  if (w > 160) {
    s += `<text x="${L}" y="${y + w * 0.08}" font-family="${SANS}" font-size="${w * 0.013}" fill="${C.muted}">5. november 2026</text>`;
    s += `<text x="${L}" y="${y + w * 0.122}" font-family="${SERIF}" font-weight="600" font-size="${w * 0.036}" fill="${C.text}">Selvrefererende forbedring</text>`;
  } else {
    s += `<rect x="${L}" y="${y + w * 0.1}" width="${w * 0.42}" height="${w * 0.028}" rx="${w * 0.006}" fill="${C.text}" opacity="0.75"/>`;
  }
  [0.52, 0.47].forEach((len, i) => {
    s += `<rect x="${L}" y="${y + w * (0.142 + i * 0.022)}" width="${w * len}" height="${w * 0.011}" rx="${w * 0.005}" fill="${C.line}"/>`;
  });

  // Bildefeltet – her bor neste nivå
  const iw = w * 0.592, ih = iw * 0.625, ix = L, iy = y + w * 0.2;
  s += `<rect x="${ix - w * 0.006}" y="${iy - w * 0.006}" width="${iw + w * 0.012}" height="${ih + w * 0.012}" rx="${r}" fill="${C.bar}"/>`;
  s += windowAt(ix, iy, iw, depth + 1);

  // Bildetekst
  if (w > 260) {
    s += `<text x="${L}" y="${iy + ih + w * 0.03}" font-family="${SANS}" font-size="${w * 0.0125}" fill="${C.muted}">Illustrasjon laget av Claude, KI-modellen artikkelen handler om.</text>`;
  } else {
    s += `<rect x="${L}" y="${iy + ih + w * 0.018}" width="${w * 0.4}" height="${w * 0.009}" rx="${w * 0.004}" fill="${C.line}"/>`;
  }
  return s;
}

const W = 1200, H = 750;
const ww = 1040, wx = (W - ww) / 2, wy = 26;
const prompt = 'lag en illustrasjon av din egen selvreferanse';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect x="${wx + 6}" y="${wy + 10}" width="${ww}" height="${ww * 0.625}" rx="12" fill="#000" opacity="0.06"/>
  ${windowAt(wx, wy, ww, 0)}
  <text x="${wx}" y="${H - 22}" font-family="${MONO}" font-size="17" fill="${C.accent}">› ${esc(prompt)}</text>
  <rect x="${wx + 17 * 0.602 * (prompt.length + 2) + 4}" y="${H - 37}" width="9" height="19" fill="${C.accent}" opacity="0.8"/>
  <text x="${wx + ww}" y="${H - 22}" text-anchor="end" font-family="${SANS}" font-size="14" fill="${C.muted}">Rune til Claude, kvelden før</text>
</svg>`;

const dir = new URL('.', import.meta.url).pathname;
fs.writeFileSync(dir + 'selvreferanse.svg', svg);
const info = await sharp(Buffer.from(svg), { density: 144 }).resize(1600).png({ compressionLevel: 9 })
  .toFile(new URL('../../public/bilder/artikler/selvreferanse.png', import.meta.url).pathname);
console.log(`${info.width}x${info.height}, ${info.size} bytes`);
