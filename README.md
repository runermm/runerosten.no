# runerosten.no

Personlig nettsted med artikler, bokanmeldelser og nyhetsbrev. Bygget med [Astro](https://astro.build).

## Kom i gang

Krever [Node.js](https://nodejs.org) (versjon 20 eller nyere).

```bash
npm install
npm run dev
```

Åpne http://localhost:4321 i nettleseren. Siden oppdateres automatisk når du endrer filer.

## Skrive innhold

| Hva | Hvor |
|---|---|
| Artikler | `src/content/artikler/*.md` |
| Bokanmeldelser | `src/content/anmeldelser/*.md` |
| Om-siden | `src/pages/om.astro` |
| Navn, beskrivelse, meny | `src/config.ts` |

Filnavnet blir adressen: `src/content/artikler/min-tekst.md` → `runerosten.no/artikler/min-tekst/`.

### Ny artikkel

```markdown
---
title: Tittel
description: En setning som vises i lister og i søkeresultater.
date: 2026-11-10
tags: [valgfritt]
draft: true   # fjern når den skal publiseres
---

Teksten din her.
```

### Ny bokanmeldelse

```markdown
---
title: Bokens tittel
bookAuthor: Forfatter
published: 2024        # valgfritt
publisher: Forlag      # valgfritt
genre: Roman           # valgfritt
rating: 4              # terningkast 1–6
description: Kort oppsummering.
date: 2026-11-10
---

Anmeldelsen din her.
```

## Nyhetsbrev

Påmeldingsskjemaet bruker [Kit](https://kit.com) (gratis opp til 10 000 abonnenter).

1. I Kit: Grow → Landing Pages & Forms → Create new → Form → Inline.
2. Skjema-ID-en står i adressen når du redigerer skjemaet (`.../forms/1234567/edit`).
3. Sett den i `src/config.ts` under `NEWSLETTER.kitFormId`.
4. Nyhetsbrev skrives og sendes fra Kit (Send → Broadcasts).

## Leseliste (Raindrop.io)

Leselisten på /leseliste/ hentes fra Raindrop-samlingen «Leseliste» hver gang siden bygges.

- Lagre artikler i samlingen «Leseliste» og skriv et notat. Notatet blir kommentaren din.
- Bøker: lagre bokens side (f.eks. på bokelskere.no) med taggen `bok`.
- Nøkkel: Raindrop → Innstillinger → Integrasjoner → For utviklere → Opprett ny app → Opprett testtoken.
  Lim den inn i `.env` som `RAINDROP_TOKEN=...`. Hos hostingtjenesten legges den inn som miljøvariabel med samme navn.
- Uten nøkkel vises eksemplene i `src/data/leseliste-eksempel.json`.

## Publisere

Nettstedet bygges til statiske filer med `npm run build` (havner i `dist/`). Gratis hosting:

- **Netlify** eller **Cloudflare Pages**: koble til GitHub-repoet, byggkommando `npm run build`, mappe `dist`.
- Pek domenet runerosten.no til hostingtjenesten i DNS-innstillingene hos domeneleverandøren.
