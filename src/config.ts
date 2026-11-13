// Grunninnstillinger for nettstedet. Endre her, så oppdateres hele siden.
export const SITE = {
  title: 'Rune Røsten',
  description: 'Synspunkter, bokmeldinger og nyhetsbrev.',
  author: 'Rune Røsten',
  lang: 'nb',
};

// Nyhetsbrev via Kit (https://kit.com).
// Lag et skjema i Kit (Grow → Landing Pages & Forms) og skriv inn skjema-ID-en her.
export const NEWSLETTER = {
  kitFormId: '10182455',
};

// Leseliste fra Raindrop.io, samlingen «Leseliste».
// Nøkkelen settes som RAINDROP_TOKEN i .env (se README). Uten nøkkel vises eksempler.
// Ting med taggen «bok» vises som bøker, alt annet som artikler.
export const LESELISTE = {
  collectionId: 77118163,
  bookTag: 'bok',
};

export const NAV = [
  { href: '/artikler/', label: 'Synspunkt' },
  { href: '/anmeldelser/', label: 'Bokmelding' },
  { href: '/bokhylle/', label: 'Boksamling' },
  { href: '/leseliste/', label: 'Leseliste' },
  { href: '/nyhetsbrev/', label: 'Nyhetsbrev' },
  { href: '/om/', label: 'Om' },
];
