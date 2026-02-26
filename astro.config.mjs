// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import remarkWikiLink from 'remark-wiki-link';

// https://astro.build/config
export default defineConfig({
  site: 'https://vitormpcastro.github.io',
  // base matches the repository name so all asset/page paths are prefixed
  // correctly when served from github.io/dotcom/.
  // REMOVE base and set site to 'https://synadrive.com' once a custom domain
  // is configured in the repository GitHub Pages settings.
  base: '/dotcom',

  markdown: {
    remarkPlugins: [
      // Resolve Obsidian [[wikilinks]] to /synadrive/<slug>/ routes.
      // pageResolver: converts link text to a URL slug (lowercase, spaces → hyphens).
      // hrefTemplate: maps the slug to the final URL path.
      [remarkWikiLink, {
        pageResolver: (name) => [name.toLowerCase().replace(/\s+/g, '-')],
        hrefTemplate: (permalink) => `/synadrive/${permalink}/`,
        aliasDivider: '|',
      }],
    ],
  },

  integrations: [
    starlight({
      title: 'Synadrive',
      // TODO: update href once the public GitHub repository URL is confirmed
      social: [],
      sidebar: [
        {
          // Auto-synced Obsidian vault docs live here.
          // Files are populated by the sync_to_web.yml GitHub Actions workflow.
          label: 'Game Design',
          autogenerate: { directory: 'synadrive' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});