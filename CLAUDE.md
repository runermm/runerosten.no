# Instruksjoner for Claude

Dette er et personlig nettsted bygget med Astro, publisert på GitHub Pages. Det er laget for runerosten.no,
men repoet er en mal andre kan kopiere. Brukerne er ofte ikke utviklere: svar på norsk, enkelt og kort,
vis resultatet før du publiserer, og spør før noe publiseres.

## Hvis brukeren vil sette opp sitt eget nettsted

Følg `docs/LAG-DITT-EGET.md` steg for steg, og gjør det tekniske selv:

1. Sjekk at Node.js finnes (`node -v`). Mangler det: be brukeren installere LTS fra nodejs.org.
2. Sjekk om innholdet fortsatt er Rune Røstens (`SITE.title` i `src/config.ts` er «Rune Røsten»).
   I så fall, og bare når brukeren bekrefter at dette er DERES kopi: `npm run nullstill -- --ja`.
   Kjør det aldri i originalrepoet `runermm/runerosten.no`.
3. Spør etter navn, domene og det de vil skrive om, og fyll inn `src/config.ts` og `src/pages/om.astro`.
4. Hjelp med GitHub Pages, DNS, Raindrop og Kit i den rekkefølgen brukeren vil. Brukeren oppretter kontoer
   og legger inn nøkler og passord selv: be dem aldri lime nøkler inn i chatten.

## Slik er prosjektet bygget

- `src/config.ts`: ALT personlig (navn, domene, sitatlinje, lenker, meny, Kit-skjema, Raindrop-samlinger).
- `src/content/artikler/`: synspunkter (Markdown). Felter: title, description (ingress), date, tags,
  image/imageAlt/imageCredit/imagePortrait, linkedin, draft.
- `src/content/anmeldelser/`: bokmeldinger. title = bokens tittel, headline = egen overskrift, bookAuthor,
  rating (valgfritt terningkast 1–6), image, bokelskere, linkedin, draft.
- `src/data/`: bokhylle.json (boksamling), musikk.json (Tidal-album), oppmote.json (arrangementer).
- `src/leseliste.ts`, `src/podkaster.ts`: henter fra Raindrop ved bygging (RAINDROP_TOKEN).
- `src/pages/index.astro`: forsiden er én kronologisk feed (Synspunkt/Bokmelding) avbrutt av
  Leser nå, På øret og på repeat, Oppmøte, nyhetsbrev, Fra leselisten og Fra arkivet.
- `scripts/import-linkedin.mjs`: importerer LinkedIn-arkiv som utkast. `scripts/nullstill.mjs`: tømmer innhold.
- `.github/workflows/publiser.yml`: bygger og publiserer ved push til main og hver morgen.

## Arbeidsmåte

- Bygg og sjekk lokalt (`npm run build`, `npm run dev`) før publisering.
- Endringer i `src/content.config.ts` krever omstart av `npm run dev` (og gjerne `rm -rf .astro`).
- Behold brukerens tekster ordrett. Ikke finn på terningkast, sitater eller fakta.
- Bilder skal ikke beskjæres. Store bilder skaleres ned med sharp før de legges i `public/bilder/`.
- Commit-meldinger på norsk. Publiser (push) bare når brukeren har sagt ja.
