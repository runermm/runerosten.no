import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { leselisteLoader } from './leseliste';
import { podkastLoader } from './podkaster';

const artikler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artikler' }),
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

export const collections = { artikler, anmeldelser, leseliste, podkaster };
