# NRP web site

## Immportant notes for documentation:

1. **🚨If you add or remove pages, please modify the navbar in *astro.config.ts*🚨**
1. *Always* use .mdx not .md so things don't break
1. To use 'note' blocks, use the :::note ::: syntax
1. For any enumrated steps, please use Steps (import { Steps } from '@astrojs/starlight/components';)


The site is based on [astrowind](https://astrowind.vercel.app) template.

Production site: [https://nrp.ai](https://nrp.ai), [https://nrp.ai](https://nrp.ai). The `main` branch is automagically deployed there.

Branches other than `main` are deployed to https://<branch_name>.nrp-portal.pages.dev

Local development:

On first start install all NPM packages:

```
npm i
```

Then run dev version:

```
npm run dev
```

## Uploading media

```
wrangler r2 object put nrp-site/presentations/<file> -f <path_to_file>
```

or

```
find <folder> -mindepth 1 -print0 | xargs -0 -n1 -I{} wrangler r2 object put "nrp-site/{}" -f "{}"
```