// Boksamlingen fra bokelskere.no (src/data/bokhylle.json).
import data from './data/bokhylle.json';

export type Status = 'leser' | 'lest' | 'skal-lese' | 'oppslagsverk';
export interface Bok {
  title: string;
  author?: string;
  status: Status;
  cover?: string;
  year?: number;
  favorite?: boolean;
  order: number; // rekkefølge etter siste aktivitet på bokelskere
}

export const STATUS_LABEL: Record<Status, string> = {
  leser: 'Leser',
  lest: 'Lest',
  'skal-lese': 'Skal lese',
  oppslagsverk: 'Oppslagsverk',
};

export const boker = (data.books as Bok[]).slice().sort((a, b) => a.order - b.order);

// Omslag i passende størrelse fra bokelskere sin bildetjeneste.
export const coverUrl = (b: Bok, w = 320) => (b.cover ? `${b.cover}?w=${w}&fmt=webp` : undefined);

// De sist oppdaterte bøkene du leser nå.
export const leserNa = (n = 6) => boker.filter((b) => b.status === 'leser').slice(0, n);
