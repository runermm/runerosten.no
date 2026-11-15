#!/usr/bin/env node
// Viser status for nyhetsbrevet rett fra Kit, uten å logge inn.
//
// Bruk:  npm run abonnenter            (oversikt + de nyeste)
//        npm run abonnenter -- --alle  (hele listen)
//
// Krever KIT_API_KEY i .env (Kit → Settings → Developer → API keys, v4-nøkkel).
// E-postadressene vises bare i terminalen og lagres ikke noe sted.

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
  console.error('Mangler KIT_API_KEY i .env. Lag en nøkkel i Kit: Settings → Developer → API keys (v4).');
  process.exit(1);
}

async function hentAlle(status) {
  const alle = [];
  let after;
  do {
    const url = new URL('https://api.kit.com/v4/subscribers');
    url.searchParams.set('status', status);
    url.searchParams.set('per_page', '1000');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: { 'X-Kit-Api-Key': KEY, Accept: 'application/json' } });
    if (!res.ok) {
      console.error(`Kit svarte ${res.status}: ${(await res.text()).slice(0, 200)}`);
      process.exit(1);
    }
    const data = await res.json();
    alle.push(...data.subscribers);
    after = data.pagination?.has_next_page ? data.pagination.end_cursor : undefined;
  } while (after);
  return alle;
}

const [aktive, avmeldte] = await Promise.all([hentAlle('active'), hentAlle('cancelled')]);
const dager = (d) => (Date.now() - new Date(d).getTime()) / 864e5;
const dato = (d) => new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
aktive.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

console.log(`\nNyhetsbrevet – ${new Date().toLocaleDateString('nb-NO', { dateStyle: 'long' })}\n`);
console.log(`  Abonnenter:        ${aktive.length}`);
console.log(`  Nye siste 7 dager: ${aktive.filter((s) => dager(s.created_at) <= 7).length}`);
console.log(`  Nye siste 30 dager: ${aktive.filter((s) => dager(s.created_at) <= 30).length}`);
console.log(`  Avmeldt totalt:    ${avmeldte.length}\n`);

const visning = process.argv.includes('--alle') ? aktive : aktive.slice(0, 10);
if (visning.length) {
  console.log(process.argv.includes('--alle') ? '  Alle abonnenter:' : '  Nyeste:');
  for (const s of visning) console.log(`    ${dato(s.created_at).padEnd(14)} ${s.email_address}${s.first_name ? ` (${s.first_name})` : ''}`);
  console.log('');
}
