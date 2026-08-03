# nrp-site

Astro site for the National Research Platform, deployed to Cloudflare Pages at https://nrp.ai.
Built on the [AstroWind](https://astrowind.vercel.app) template, with [Starlight](https://starlight.astro.build)
mounted at `/documentation` for the 143-page docs tree.

## Before any UI change: read DESIGN.md

[`DESIGN.md`](DESIGN.md) is the design system — color, type, surfaces, layout, geometry, components.
It is not optional reading and it is not descriptive: it is the spec the CSS implements.

The short version:

- **Never hardcode a color.** No `slate-900`, `blue-600`, `gray-800`, no bare hex. Use a `--nrp-*`
  token. The site previously laddered through four unrelated near-blacks because this rule didn't exist.
- **`--aw-*` tokens are legacy aliases**, kept only so unmigrated widgets keep working. Don't author
  new code against them.
- **Use the type scale classes** (`text-h1`…`text-eyebrow`), not ad-hoc `text-3xl`.
- **`WidgetWrapper.astro` owns container width and vertical rhythm.** Never set `max-w-*` or `py-*`
  per section.
- **Exactly one `<h1>` per page.**
- **Images through Astro's `<Image>` with `widths` + `sizes`.** Never a raw `<img>` into `static/`.
- **Verify contrast in both light and dark mode.** DESIGN.md §9 has the console probe.

## Repo footguns

**`astro.config.ts` inverts Astro's directory convention:**

```ts
outDir: 'public',     // build OUTPUT — gitignored, do not edit or commit
publicDir: 'static',  // committed static assets live HERE
```

So committed assets (`favicon.ico`, `robots.txt`, `_headers`, `_redirects`, `NRP-AUP.pdf`) go in
`static/`. Anything you find in `public/` is generated and will be overwritten by the next build.

**The docs sidebar is hand-maintained.** Adding or removing a page under
`src/content/docs/Documentation/` requires editing the ~390-line `sidebar` array in `astro.config.ts`
by hand — it is not generated from the filesystem. New docs pages should be `.mdx`, not `.md`.

**Blog posts live at the site root**, not under `/blog/` — `src/config.yaml` sets the post permalink to
`/%slug%`. `/blog` is the list page.

**`src/content/post_wp/` (75 files) and `post_original/` (6) are not registered collections.** They are
a WordPress migration backlog and the original template demo posts; they don't build. Only
`src/content/post/` (15 files) is live.

## Commands

```bash
npm run dev       # dev server on :4321
npm run build     # writes to public/ (see above)
npm run check     # astro check + eslint + prettier
npm run fix       # eslint --fix + prettier --write
```

## Conventions

- `~` aliases `src/` (Vite alias in `astro.config.ts`, mirrored in `tsconfig.json`).
- Site config is `src/config.yaml`, exposed as the virtual module `astrowind:config` by the local
  integration in `vendor/integration/`. Import `SITE`, `METADATA`, `I18N`, `APP_BLOG` from there.
- Nav and footer content is data, in `src/navigation.ts` — not markup in the components.
- Interactive/authenticated views are Vue islands under `src/components/vue/`, registered in
  `src/pages/_app.ts`. Auth lives in `src/auth.ts` (nanostores).
- Charts are D3 / Observable Plot under `src/components/plots/`.

## Naming

**NRP** is the platform (public-facing, use in marketing copy and nav). **Nautilus** is the Kubernetes
cluster it runs on (technical, use in docs and cluster UI). Don't mix them into compound names like
"NRP Nautilus" — see DESIGN.md §12.

## Note on deleted pages

`about`, `pricing`, `services`, `privacy`, and `terms` were unmodified AstroWind demo pages that
shipped to production with placeholder content (a fictional "AstroWind LLC" as privacy-policy data
controller, lorem ipsum, a paid tier for a free platform). They are deleted, with 301s in
`static/_redirects`.

`/about` has since been **rewritten as a real page** (`src/pages/about.astro`) — what the NRP is, the
NRP/Nautilus distinction, PI and co-PIs, the team, NSF funding, and how to join. It replaced
`/people`, which now 301s to it. `pricing`, `services`, `privacy`, and `terms` are still gone.

**The site still has no privacy policy or terms of use.** Real ones need writing and institutional
review — Plausible analytics and CILogon auth are both in play. Do not regenerate these from a
template. `static/NRP-AUP.pdf` is the closest existing real document.

## Two places to keep in sync

Facts that appear twice, because there is no single source for them yet:

- **NSF award numbers** — `footerData.funding.text` in `src/navigation.ts` and the `nsfAwards` array in
  `src/pages/about.astro`.
- **Cluster scale figures** — these DO have one source, `src/data/cluster-stats.ts`, used by the
  homepage hero and `/about`. Verify against Grafana before changing them.
