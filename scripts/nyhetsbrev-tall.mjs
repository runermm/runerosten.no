#!/usr/bin/env node
// Oppsummering av siste utsendelse fra Kit: åpninger, klikk per lenke og abonnenter.
//
// Bruk:  npm run nyhetsbrev-tall
//
// Krever KIT_API_KEY i .env. Viser bare tall og lenker, aldri e-postadresser.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const KEY = process.env.KIT_API_KEY;
if (!KEY) {
  console.error('Mangler KIT_API_KEY i .env.');
  process.exit(1);
}

async function kit(sti) {
  const res = await fetch(`https://api.kit.com/v4/${sti}`, { headers: { 'X-Kit-Api-Key': KEY, Accept: 'application/json' } });
  if (!res.ok) {
    console.error(`Kit svarte ${res.status}: ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
  return res.json();
}

async function antall(status) {
  let n = 0, nye = 0, after;
  do {
    const d = await kit(`subscribers?status=${status}&per_page=1000${after ? `&after=${after}` : ''}`);
    n += d.subscribers.length;
    nye += d.subscribers.filter((s) => Date.now() - new Date(s.created_at) <= 7 * 864e5).length;
    after = d.pagination?.has_next_page ? d.pagination.end_cursor : undefined;
  } while (after);
  return { n, nye };
}

const { broadcasts } = await kit('broadcasts?per_page=50');
const sendte = broadcasts
  .filter((b) => b.published_at)
  .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
  .slice(0, 2);

const dato = (d) => new Date(d).toLocaleString('nb-NO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Oslo' });

for (const [i, b] of sendte.entries()) {
  const { broadcast: { stats: s } } = await kit(`broadcasts/${b.id}/stats`);
  console.log(`\n${i === 0 ? 'SISTE UTSENDELSE' : 'FORRIGE UTSENDELSE (til sammenligning)'}`);
  console.log(`  ${b.subject} – sendt ${dato(b.published_at)}`);
  console.log(`  Mottakere: ${s.recipients}`);
  console.log(`  Åpnet:     ${s.emails_opened} (${s.open_rate} %)`);
  console.log(`  Klikk:     ${s.total_clicks} totalt, klikkrate ${s.click_rate} %`);
  console.log(`  Avmeldt:   ${s.unsubscribes}`);
  if (i === 0) {
    const { broadcast: { clicks } } = await kit(`broadcasts/${b.id}/clicks`);
    const brukt = clicks.filter((c) => c.unique_clicks > 0).sort((a, b) => b.unique_clicks - a.unique_clicks);
    console.log('  Klikk per lenke (unike):');
    if (!brukt.length) console.log('    (ingen klikk ennå)');
    for (const c of brukt) console.log(`    ${String(c.unique_clicks).padStart(3)}  ${c.url}`);
  }
}
if (!sendte.length) console.log('\nIngen utsendelser er sendt ennå.');

const [aktive, avmeldte] = await Promise.all([antall('active'), antall('cancelled')]);
console.log(`\nABONNENTER\n  ${aktive.n} aktive, ${aktive.nye} nye siste 7 dager, ${avmeldte.n} avmeldt totalt\n`);
