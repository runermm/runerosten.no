# Lag ditt eget nettsted

Denne oppskriften gjør runerosten.no om til *ditt* nettsted: synspunkter, bokmeldinger, boksamling,
leseliste, podkaster og album, og et nyhetsbrev. Alt er gratis, bortsett fra domenet (ca. 150 kr i året)
og eventuelt e-post på eget domene (ca. 29 kr i måneden).

> **Enklest:** Åpne kopien din i [Claude Code](https://claude.com/claude-code) eller Claude-appen og skriv
> *«sett opp dette nettstedet for meg»*. Claude leser `CLAUDE.md` og guider deg gjennom stegene under.

## Dette trenger du

| Hva | Hvorfor | Pris |
|---|---|---|
| [GitHub](https://github.com)-konto | Lagrer koden og publiserer nettstedet (GitHub Pages) | Gratis |
| [Node.js](https://nodejs.org) (LTS) på maskinen | For å se siden mens du jobber med den | Gratis |
| Et domene, f.eks. hos [Domeneshop](https://domene.shop) | Adressen til nettstedet | ca. 150 kr/år |
| [Raindrop.io](https://raindrop.io) (valgfritt) | Leseliste og podkaster du lagrer fra mobilen | Gratis |
| [Kit](https://kit.com) (valgfritt) | Påmelding og utsending av nyhetsbrev | Gratis til 10 000 |
| E-post på eget domene (valgfritt) | Kit krever en avsenderadresse på domenet ditt | ca. 29 kr/mnd hos Domeneshop |

## 1. Lag din kopi

1. Gå til malen på GitHub og trykk **Use this template → Create a new repository**.
2. Gi repoet et navn, for eksempel `mittnavn.no`. Det må være **Public** for gratis GitHub Pages.
3. Last det ned til maskinen (f.eks. med [GitHub Desktop](https://desktop.github.com)).
4. Åpne mappen i Terminal og kjør:

```bash
npm install
npm run nullstill -- --ja
npm run dev
```

`nullstill` fjerner Rune Røstens innhold og gir deg eksempler å starte fra. Siden vises på http://localhost:4321.

## 2. Gjør den til din

Alt personlig står i **`src/config.ts`**: navn, domene, sitatlinje, lenker, menyen, Kit og Raindrop.
Fyll inn det, og skriv så:

- **Om-siden:** `src/pages/om.astro`
- **Synspunkter:** én Markdown-fil per tekst i `src/content/artikler/`
- **Bokmeldinger:** én fil per bok i `src/content/anmeldelser/`
- **Album:** `src/data/musikk.json` (Tidal-ID-en står i album-lenken)
- **Boksamling:** `src/data/bokhylle.json`

Har du innlegg på LinkedIn, kan du importere dem: be om dataarkivet ditt (Innstillinger → Personvern for
data → Få en kopi av dataene dine → det store arkivet), pakk det ut og kjør
`npm run import:linkedin -- "<mappen>"`. Alt kommer inn som utkast.

## 3. Publiser på GitHub Pages

1. I repoet på GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Last opp endringene dine (commit + push). Nettstedet bygges og publiseres automatisk, og bygges på nytt
   hver morgen.
3. **Settings → Pages → Custom domain:** skriv domenet ditt.

## 4. Koble domenet

Hos domeneleverandøren, under DNS:

| Navn | Type | Verdi |
|---|---|---|
| *(tomt)* | A | `185.199.108.153` |
| *(tomt)* | A | `185.199.109.153` |
| *(tomt)* | A | `185.199.110.153` |
| *(tomt)* | A | `185.199.111.153` |
| `www` | CNAME | `<brukernavn>.github.io` |

Etter litt tid lager GitHub et https-sertifikat. Står det fast i mer enn en time, fjern domenet under
Settings → Pages og legg det inn igjen.

## 5. Leseliste og podkaster (Raindrop)

1. Lag to samlinger i Raindrop, f.eks. **Leseliste** og **Podkast**.
2. Lag en nøkkel: Raindrop → Innstillinger → Integrasjoner → For utviklere → Opprett ny app → Opprett testtoken.
3. Lokalt: legg den i en fil `.env` som `RAINDROP_TOKEN=...`. På GitHub: **Settings → Secrets and variables →
   Actions → New repository secret**, navn `RAINDROP_TOKEN`.
4. Samlingenes ID-er står i adressen når du åpner dem i Raindrop. Legg dem inn i `src/config.ts`.

Kommentaren du skriver i Raindrop blir overskriften. Bøker i leselisten får taggen `bok`.

## 6. Nyhetsbrev (Kit)

1. Opprett konto på kit.com med **Sign up free** (ikke prøveperioden).
2. Lag en avsenderadresse på domenet ditt (f.eks. `nyhetsbrev@mittnavn.no`) og legg den inn under
   Settings → Email.
3. Lag et skjema (Grow → Landing Pages & Forms → Form). ID-en står i adressen. Legg den inn i `src/config.ts`.
4. Under Settings → Email → Verified Sending Domain får du tre CNAME-pekere. Legg dem inn hos
   domeneleverandøren. Har du allerede en `_dmarc`-oppføring, lar du den stå.
5. Kit godkjenner nye kontoer manuelt. Inntil de har gjort det, sendes ingen bekreftelses-e-post.

**Gmail-fella:** Videresender adressen til Gmail, og du tester fra samme Gmail, vises e-posten bare i «Sendt».
Test fra en annen adresse.

## Lisens

Koden er MIT-lisensiert. Innholdet (tekster, bilder, data) i originalen tilhører Rune Røsten og følger ikke
med, så husk `npm run nullstill`.
