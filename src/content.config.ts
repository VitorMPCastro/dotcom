import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// All site content — including auto-synced Obsidian vault files — lives under
// src/content/docs/. Starlight routes everything here automatically.
//
// Synced Obsidian files land in src/content/docs/synadrive/ via the
// sync_to_web.yml GitHub Actions workflow. Do NOT edit those files directly;
// they are overwritten on every push to the Obsidian vault's main branch.
//
// docsSchema() enables all Starlight frontmatter features: template, hero,
// sidebar.order/badge, pagefind search indexing, prev/next links, ToC, etc.
// Unknown Obsidian-specific frontmatter fields (banner, cover, tags, etc.)
// are silently stripped by the schema — this is expected and harmless.

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
  }),
};