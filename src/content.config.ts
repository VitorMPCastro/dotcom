import { defineCollection, z } from 'astro:content';

const synadrive = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    // Adicione outros campos que você costuma usar no Obsidian
  }),
});

export const collections = { 'synadrive': synadrive };