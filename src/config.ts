// ─────────────────────────────────────────────────────────────────────────────
// ALT SOM ER PERSONLIG FOR DETTE NETTSTEDET STÅR I DENNE FILEN.
// Lager du ditt eget nettsted fra denne malen, er det her du starter.
// Se docs/LAG-DITT-EGET.md for hele oppskriften.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE = {
  title: 'Rune Røsten', // navnet øverst til venstre og i nettleserfanen
  author: 'Rune Røsten',
  description: 'Synspunkter, bokmeldinger og nyhetsbrev.',
  url: 'https://runerosten.no', // domenet ditt (brukes til lenker, sitemap og GitHub Pages)
  lang: 'nb',
  initial: 'R', // bokstaven i favikonet (ikonet i nettleserfanen)
  // Tynn sitatlinje under menyen på forsiden. Sett til null for å skjule den.
  tagline: {
    quote: 'Yrkesveien til mannen som sitter foran meg er som en komprimert idéhistorie over internetts utvikling.',
    source: 'Morgenbladet',
  } as { quote: string; source: string } | null,
  repo: 'https://github.com/runermm/runerosten.no' as string | null, // lenke til kildekoden i bunnen, eller null
  bokelskere: 'https://bokelskere.no/profil/rune' as string | null, // profilen boksamlingen er hentet fra, eller null
  email: 'kontakt@runerosten.no' as string | null, // kontaktadresse på Om-siden, eller null
  linkedin: 'https://www.linkedin.com/in/runerosten' as string | null, // LinkedIn-profil, eller null
};

// Nyhetsbrev via Kit (https://kit.com).
// Lag et skjema i Kit (Grow → Landing Pages & Forms) og skriv inn skjema-ID-en her.
export const NEWSLETTER = {
  kitFormId: '10182455',
  // Vises øverst når leseren kommer tilbake fra bekreftelsen (sett «https://dittdomene/?confirm» som
  // adressen etter bekreftelse i Kit).
  confirmMessage: 'Takk for at du følger meg! Nyhetsbrevet kommer hver fredag morgen. Hold ut!',
};

// Leseliste fra Raindrop.io, samlingen «Leseliste».
// Nøkkelen settes som RAINDROP_TOKEN i .env (se README). Uten nøkkel vises eksempler.
// Ting med taggen «bok» vises som bøker, alt annet som artikler.
export const LESELISTE = {
  collectionId: 77118163,
  bookTag: 'bok',
};

// Podkaster til «På øret og på repeat», fra en egen Raindrop-samling. 0 = av.
export const PODKAST = {
  collectionId: 77181505, // samlingen «podcast»
};

export const NAV = [
  { href: '/artikler/', label: 'Synspunkt' },
  { href: '/anmeldelser/', label: 'Bokmelding' },
  { href: '/bokhylle/', label: 'Boksamling' },
  { href: '/leseliste/', label: 'Leseliste' },
  { href: '/nyhetsbrev/', label: 'Nyhetsbrev' },
  { href: '/om/', label: 'Om' },
];
