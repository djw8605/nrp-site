# NRP web site

The site is based on [astrowind](https://astrowind.vercel.app) tamplate.

Production site: [https://portal.nrp.ai](https://portal.nrp.ai), [https://portal.nationalresearchplatform.org](https://portal.nationalresearchplatform.org). The `main `branch is automagically deployed there.

Dev site: [https://dev.nrp-portal.pages.dev](https://dev.nrp-portal.pages.dev), branches other than `main` are deployed there.

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