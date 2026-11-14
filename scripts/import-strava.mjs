#!/usr/bin/env node
// Importerer økter med bilder fra et Strava-arkiv (export_<id>.zip) til «Oppmøte ute og inne».
//
// Bruk:  npm run import:strava -- "<sti til export_xxx.zip>" [--fra=2025] [--virtuelle]
//
// - Bare økter med bilder tas med. Første bilde per økt brukes, skalert ned (bildene beskjæres ikke).
// - Virtuelle økter (Zwift o.l.) hoppes over, med mindre --virtuelle er med.
// - Økter som allerede er importert, røres ikke. Arrangementer («inne») i oppmote.json beholdes.
// - Arkivet er Stravas eksport av dine egne data; Strava-API-et brukes ikke.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(ROOT, 'src/data/oppmote.json');
const IMG_DIR = path.join(ROOT, 'public/bilder/oppmote');
const zip = process.argv[2];
const FRA = Number(process.argv.find((a) => a.startsWith('--fra='))?.slice(6) ?? 2025);
const VIRTUELLE = process.argv.includes('--virtuelle');

if (!zip || !fs.existsSync(zip)) {
  console.error('Bruk: npm run import:strava -- "<sti til export_xxx.zip>" [--fra=2025]');
  process.exit(1);
}

// Enkel CSV-tolker (sitater, kommaer og linjeskift i felt).
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

// «24. juni 2015, 16.28.44» (norsk) eller «Jun 24, 2015, 4:28:44 PM» (engelsk) → ÅÅÅÅ-MM-DD
const MND = { januar: 1, februar: 2, mars: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11, desember: 12 };
function isoDate(s) {
  const no = s.match(/(\d{1,2})\.\s*([a-zæøå]+)\.?\s+(\d{4})/i);
  // Strava forkorter ofte månedene («aug.», «feb.»), så vi matcher på de tre første bokstavene.
  const m = no && Object.entries(MND).find(([navn]) => navn.slice(0, 3) === no[2].toLowerCase().slice(0, 3))?.[1];
  if (m) return `${no[3]}-${String(m).padStart(2, '0')}-${no[1].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

// Stravas aktivitetstyper (norsk og engelsk) → typene i Oppmøte
const TYPE = [
  [/virtuell|virtual/i, 'virtuell'],
  [/sykkel|ride|bike|cycl/i, 'sykkel'],
  [/løp|run/i, 'løping'],
  [/gå|walk|hike|fottur|tur/i, 'tur'],
  [/langrenn|alpint|frikjør|ski|snowboard/i, 'ski'],
  [/svøm|swim/i, 'svømming'],
];
const typeOf = (t) => TYPE.find(([re]) => re.test(t))?.[1] ?? 'trening';

const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.')) || 0;
function detail(type, km, sek) {
  if (km >= 1 && type !== 'ski') return `${Math.round(km)} km`;
  if (sek > 0) { const t = Math.floor(sek / 3600), m = Math.round((sek % 3600) / 60); return t ? `${t}:${String(m).padStart(2, '0')} t` : `${m} min`; }
  return km ? `${Math.round(km)} km` : undefined;
}

// Les øktlisten rett fra ZIP-filen
const csv = execFileSync('unzip', ['-p', zip, 'activities.csv'], { maxBuffer: 1 << 28 }).toString('utf8');
const rows = parseCsv(csv);
const h = rows[0];
const col = (...names) => names.map((n) => h.indexOf(n)).find((i) => i >= 0);
const C = {
  id: col('Aktivitets-ID', 'Activity ID'), date: col('Aktivitetsdato', 'Activity Date'), name: col('Aktivitetsnavn', 'Activity Name'),
  type: col('Aktivitetstype', 'Activity Type'), time: col('Totaltid', 'Elapsed Time'), dist: col('Distanse', 'Distance'), media: col('Media'),
};

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const known = new Set(data.events.filter((e) => e.stravaId).map((e) => String(e.stravaId)));
const valgt = rows.slice(1).map((r) => ({
  id: r[C.id], date: isoDate(r[C.date]), name: r[C.name].trim(), rawType: r[C.type], type: typeOf(r[C.type]),
  km: num(r[C.dist]), sek: num(r[C.time]),
  media: r[C.media].split('|').map((m) => m.trim()).filter((m) => /\.(jpe?g|png|heic|webp)$/i.test(m)),
})).filter((a) => a.media.length && a.date && Number(a.date.slice(0, 4)) >= FRA && (VIRTUELLE || a.type !== 'virtuell') && !known.has(a.id));

console.log(`Økter med bilder fra ${FRA}: ${valgt.length} nye å importere${VIRTUELLE ? '' : ' (virtuelle hoppet over)'}`);
if (!valgt.length) process.exit(0);

// Pakk ut bare de bildene vi trenger, til en midlertidig mappe
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'strava-'));
const files = valgt.map((a) => a.media[0]);
for (let i = 0; i < files.length; i += 200) execFileSync('unzip', ['-q', '-o', zip, ...files.slice(i, i + 200), '-d', tmp]);
fs.mkdirSync(IMG_DIR, { recursive: true });

let ok = 0, feil = 0;
for (const a of valgt) {
  const src = path.join(tmp, a.media[0]);
  const out = path.join(IMG_DIR, `${a.id}.jpg`);
  try {
    let input = src;
    if (/\.heic$/i.test(src)) { input = src.replace(/\.heic$/i, '.jpg'); execFileSync('sips', ['-s', 'format', 'jpeg', src, '--out', input], { stdio: 'ignore' }); }
    await sharp(input).rotate().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
    data.events.push({
      type: a.type === 'virtuell' ? 'sykkel' : a.type, title: a.name, date: a.date, detail: detail(a.type, a.km, a.sek),
      image: `/bilder/oppmote/${a.id}.jpg`, url: `https://www.strava.com/activities/${a.id}`, stravaId: a.id,
    });
    ok++;
  } catch (err) {
    feil++; console.warn(`  ! Hoppet over ${a.id} (${a.name}): ${err.message}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

data.events.sort((x, y) => y.date.localeCompare(x.date));
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`Ferdig: ${ok} økter importert${feil ? `, ${feil} hoppet over` : ''}.`);
