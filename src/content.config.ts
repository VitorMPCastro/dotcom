import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// All site content — including auto-synced Obsidian vault files — lives under
// src/content/docs/. Starlight routes everything here automatically.
//
// Synced Obsidian files land in src/content/docs/synadrive/ via the
// sync_to_web.yml GitHub Actions workflow. Do NOT edit those files directly;
// they are overwritten on every push to the Obsidian vault's main branch.
//
// docsSchema() enables all Starlight frontmatter features. The `extend` block
// adds Obsidian-specific fields that are not in the base schema so they pass
// validation silently instead of being rejected.
//
// NOTE: `banner` and `cover` are deliberately NOT listed here because
// Starlight's built-in banner schema (object type) conflicts with Obsidian's
// string URL format and `extend` cannot override base fields. Those two fields
// are stripped at source by the sync_to_web.yml workflow instead.

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Obsidian-specific fields — silently accepted, not rendered.
        tags: z.array(z.string()).optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        created: z.coerce.date().optional(),
        updated: z.coerce.date().optional(),
        version: z.string().optional(),
        aliases: z.array(z.string()).optional(),
        'linter-yaml-title-alias': z.string().optional(),
      }),
    }),
  }),
};