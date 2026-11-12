// Grunninnstillinger for nettstedet. Endre her, så oppdateres hele siden.
export const SITE = {
  title: 'Rune Røsten',
  description: 'Artikler, bokanmeldelser og nyhetsbrev.',
  author: 'Rune Røsten',
  lang: 'nb',
};

// Nyhetsbrev via Buttondown (https://buttondown.com).
// Opprett en konto og skriv inn brukernavnet ditt her for å aktivere skjemaet.
export const NEWSLETTER = {
  buttondownUsername: '', // f.eks. 'runerosten'
};

// Leseliste fra Raindrop.io, samlingen «Leseliste».
// Nøkkelen settes som RAINDROP_TOKEN i .env (se README). Uten nøkkel vises eksempler.
// Ting med taggen «bok» vises som bøker, alt annet som artikler.
export const LESELISTE = {
  collectionId: 77118163,
  bookTag: 'bok',
};

export const NAV = [
  { href: '/artikler/', label: 'Artikler' },
  { href: '/anmeldelser/', label: 'Bokanmeldelser' },
  { href: '/bokhylle/', label: 'Bokhylle' },
  { href: '/leseliste/', label: 'Leseliste' },
  { href: '/nyhetsbrev/', label: 'Nyhetsbrev' },
  { href: '/om/', label: 'Om' },
];
