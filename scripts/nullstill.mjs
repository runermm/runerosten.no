#!/usr/bin/env node
// Fjerner Rune Røstens innhold fra en kopi av malen, så du starter med blanke ark.
//
// Bruk (i DIN kopi av repoet):  npm run nullstill -- --ja
//
// Dette sletter artikler, anmeldelser, bilder, boksamling, album og Om-teksten,
// og setter de personlige innstillingene i src/config.ts til plassholdere.
// Det kan angres med git (git checkout .) så lenge du ikke har committet.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const p = (...a) => path.join(ROOT, ...a);

if (!process.argv.includes('--ja')) {
  console.log(`
Dette sletter alt innholdet på nettstedet (artikler, anmeldelser, bilder,
boksamling, album, Om-siden) og nullstiller src/config.ts.

Kjør bare dette i din EGEN kopi av malen. Bekreft med:

  npm run nullstill -- --ja
`);
  process.exit(1);
}

const rmDir = (d) => fs.rmSync(p(d), { recursive: true, force: true });
const write = (f, s) => { fs.mkdirSync(path.dirname(p(f)), { recursive: true }); fs.writeFileSync(p(f), s); };

// Innhold
rmDir('src/content/artikler');
rmDir('src/content/anmeldelser');
rmDir('public/bilder');
rmDir('src/assets-src');

write('src/content/artikler/velkommen.md', `---
title: Velkommen
description: Dette er et eksempel på et synspunkt. Bytt det ut med din egen tekst.
date: ${new Date().toISOString().slice(0, 10)}
tags: []
---

Hver artikkel er en tekstfil i \`src/content/artikler/\`. Øverst står tittel, ingress og dato.
Under skriver du teksten i Markdown.

Vil du ha et bilde øverst, legger du det i \`public/bilder/artikler/\` og skriver
\`image: /bilder/artikler/navn.jpg\` øverst i filen.
`);

write('src/content/anmeldelser/eksempel.md', `---
title: Bokens tittel
headline: En egen overskrift for anmeldelsen
bookAuthor: Forfatter
description: Ingressen til bokmeldingen.
date: ${new Date().toISOString().slice(0, 10)}
draft: true
---

Skriv bokmeldingen her. Fjern \`draft: true\` øverst når den skal publiseres.
`);

// Data
write('src/data/bokhylle.json', JSON.stringify({ source: '', fetched: '', books: [] }, null, 1) + '\n');
write('src/data/musikk.json', JSON.stringify({
  _info: '«På øret og på repeat». Album: id fra Tidal. Podkast: type "podcast", url, cover, title, artist (programmet).',
  albums: [],
}, null, 2) + '\n');
write('src/data/oppmote.json', JSON.stringify({
  _info: 'Oppmøte: konserter, kino og andre arrangementer. type: konsert | kino | teater | foredrag | annet. Tom liste = seksjonen skjules.',
  events: [],
}, null, 2) + '\n');

// Om-siden
write('src/pages/om.astro', `---
import Base from '../layouts/Base.astro';
import { SITE } from '../config';
---
<Base title="Om" description={\`Om \${SITE.author}.\`}>
  <article class="wrap prose">
    <h1>Om meg</h1>
    <p class="lead">Skriv et par setninger om deg selv her.</p>
    <p>Denne siden ligger i <code>src/pages/om.astro</code>.</p>
  </article>
</Base>
`);

// Innstillinger
const cfgPath = p('src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
const set = (re, val) => { cfg = cfg.replace(re, val); };
set(/title: '[^']*'/, "title: 'Ditt Navn'");
set(/author: '[^']*'/, "author: 'Ditt Navn'");
set(/url: '[^']*'/, "url: 'https://example.no'");
set(/initial: '[^']*'/, "initial: 'D'");
set(/tagline: \{[\s\S]*?\} as/, 'tagline: null as');
set(/repo: '[^']*' as/, 'repo: null as');
set(/bokelskere: '[^']*' as/, 'bokelskere: null as');
set(/email: '[^']*' as/, 'email: null as');
set(/linkedin: '[^']*' as/, 'linkedin: null as');
set(/profileEmbed: `[^`]*`/, 'profileEmbed: ``');
set(/kitFormId: '[^']*'/, "kitFormId: ''");
set(/(LESELISTE = \{\s*collectionId: )\d+/, '$10');
set(/(PODKAST = \{\s*collectionId: )\d+/, '$10');
fs.writeFileSync(cfgPath, cfg);

// Videresendinger for sider som ikke lenger finnes
const astroCfg = p('astro.config.ts');
fs.writeFileSync(astroCfg, fs.readFileSync(astroCfg, 'utf8').replace(/redirects: \{[\s\S]*?\},/, 'redirects: {},'));

console.log(`
Ferdig. Innholdet er fjernet, og src/config.ts har plassholdere.

Neste steg:
  1. Åpne src/config.ts og fyll inn navn, domene og resten.
  2. Kjør npm run dev og se på siden på http://localhost:4321
  3. Følg docs/LAG-DITT-EGET.md for Raindrop, Kit, domene og publisering.
`);
