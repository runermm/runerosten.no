import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { leselisteLoader } from './leseliste';
import { podkastLoader } from './podkaster';

const artikler = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artikler' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    linkedin: z.string().url().optional(), // lenke til originalinnlegget
    image: z.string().optional(), // bilde øverst, f.eks. /bilder/artikler/navn.png
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),
    imagePortrait: z.boolean().optional(), // stående bilde
    forsideplass: z.number().int().min(1).optional(), // fest innlegget på denne plassen i forsidefeeden
    utenPamelding: z.boolean().optional(), // skjul påmeldingsboksen nederst (f.eks. når den står inne i teksten)
    draft: z.boolean().default(false),
  }),
});

const anmeldelser = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/anmeldelser' }),
  schema: z.object({
    title: z.string(), // bokens tittel
    headline: z.string().optional(), // egen overskrift for anmeldelsen
    image: z.string().optional(), // eget bilde, f.eks. /bilder/anmeldelser/bok.jpg
    imageAlt: z.string().optional(),
    bookAuthor: z.string(),
    published: z.number().int().optional(), // utgivelsesår
    publisher: z.string().optional(),
    genre: z.string().optional(),
    rating: z.number().int().min(1).max(6).optional(), // terningkast (valgfritt)
    description: z.string(),
    date: z.coerce.date(), // når anmeldelsen ble publisert
    bokelskere: z.string().url().optional(), // lenke til omtalen på bokelskere.no
    linkedin: z.string().url().optional(), // lenke til originalinnlegget på LinkedIn
    tags: z.array(z.string()).default([]),
    forsideplass: z.number().int().min(1).optional(), // fest innlegget på denne plassen i forsidefeeden
    draft: z.boolean().default(false),
  }),
});

const leseliste = defineCollection({
  loader: leselisteLoader(),
  schema: z.object({
    id: z.string(),
    type: z.enum(['artikkel', 'bok']),
    title: z.string(),
    url: z.string().url(),
    source: z.string(),
    author: z.string().optional(),
    note: z.string().optional(),
    image: z.string().url().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const podkaster = defineCollection({
  loader: podkastLoader(),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    show: z.string().optional(),
    url: z.string().url(),
    cover: z.string().url().optional(),
    note: z.string().optional(),
    date: z.coerce.date(),
  }),
});

// Nyhetsbrevet: hver utgave som egen side på /nyhetsbrev/<dato>/ (filnavn: ÅÅÅÅ-MM-DD.md, utsendelsesdatoen).
const nyhetsbrev = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/nyhetsbrev' }),
  schema: z.object({
    nr: z.number().int().min(1), // utgavenummer: 1, 2, 3 …
    title: z.string(), // tittelen; emnefelt og overskrift blir «Rune #<nr>: <title>»
    description: z.string().optional(), // forhåndstekst / kort ingress
    date: z.coerce.date(), // utsendelsesdato
    image: z.string().optional(), // bilde ved deling
    draft: z.boolean().default(false),
  }),
});

export const collections = { artikler, anmeldelser, leseliste, podkaster, nyhetsbrev };
