# NRP Design System

**Read this before making any UI change.** Every value below is a token defined in
[`src/components/CustomStyles.astro`](src/components/CustomStyles.astro) and surfaced to Tailwind in
[`tailwind.config.js`](tailwind.config.js). If you find yourself typing a raw hex code or a Tailwind
palette class (`slate-900`, `blue-600`, `gray-800`) into a component, stop — the token you want
already exists, and hardcoding is precisely how the mess this system replaced came about.

---

## 1. Direction

The NRP is a globe-spanning cluster of research hardware streaming live telemetry. The design should
read as a **scientific instrument**: precise, dense where density is earned, quiet everywhere else.
It should not read as a SaaS marketing page.

The palette is not invented. It is sampled directly from the NRP logo
(`src/assets/images/NRP_Horizontal_Logo.png.webp`), a gradient running blue → cyan → teal → green:

| Sampled   | Position in mark        |
| --------- | ----------------------- |
| `#4e98c6` | left edge of the **N**  |
| `#56bfd9` | the **R**               |
| `#38bfb1` | left of the **P**       |
| `#19b68c` | right edge of the **P** |

That axis is the brand. It is also, usefully, nothing like the generic institutional blue every other
`.edu` site uses.

**Test for whether a change fits:** does it make the site feel more like an instrument panel and less
like a template? If a decision is arbitrary, prefer the quieter option.

---

## 2. Color tokens

### Brand ramp

Anchored on the logo's cyan (`400`) and teal. Contrast ratios are measured, not estimated.
Tailwind exposes these as `teal-50` … `teal-950` (e.g. `bg-teal-700`, `text-teal-300`).

| Token            | Hex       | on `#ffffff` | on `#0a1118` | Use                                       |
| ---------------- | --------- | ------------ | ------------ | ----------------------------------------- |
| `--nrp-teal-50`  | `#eefafd` | 1.06         | 17.83        | tinted backgrounds (light)                |
| `--nrp-teal-100` | `#d3f2f8` | 1.18         | 16.11        | tinted backgrounds (light)                |
| `--nrp-teal-200` | `#a9e6f1` | 1.37         | 13.81        | borders on dark, selection                |
| `--nrp-teal-300` | `#6fd3e5` | 1.73         | **10.96**    | **dark-mode link / accent text**          |
| `--nrp-teal-400` | `#56bfd9` | 2.13         | **8.90**     | dark-mode accents, focus ring (logo cyan) |
| `--nrp-teal-500` | `#2aa5c4` | 2.89         | 6.58         | decorative fills, chart series            |
| `--nrp-teal-600` | `#1785a4` | **4.26**     | 4.45         | light-mode focus ring; safe on both modes |
| `--nrp-teal-700` | `#136a85` | **6.13**     | 3.10         | **light-mode link, primary button fill**  |
| `--nrp-teal-800` | `#14566c` | 8.15         | 2.33         | light-mode button hover                   |
| `--nrp-teal-900` | `#15485a` | 9.97         | 1.90         | light-mode headings on tint               |
| `--nrp-teal-950` | `#082e3c` | 14.32        | 1.33         | text on bright teal fills                 |

> The AstroWind blue this replaced (`#0161ef`) measured 5.31:1 on white. `teal-700` at 6.13:1 is
> _better_, so the brand change costs nothing in accessibility.

**Never use `teal-300`/`400`/`500` as text on a light background** (all below 3:1). **Never use
`teal-700`/`800`/`900` as text on a dark background.** The ramp is not symmetric; pick by mode.

### Signature gradient — `--nrp-gradient-spectrum`

```css
linear-gradient(90deg, #4e98c6, #56bfd9, #38bfb1, #19b68c)
```

Used only via the `.spectrum-rule` class (a 2px bar). See §6.

### Surfaces

A single ladder. Higher number = further from the page. The _direction_ inverts per mode (light steps
get darker, dark steps get lighter) so that "elevation" reads correctly in both. Tailwind exposes
these as `surface-page`, `surface-1` … `surface-4`, `surface-sunken`.

| Token                  | Light     | Dark      | Use                               |
| ---------------------- | --------- | --------- | --------------------------------- |
| `--nrp-surface-sunken` | `#f1f4f8` | `#070c12` | wells, code blocks, footer        |
| `--nrp-surface-page`   | `#ffffff` | `#0a1118` | the body background — the default |
| `--nrp-surface-1`      | `#f7f9fb` | `#101a24` | alternating full-width sections   |
| `--nrp-surface-2`      | `#eef2f6` | `#17242f` | cards, panels                     |
| `--nrp-surface-3`      | `#e4eaf0` | `#1f303d` | card hover, nested panels         |
| `--nrp-surface-4`      | `#d7e0e8` | `#283a49` | popovers, active states           |

**Rules.**

- Adjacent full-width sections must not use the same step. This is the rule that was missing before,
  when the homepage stepped through `#030620 → #1e293b → #0f172a → gray-800/50` — four unrelated
  near-blacks in no order.
- Light-mode steps are deliberately subtle (`page → 1` is only a 1.055 luminance ratio). For two
  adjacent full-width sections in light mode, prefer a two-step jump (`page` → `2`).
- Text tokens are only guaranteed legible on these six surfaces. On an arbitrary Tailwind color or a
  photo, you own the contrast check yourself.

### Text

Tailwind exposes these as `text-heading`, `text-body`, `text-muted`.

| Token                | Light     | Dark      |
| -------------------- | --------- | --------- |
| `--nrp-text-heading` | `#0b1620` | `#f2f6fa` |
| `--nrp-text-body`    | `#1c2b38` | `#e2e8ee` |
| `--nrp-text-muted`   | `#4f6072` | `#9aa8b8` |

### Interactive & lines

| Token                   | Light     | Dark      | Notes                                            |
| ----------------------- | --------- | --------- | ------------------------------------------------ |
| `--nrp-link`            | `#136a85` | `#6fd3e5` | use the `.link` class, never a raw `text-blue-*` |
| `--nrp-ring`            | `#1785a4` | `#56bfd9` | focus ring; ≥3:1 on every surface                |
| `--nrp-border-hairline` | `#d7dfe7` | `#1e2c39` | **decorative only** — see below                  |

`--nrp-border-hairline` is ~1.35:1 and deliberately whisper-quiet. It is legal for dividers and card
edges, which WCAG does not require to meet contrast. It is **not** legal as the sole means of
identifying a control boundary (e.g. an input's outline) — those need ≥3:1, so use `--nrp-ring` or
`teal-600`.

### Opacity modifiers do not work on these tokens

Every colour above resolves to a `var()`, and Tailwind **cannot inject an alpha channel into a
`var()`**. So `bg-teal-700/20`, `ring-primary/60`, and `bg-surface-page/90` do not produce a
translucent colour — Tailwind emits the class with no alpha, or omits the rule entirely, and it fails
silently. This shipped twice: an untinted category pill in the announcement bar, and a header
background that ignored its own opacity.

When you need translucency, write it in plain CSS with `color-mix`:

```css
background-color: color-mix(in srgb, var(--nrp-surface-page) 88%, transparent);
```

Literal colours (`bg-white/10`, `bg-black/40`) still take modifiers normally, because Tailwind knows
their channels — but prefer a token plus `color-mix` so the value follows the mode.

### Verified contrast matrix

All 12 surface × text-role combinations, both modes, pass WCAG AA. Worst cases:

|       | worst pair                  | ratio | required |
| ----- | --------------------------- | ----- | -------- |
| Light | `text-muted` on `surface-4` | 4.84  | 4.50     |
| Light | `--nrp-ring` on `surface-4` | 3.19  | 3.00     |
| Dark  | `text-muted` on `surface-4` | 4.84  | 4.50     |
| Dark  | `--nrp-ring` on `surface-4` | 5.50  | 3.00     |

Re-run the check in §9 after touching any color token.

---

## 3. Typography

Three faces, three jobs. Do not cross them.

| Token                | Face                        | Job                                                              |
| -------------------- | --------------------------- | ---------------------------------------------------------------- |
| `--nrp-font-display` | **Space Grotesk Variable**  | headings and stat figures **only**                               |
| `--nrp-font-sans`    | **Inter Variable**          | all body copy, UI labels, navigation                             |
| `--nrp-font-mono`    | **JetBrains Mono Variable** | code, commands, namespaces, model IDs, API keys, tabular figures |

Space Grotesk is a technical grotesque — it reads scientific without reading cold. Inter is the right
tool for dense UI and was already in the project. JetBrains Mono is new and load-bearing: this site is
full of `kubectl` invocations and identifiers that previously fell back to the browser's default mono.

Before this system, `--aw-font-sans`, `--aw-font-serif` and `--aw-font-heading` were all set to Inter
and there was no mono token at all. There is no serif token now; do not add one without a reason.

### Scale

Fluid via `clamp()`, so there is no separate mobile scale to maintain.

| Class          | Size                                          | Face    | Weight |
| -------------- | --------------------------------------------- | ------- | ------ |
| `text-h1`      | `clamp(2.5rem, 5vw, 3.75rem)`                 | display | 700    |
| `text-h2`      | `clamp(1.875rem, 3vw, 2.5rem)`                | display | 700    |
| `text-h3`      | `1.375rem`                                    | display | 600    |
| `text-h4`      | `1.125rem`                                    | display | 600    |
| `text-body`    | `1rem` / 1.65                                 | sans    | 400    |
| `text-lead`    | `1.125rem` / 1.6                              | sans    | 400    |
| `text-small`   | `0.875rem`                                    | sans    | 400    |
| `text-eyebrow` | `0.8125rem`, `uppercase`, `tracking-[0.08em]` | sans    | 600    |

**Use these classes, not ad-hoc `text-3xl`/`text-xl`.** The old site had `<h2>` at both 36px and
20px, and `<h3>` at 20.8px, 24px, _and_ 20px — the 20.8px being prose sizing leaking into a widget.
A scale you can bypass is not a scale.

**Measure caps.** Body and lead copy is capped so lines land in the 65–75 character band:
`text-lead` (18px) at `max-w-2xl` ≈ 74ch, body (16px) at `max-w-xl` ≈ 70ch. `Headline` applies the
`max-w-2xl` cap itself. Anything overriding `classes.subtitle` must keep a cap — `Content.astro` set
`max-w-3xl` there and reintroduced an 85ch line on three pages, and an uncapped paragraph inside a
full-width card on `/about` ran to **116ch**.

**Exactly one `<h1>` per page.** Only page-level heroes emit `<h1>`; every section heading is `<h2>`
or lower. (`HeroWide.astro` used to emit a second `<h1>`, giving the homepage two.)

---

## 4. Layout

| Rule              | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Content container | `max-w-6xl` (1152px) — **all** prose and marketing sections        |
| Wide container    | `max-w-7xl` — header, footer, and full-bleed grids **only**        |
| Gutters           | `px-4 sm:px-6`                                                     |
| Section rhythm    | `.section` = `py-16 md:py-24`; `.section-tight` = `py-10 md:py-14` |

**Breakpoints are Tailwind's defaults plus one: `nav` (1152px).** It is the width at which the
header's horizontal nav bar fits beside the logo and the utility controls; below it the hamburger owns
the nav. It exists because the seven top-level items measure ~716px, so at `md` the nav sat on top of
the wordmark and at `lg` it still overlapped both neighbours by ~47px. The number is defined once, in
`tailwind.config.js`, and referenced by `Header.astro`, the `#front-page #header` rules in
`assets/styles/tailwind.css` (via `theme('screens.nav')`) and the menu-closing `matchMedia` in
`common/BasicScripts.astro`. Adding a nav item means re-measuring it.

Don't reach for `nav` for anything else — a new one-off breakpoint per component is how a scale stops
being a scale.

[`src/components/ui/WidgetWrapper.astro`](src/components/ui/WidgetWrapper.astro) is the **only** place
container width and section padding are decided. A section that sets its own `max-w-*` or `py-*` is a
bug — that is how the homepage came to ladder through `7xl → 6xl → 6xl → 4xl → 5xl → 7xl` with content
edges visibly jumping on scroll.

Hand-rolled `<section>` blocks in page files are the anti-pattern. Wrap content in `WidgetWrapper` or
promote it to a widget.

**One left axis.** Page heroes are left-aligned, so `Headline` defaults to `align="left"` and section
headings sit on the same axis as the hero and the card content beneath them. Centred headings are
opt-in and currently justified in exactly two places: the `CallToAction` card and the `HeroWide`
banner, both of which centre their whole block deliberately.

---

## 5. Geometry

| Token / class        | Value                                           |
| -------------------- | ----------------------------------------------- |
| Buttons              | `rounded-md` (6px)                              |
| Cards, panels, media | `rounded-lg` (8px)                              |
| Inputs               | `rounded-md`                                    |
| Pills / badges       | `rounded-full` — badges **only**, never buttons |
| Hairline             | 1px, `--nrp-border-hairline`                    |

Buttons were `rounded-full` pills, AstroWind's signature shape and the single strongest "this is a
template" cue on the site. Squared-off geometry is the instrument-panel read.

---

## 6. Components

### Buttons

| Class            | Appearance                                                  | Use                            |
| ---------------- | ----------------------------------------------------------- | ------------------------------ |
| `.btn-primary`   | filled `teal-700` (light) / `teal-400` (dark), `rounded-md` | one per view — the main action |
| `.btn-secondary` | hairline border, transparent fill                           | alternative actions            |
| `.btn-tertiary`  | text only                                                   | low-emphasis, inline           |

Text on fills: white on `teal-700` (6.13:1); `teal-950` on `teal-400` (7.48:1). All variants take
`--nrp-ring` on `:focus-visible`.

### `.link`

Every inline link. Resolves to `--nrp-link` per mode. This replaced hardcoded `text-blue-600`, which
measured **2.84:1** against the dark section it sat on — it had no `dark:` variant at all.

### `.spectrum-rule`

The signature element: a 2px bar carrying `--nrp-gradient-spectrum`, **exactly once per page, in the
hero, above the `<h1>`**, at `max-w-[9rem]`.

Nothing else may use it. The earlier rule allowed it under section eyebrows, on stat tiles, and as a
divider — and the result was 7 on the homepage and 8 on `/about`, which broke this rule's own second
sentence. One per page is the enforceable form.

**It lives in `Hero.astro`, so a page without a hero has none.** That is correct, not an omission:
`/llmtoken`, `/namespaces`, and `/contact` open on a `WidgetWrapper` title block with their content
directly beneath, because their whole job is a readout the reader came for. Do not hand-place a rule
above those headings to even the pages up — the alternative to a hero is not a hero with the art
removed.

Two sizing notes, both learned the hard way:

- **At `3.5rem` it stops being the signature.** The gradient has four stops across
  blue → cyan → teal → green; compressed into 56px they average into a flat teal dash that reads as a
  generic accent line rather than the logo's spectrum. `9rem` is the floor where the gradient is legible.
- It carries the page's **one authored motion** via `.spectrum-rule--draw` (see below). Nothing else on
  these pages animates on entrance.

### No kickers

**Never put an eyebrow, kicker, or label above a heading.** The heading carries its own weight. This
was the site's most repeated tic: `Headline` emitted `tagline` as an eyebrow plus a spectrum rule on
every section of every page.

`tagline` is still accepted by ~10 widgets and is **deliberately inert** — nothing renders it. Delete
the prop from the chain when convenience allows; do not wire it back up to a visible kicker.

Four things that look like kickers but are not, and are allowed:

| Allowed                             | Why                                                    |
| ----------------------------------- | ------------------------------------------------------ |
| `<dt>` labels under stat figures    | labels for data, not a heading's preamble              |
| `role` on a person card (`Co-PI`)   | a field on a record                                    |
| the pulsing dot + `Live` on `/`     | a status indicator reporting the feed below is current |
| column heads on a two-track readout | they name the tracks, and vanish when the tracks stack |

Dropdown group labels in the header (`Account`, `Cluster operations`) are menu section names, also fine.

The last row was added for the `/ai-hubs` crosswalk, where five rows pair an NSF requirement with the
NRP's answer and the two tracks are only distinguishable if something names them. It carries two
conditions, both load-bearing: the head sits in the card's own bordered band rather than floating over
the first row, and it is `hidden … md:grid`, because below `md` the tracks stack and a two-column head
would land on top of itself. When they stack, **each row labels its own halves instead** — the head
disappearing without a replacement is what turns a crosswalk into two unlabelled paragraphs, and that
shipped once here before it was caught. A label is legal on a readout that has tracks to name; it is
still never legal above a heading.

### Motion: one authored moment

`WidgetWrapper`, `ItemGrid`, `ItemGrid2`, `Timeline`, `Footer`, and four blog components each used to
apply AstroWind's `intersect-once … motion-safe:md:opacity-0 motion-safe:md:intersect:animate-fade`
reveal. That was **22 identical entrance animations on the homepage** — a template tic, not intent.

All of it is gone. The single authored moment is `.spectrum-rule--draw`: the hero signature scales in
from `scaleX(0.05)` over 900ms on an exponential ease-out, `prefers-reduced-motion` opts out, and it
animates **transform, not opacity**, so nothing is ever hidden waiting on a script.

If you add motion, it replaces this moment or serves a state change. It does not accumulate.

### Data & figures

Stat figures use `--nrp-font-display` at `font-variant-numeric: tabular-nums`. Identifiers, commands,
and anything a user might copy use `--nrp-font-mono`. That includes the model names on `/llms`
(`qwen3`, `gpt-oss`, `minimax-m2`) — they are the literal strings a user pastes into a client config,
not prose.

### The endpoint readout

[`ai/EndpointPanel.astro`](src/components/ai/EndpointPanel.astro) on `/llmtoken`: one `bg-sunken`
figure, a mono figcaption, and a `<dl>` of base URL / auth header / verify command. It carries the same
code-plate chrome as the homepage capability panels, because it holds the same kind of thing — literal
strings a user pastes into a client config.

Three decisions in it generalise:

- **A readout, not a row of cards.** The three facts are one sequence, and splitting them into
  equal-weight panels would have made a set out of it. `<dt>` labels here are labels for data, not
  kickers above headings.
- **Its copy control uses `border-current`, never `border-hairline`.** The hairline measures ~1.4:1 on
  this plate and a control's boundary needs 3:1 (§2) — the same reason the office-hours join button
  does it. Inheriting `text-muted` puts the border wherever the label already passes, in both modes,
  without making the chip teal and louder than the value beside it.
- **Server-rendered above the `client:only` island.** The endpoint is a fact a visitor needs whether or
  not they are logged in, and anything placed below the island arrives after hydration and shifts.

The host itself is data, in [`src/data/llm-endpoint.ts`](src/data/llm-endpoint.ts) — shared with the
Chatbox config the same page generates.

### The office-hours strip

[`common/OfficeHoursBar.astro`](src/components/common/OfficeHoursBar.astro), rendered by
`PageLayout` **above** the header, so the next bi-weekly session is legible on every page before any
scroll. It replaced a rotating carousel item below the hero, which showed for seven seconds out of
twenty-one and only after a scroll.

Three things about it are deliberate and should survive future edits:

- **It is the one teal-tinted band on the site** — `bg-teal-100` / `dark:bg-teal-950` — and the one
  full-width band that is not a step on the surface ladder. It has to read as a distinct band against
  a white page _and_ against the near-black homepage hero directly beneath it. Any surface step would
  vanish into one of the two. This is a component-scoped exception, not a new ladder rung: nothing else
  gets a tinted band.
- **The dot pulses only while a session is running.** A dot pulsing at "in 13 days" is decoration, and
  on the homepage it would be the second pulsing dot after the live-feed indicator. The pulse, the
  filled countdown badge, and the filled join button are all keyed to `data-live="true"` — one state
  change, three signals, `prefers-reduced-motion` opts out of the pulse.
- **The join control uses `border-current`, not `border-hairline`.** On this tint a hairline measures
  well under 3:1, and a hairline is never a control's sole boundary (§5).

Schedule, timezone, duration, Zoom link, and the `.ics` path live in
[`src/data/office-hours.ts`](src/data/office-hours.ts) and nowhere else. The same functions run at
build time and in the browser: the strip is correct without JavaScript, and the client pass corrects a
stale build and steps the countdown. Dates step in **calendar days** with the local wall clock
re-resolved per candidate — adding a fixed `14 × 24h` to a UTC instant, which is what the previous
widget did, displayed "9:00 AM PT" for the whole winter.

**The schedule's zone and the display zone are two different things.** Sessions are defined as 10:00
Pacific, so `OFFICE_HOURS.timeZone` decides when they occur and must not be touched. What the strip
_shows_ is the reader's own zone — `Tue, Sep 1 · 12:00 PM CDT` in Chicago — because a reader should
not have to do timezone arithmetic to use the thing. A static build cannot know that zone, so the
server render falls back to Pacific and the client pass restates it; the Pacific time stays reachable
in the `title`. Every formatter takes the display zone as an argument, and the countdown counts day
boundaries in it too, so "tomorrow" means the reader's tomorrow. The zone abbreviation is always
rendered, so no reading is ambiguous.

### `.logo-plate`

The **one sanctioned exception** to hard rule 1. Third-party vendor logos ship as dark artwork on
transparency, so they need a light plate in _both_ modes — a surface token would put them on `#17242f`
in dark mode and make half of them vanish. `.logo-plate` is `bg-white` + hairline + `rounded-md`, and
it exists as a single class so the exception lives in one place instead of being re-invented per page.
Use it only for logos you do not control. Everything else uses the surface ladder.

### Hero layout

`Hero.astro` has four shapes. Getting this wrong is what made the subpage tops look unbalanced:

| Shape            | Set                  | Measures                                          |
| ---------------- | -------------------- | ------------------------------------------------- |
| Centered         | (default)            | one `max-w-3xl` column, `text-balance`            |
| Left, with art   | `align="left" split` | two columns from `lg`, `1fr / 0.85fr`             |
| Left, with aside | `align="left" aside` | h1 full measure; below it `1fr / 18rem` from `lg` |
| Left, no art     | `align="left"`       | h1 `max-w-4xl`, lead `max-w-2xl`, ragged right    |

Three rules behind that table:

- **A left-aligned hero with stacked art is always wrong.** The copy caps at ~768px inside an 1152px
  container and the art sits below it, so the right third is empty and the hero runs past a viewport
  (`/distributed-infrastructure` measured **1104px**; `split` brought it to **572px**). If a
  left-aligned hero has art, it takes `split`.
- **`text-balance` only on centered and split heroes.** On a wide left-aligned headline it evens the
  line lengths _against_ the wider measure — it broke a 38-character h1 into two 570px lines and left
  the right third of an 896px measure empty, which is the exact imbalance the wide measure was there to
  fix. Ragged-right filling to the measure is correct there.
- **`aside` splits _below_ the h1; `split` splits the whole row.** That is the only difference and it
  is the whole reason `aside` exists. Reusing `split` for the homepage's AI-Hubs callout would have
  narrowed the h1's track from 896px to ~776px, wrapped a 53-character headline onto a third line, and
  added ~66px to a hero budgeted at 640px. Starting the second column beneath the headline costs
  nothing, because a callout is shorter than the lead, actions and stats it sits beside. Use `aside`
  for a small notice or cross-link, `split` for real art. Below `lg` the aside stacks _after_ the
  stats: it is a secondary offer, and on a phone the reader should reach the primary action first.
  The slot is unstyled on purpose — `Hero` owns the layout, the page owns the callout's skin, because
  a light-hero aside and the homepage's dark-hero aside need different treatments (§2).

---

## 7. Imagery

- **Always** Astro's `<Image>` from `~/components/common/Image.astro`, **always** with `widths` and
  `sizes`. Never a raw `<img src="/foo.png">` pointing into `static/`.
- Two regressions this rule prevents, both measured on the live site: the hero globe shipped as a
  **single 1005 KB WebP** to phones because `widths`/`sizes` were commented out, and the NSF logo
  shipped **184 KB at 480×481** to be displayed at 80×80. Together, 85% of a 1391 KB homepage.
- Budget: **under 450 KB total transfer** at mobile viewport width.
- Decorative images get `alt=""`; meaningful ones get real alt text. Never `alt="Hero Image"`.
- **Never key CSS to alt text.** `/llms` carried a global
  `img[alt="Open WebUI chat running on the NRP"] { … }` rule, so the page layout depended on an
  accessibility string staying byte-identical. Style with a class.

### Pick the right `layout`

`layout` is not cosmetic — it decides both the srcset and the inline styles, and the default is wrong
for both of our common cases. From `src/utils/images-optimization.ts`:

| `layout`             | srcset from `widths`    | inline style it writes                                   | Use for                  |
| -------------------- | ----------------------- | -------------------------------------------------------- | ------------------------ |
| `constrained` (dflt) | **appends `width × 2`** | `max-width`, `max-height`, `aspect-ratio`                | nothing here — see below |
| `cover`              | verbatim                | `max-width:100%; max-height:100%` only                   | fill-the-box backgrounds |
| `responsive`         | verbatim                | `width:100%; height:auto; aspect-ratio`                  | in-flow content images   |
| `fullWidth`          | verbatim                | `width:100%`, `aspect-ratio`, **`height:<intrinsic>px`** | avoid                    |

Both defaults have bitten this repo:

- **`constrained` doubles your ceiling.** A `widths={[…, 2040]}` entry became a 2048w candidate, which
  is how `/education` shipped **246 KB** of decorative classroom photo and the homepage globe emitted a
  3840w upscale from a 1920 source.
- **`fullWidth` writes the source's intrinsic height as an inline style.** Inline beats a Tailwind
  `h-full`/`h-auto` class, so a 1280px-tall source rendered 1280px tall inside a 641px hero box: the
  visible crop was the top of the globe rather than the middle, and an in-flow image blew its layout
  outright. Use `cover` for backgrounds and `responsive` for content images instead.

---

## 8. Hard rules

1. **No raw palette colors in components.** No `slate-900`, `blue-600`, `gray-800`, no bare hex. Use a
   token. This is rule one because violating it is what produced the four-near-blacks problem — and
   `/llms` later added a fifth: `bg-gray-800` (`#1f2937`) is a _warm_ near-black that reads visibly off
   against the ladder's cool `#17242f` when the two sit in adjacent sections. The only exception is
   `.logo-plate` (§6).
2. **Verify contrast, don't estimate.** Body text ≥4.5:1, large text and non-text indicators ≥3:1, in
   **both** modes. Run §9.
3. **Exactly one `<h1>` per page.**
4. **Images via `<Image>` with `widths` + `sizes`.**
5. **`WidgetWrapper` owns container width and vertical rhythm.** Never per-section.
6. **Use the type scale classes**, not ad-hoc `text-*` sizes.
7. **`--aw-*` tokens are legacy aliases** kept only so unmigrated widgets keep working. Never author
   new code against them; delete each alias as its last consumer migrates.
8. **Dark mode is not an afterthought.** Every `dark:` pairing gets checked. A color with no `dark:`
   variant is a bug.
9. **Update this file** in the same change that adds a token or a component. A stale `DESIGN.md` is
   worse than none — it misleads with confidence.

---

## 9. Verification

**Tokens in this doc match the implementation.** Expect no output:

```bash
diff <(grep -oE '\-\-nrp-[a-z0-9-]+' DESIGN.md | sort -u) \
     <(grep -oE '\-\-nrp-[a-z0-9-]+' src/components/CustomStyles.astro | sort -u)
```

**No hardcoded palette colors in migrated files.** Expect no matches:

```bash
grep -rnE 'slate-(800|900)|gray-800|text-blue-[67]00|bg-blue-50' src/pages/index.astro src/components/widgets/
```

**Contrast, in the browser, both modes.** Paste into the console on any page; expect `[]`:

```js
(() => {
  const lum = (c) => {
    const [r, g, b] = c
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const bgOf = (el) => {
    let e = el;
    while (e) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
      e = e.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const bad = [];
  document.querySelectorAll('main a, main p, main span, main h1, main h2, main h3, main li').forEach((el) => {
    if (!el.innerText?.trim() || (el.children.length && el.tagName !== 'A')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const L1 = lum(cs.color),
      L2 = lum(bgOf(el));
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const fs = parseFloat(cs.fontSize);
    const min = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700) ? 3 : 4.5;
    if (ratio < min) bad.push({ text: el.innerText.trim().slice(0, 40), ratio: +ratio.toFixed(2), min });
  });
  return bad;
})();
```

**One `<h1>` per page:** `document.querySelectorAll('h1').length` → `1`.

**Docs heading hierarchy** (runs in `npm run check` and in the GitLab pipeline before `build`):

```bash
npm run check:docs-headings
```

Starlight renders the frontmatter `title` as each page's only `<h1>`, so body content starts at `##` and
steps down one level at a time. The guard (`scripts/check-docs-headings.mjs`) fails the build on a body
`# ` heading, a first heading below `##`, any skipped level, and the scaffold's `title: Title` /
`description: Description` placeholders. It reads column-0 headings only — indented headings inside list
items and MDX components are owned by their surrounding block.

**Page weight** (mobile viewport, expect `totalKB` < 450):

```js
const r = performance.getEntriesByType('resource');
({
  totalKB: Math.round(r.reduce((a, x) => a + (x.transferSize || 0), 0) / 1024),
  imgKB: Math.round(r.filter((x) => x.initiatorType === 'img').reduce((a, x) => a + (x.transferSize || 0), 0) / 1024),
});
```

**Automated a11y** (`pa11y-ci` is a devDependency and runs in CI):

```bash
npx pa11y-ci http://localhost:4321/ http://localhost:4321/llms http://localhost:4321/education
```

---

## 10. Migration status

The `--aw-*` aliases exist so this can proceed incrementally. Update this table as you go.

**On tokens** — verified by the grep in §9, which passes with zero matches:

`CustomStyles.astro` · `tailwind.config.js` · `assets/styles/tailwind.css` · `utils/cn.ts` ·
`ui/WidgetWrapper.astro` · `ui/Headline.astro` · `ui/ItemGrid.astro` · `ui/Button.astro` ·
`widgets/Hero.astro` · `widgets/HeroWide.astro` · `widgets/Features.astro` ·
`widgets/Features2.astro` · `widgets/FAQs.astro` · `widgets/CallToAction.astro` ·
`widgets/BlogLatestPosts.astro` · `widgets/Header.astro` · `widgets/Footer.astro` ·
`widgets/Brands.astro` · `widgets/Steps.astro` · `widgets/Content.astro` ·
`common/AnnouncementBar.astro` · `widgets/People.astro` · `blog/GridItem.astro` ·
`ai/EndpointPanel.astro` · `pages/index.astro` · `pages/llmtoken.astro` · `pages/education.astro` · `pages/llms.astro` ·
`pages/distributed-infrastructure.astro` · `pages/about.astro` · `pages/contact.astro`

**Deleted** — ten widgets reachable only from the five removed AstroWind demo pages:
`Features3`, `Contact`, `Stats`, `Pricing`, `Announcement`, `Testimonials`, `Steps2`, `Hero2`,
`HeroText`, `Science`. (`Stats` was folded into `Hero`'s `stats` prop; `Announcement` was superseded
by `common/AnnouncementBar.astro`.)

**Still legacy**:

| Component                                        | Notes                                                |
| ------------------------------------------------ | ---------------------------------------------------- |
| `widgets/MatrixFeed.astro`, `MatrixList.astro`   | live chat feed                                       |
| `widgets/BlogHighlightedPosts.astro`             | unused by any page; delete or migrate                |
| `blog/*` (except `GridItem`)                     | list, pagination, single-post, tags                  |
| `vue/*` (12 PrimeVue islands)                    | themed by PrimeVue; needs a matching PrimeVue preset |
| `ai/ModelCard.astro`, `ModelFeatureMatrix.astro` | the `/llms` catalogue                                |
| `plots/*` (D3 / Observable Plot)                 | chart palette should derive from the teal ramp       |
| `layouts/MarkdownLayout.astro`                   | see below — two pages left                           |
| `pages/training.astro`                           | hand-rolled sections, raw `blue-*`/`slate-*`         |

`MarkdownLayout.astro` is the one still worth calling out, because everything it renders inherits the
problems rather than declaring them: a `max-w-4xl` container on a `max-w-6xl` site, an `<h1>` at
`text-4xl md:text-5xl` instead of `text-h1`, `prose-a:text-blue-600 dark:prose-a:text-blue-400`
instead of `.link`, and `dark:prose-headings:text-slate-300`. `/contact` was its largest consumer and
is now an `.astro` page; `get-access.md` and `7nrp-travel-support.md` are what remain.

---

## 11. Out of scope: the Starlight docs

`/documentation` is a separate Starlight app and is **deliberately not covered** by this system. It
currently uses the system-ui font stack rather than the brand faces, a background of `#17181c` rather
than `#0a1118`, a different accent blue (`hsl(224 100% 60%)`), a 42px `<h1>` against the marketing
site's 60px, and a header reading "NRP Nautilus" as text rather than the logo — with no navigation
back to the main site, so a visitor arriving from a search engine is stranded.

Unifying it means feeding these tokens into Starlight's `--sl-color-*` variables and overriding its
`Header`/`SiteTitle` components. Worth doing; it is simply not part of this pass.

**One deliberate exception to the teal-ramp rule lives here.** The benchmark chart on
`/documentation/userdocs/ai/llm-managed/models` colours each bar by the model's creator, from a
seven-hue palette in [`src/data/model-creators.ts`](src/data/model-creators.ts). That is not a
missed migration and it should not be collapsed onto the ramp: the colour encodes a category, and a
single-hue ramp cannot say "these two bars are both Alibaba's" — which is the one thing the chart
needs colour for. The palette is built the way §2's is, not by eye: each hue comes from the
creator's own brand colour, then luminance is pinned into the window where a white label clears
4.5:1 and the bar clears 3:1 against the docs' dark canvas, in one palette serving both themes. The
measured ratios are in that file's header. Colour is never the only code there — every bar also
carries its creator's mark, its printed score, and its rank.

---

## 12. Naming

Not a visual rule, but a clarity one, and it belongs somewhere enforceable.

- **NRP** — the platform. The public-facing name. Use it in all marketing copy, headings, and nav.
- **Nautilus** — the Kubernetes cluster the NRP runs on. A technical term; use it in docs and
  cluster-facing UI.

The live site mixed "National Research Platform (NRP)", "NRP Nautilus", "NRP + Nautilus", "Nautilus
Cluster", and "Nautilus Support" as though each were a distinct proper noun. Pick the register and
stay in it. The relationship is stated explicitly in two places: a two-card section on `/about`
("NRP is the platform" / "Nautilus is the cluster") and the homepage FAQs.
