import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';

import starlight from '@astrojs/starlight';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',
  outDir: 'public',
  publicDir: 'static',
  
  integrations: [
    starlight({
      title: 'NRP Nautilus',
      editLink: {
        baseUrl: 'https://gitlab.nrp-nautilus.io/prp/nrp-site',
      },
      sidebar: [
        {
          label: "User documentation",
          items: [
          {
            label: "Start",
            autogenerate: { directory: 'Documentation/userdocs/start' },
          },
          {
            label: "Tutorials",
            autogenerate: { directory: 'Documentation/userdocs/tutorial' },
          },
          {
            label: "Coder",
            autogenerate: { directory: 'Documentation/userdocs/coder' },
          },
          {
            label: "AI",
            autogenerate: { directory: 'Documentation/userdocs/ai' },
          },
          {
            label: "Development",
            autogenerate: { directory: 'Documentation/userdocs/development' },
          },
          {
            label: "FPGAs",
            autogenerate: { directory: 'Documentation/userdocs/fpgas' },
          },
          {
            label: "Storage",
            autogenerate: { directory: 'Documentation/userdocs/storage' },
          }
        ]
      },
      {
        label: "Admin documentation",
        items: [

              {
                label: "Participating",
                autogenerate: { directory: 'Documentation/admindocs/Participating' },
              },
              {
                label: "Perfsonar",
                autogenerate: { directory: 'Documentation/admindocs/Perfsonar' },
              },
              {
                label: "FIONA",
                autogenerate: { directory: 'Documentation/admindocs/FIONA' },
              },
              {
                label: "NRP",
                autogenerate: { directory: 'Documentation/admindocs/NRP' },
              },
              {
                label: "Storage",
                autogenerate: { directory: 'Documentation/admindocs/Storage' },
              },
              {
                label: "Vault",
                autogenerate: { directory: 'Documentation/admindocs/Vault' },
              },
              {
                label: "Links",
                autogenerate: { directory: 'Documentation/admindocs/Links' },
              },
              {
                label: "Cluster admin",
                autogenerate: { directory: 'Documentation/admindocs/Cluster admin' },
              },
              {
                label: "Upgrades",
                autogenerate: { directory: 'Documentation/admindocs/Upgrades' },
              },

          ]
        },
      ],
    }),
    tailwind({
    applyBaseStyles: true,
    }), sitemap(), mdx(), icon({
    include: {
      tabler: ['*'],
      mdi: ["*"],
      'flat-color-icons': [
        'template',
        'gallery',
        'approval',
        'document',
        'advertising',
        'currency-exchange',
        'voice-presentation',
        'business-contact',
        'database',
      ],
    },
  }), ...whenExternalScripts(() =>
    partytown({
      config: { forward: ['dataLayer.push'] },
    })
  ), compress({
    CSS: true,
    HTML: {
      'html-minifier-terser': {
        removeAttributeQuotes: false,
      },
    },
    Image: false,
    JavaScript: true,
    SVG: false,
    Logger: 1,
  }), astrowind({
    config: './src/config.yaml',
  })],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});