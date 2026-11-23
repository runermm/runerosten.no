// «Oppmøte ute og inne»: økter fra Strava (ute, src/data/oppmote.json) og arrangementer (inne),
// som hentes fra Readwise med taggen OPPMOTE.inneTag ved bygging. Vises kronologisk om hverandre.
import data from './data/oppmote.json';
import { OPPMOTE } from './config';
import { fetchBokmerker, type Bokmerke } from './readwise';

export type Ute = 'sykkel' | 'løping' | 'tur' | 'ski' | 'svømming' | 'trening';
export type Inne = 'konsert' | 'kino' | 'teater' | 'foredrag' | 'annet';
export interface Event {
  type: Ute | Inne;
  detail?: string; // kort og gjerne kryptisk, f.eks. «87 km» eller «4:12 t»
  title: string; // f.eks. artist, film eller forestilling
  venue?: string; // sted
  city?: string;
  date: string; // ÅÅÅÅ-MM-DD
  note?: string; // en setning fra deg
  image?: string;
  url?: string;
}

export const UTE: string[] = ['sykkel', 'løping', 'tur', 'ski', 'svømming', 'trening'];
const INNE: Inne[] = ['konsert', 'kino', 'teater', 'foredrag', 'annet'];

// Readwise-bokmerke → arrangement. Typen kan settes med en tagg (konsert, kino, teater, foredrag),
// ellers blir det «Arrangement». Datoen er dagen bokmerket ble lagret.
const tilEvent = (r: Bokmerke): Event => {
  const tag = r.tags.find((t) => (INNE as string[]).includes(t)) as Inne | undefined;
  const date = new Date(r.created).toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' }); // ÅÅÅÅ-MM-DD
  return {
    type: tag ?? 'annet',
    title: r.title.replace(/\s+[·|]\s+[^·|]+$/, '').trim(), // «Agent Meetup Oslo · Luma» → «Agent Meetup Oslo»
    date,
    note: r.note,
    image: r.cover,
    url: r.link,
  };
};

let cache: Promise<Event[]> | undefined;
export function getOppmote(): Promise<Event[]> {
  cache ??= (async () => {
    let inne: Event[] = [];
    if (OPPMOTE.inneTag) {
      try {
        inne = ((await fetchBokmerker(OPPMOTE.inneTag)) ?? []).map(tilEvent);
      } catch (err) {
        console.warn(`${(err as Error).message}. Oppmøte inne er ikke oppdatert.`);
      }
    }
    return [...(data.events as Event[]), ...inne].sort((a, b) => b.date.localeCompare(a.date));
  })();
  return cache;
}
