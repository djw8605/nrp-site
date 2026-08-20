import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';
import typographyPlugin from '@tailwindcss/typography';
import PrimeUI from 'tailwindcss-primeui';

// Design tokens live in src/components/CustomStyles.astro; this file only
// surfaces them to Tailwind. See DESIGN.md before changing anything here.
export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // `nav` is the width at which the header's horizontal nav bar fits.
      // Measured: the seven top-level items need ~716px, and the logo (158px),
      // the utility controls (152px), two 16px grid gaps and the 48px gutters
      // take another 374px -- so the bar needs a ~1090px viewport, and 1152
      // leaves ~45px of slack. Below that the hamburger owns the nav. `lg`
      // (1024px) is NOT wide enough: the nav overlapped the wordmark and the
      // theme toggle by ~47px on each side.
      //
      // Referenced by Header.astro, the `#front-page #header` rules in
      // assets/styles/tailwind.css (via `theme('screens.nav')`) and the
      // menu-closing matchMedia in common/BasicScripts.astro. Keep them in sync.
      screens: {
        nav: '1152px',
      },

      colors: {
        // Brand ramp. Asymmetric on purpose: teal-300/400/500 are for dark
        // backgrounds, teal-700/800/900 for light. See DESIGN.md section 2.
        teal: {
          50: 'var(--nrp-teal-50)',
          100: 'var(--nrp-teal-100)',
          200: 'var(--nrp-teal-200)',
          300: 'var(--nrp-teal-300)',
          400: 'var(--nrp-teal-400)',
          500: 'var(--nrp-teal-500)',
          600: 'var(--nrp-teal-600)',
          700: 'var(--nrp-teal-700)',
          800: 'var(--nrp-teal-800)',
          900: 'var(--nrp-teal-900)',
          950: 'var(--nrp-teal-950)',
        },

        // Surface ladder. Adjacent full-width sections must not share a step.
        surface: {
          sunken: 'var(--nrp-surface-sunken)',
          page: 'var(--nrp-surface-page)',
          1: 'var(--nrp-surface-1)',
          2: 'var(--nrp-surface-2)',
          3: 'var(--nrp-surface-3)',
          4: 'var(--nrp-surface-4)',
        },

        heading: 'var(--nrp-text-heading)',
        body: 'var(--nrp-text-body)',
        link: 'var(--nrp-link)',
        ring: 'var(--nrp-ring)',
        hairline: 'var(--nrp-border-hairline)',

        // Legacy AstroWind names, still consumed by unmigrated widgets.
        primary: 'var(--aw-color-primary)',
        secondary: 'var(--aw-color-secondary)',
        accent: 'var(--aw-color-accent)',
        default: 'var(--aw-color-text-default)',
        muted: 'var(--aw-color-text-muted)',
      },

      borderColor: {
        DEFAULT: 'var(--nrp-border-hairline)',
      },

      fontFamily: {
        display: ['var(--nrp-font-display)', ...defaultTheme.fontFamily.sans],
        sans: ['var(--nrp-font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--nrp-font-mono)', ...defaultTheme.fontFamily.mono],
        // Legacy alias used by unmigrated widgets.
        heading: ['var(--aw-font-heading)', ...defaultTheme.fontFamily.sans],
      },

      // Fluid type scale. Use these, never ad-hoc text-3xl/text-xl -- the old
      // site had <h2> at both 36px and 20px and <h3> at three different sizes.
      //
      // Deliberately NO `body` or `small` keys here: `body` is already a color
      // (see `colors` above), and declaring both emits two conflicting
      // `.text-body` rules. Use Tailwind's built-in text-base / text-sm for
      // those sizes.
      fontSize: {
        h1: ['clamp(2.5rem, 5vw, 3.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.875rem, 3vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        h3: ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        h4: ['1.125rem', { lineHeight: '1.4' }],
        lead: ['1.125rem', { lineHeight: '1.6' }],
        eyebrow: ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '600' }],
      },

      ringColor: {
        DEFAULT: 'var(--nrp-ring)',
      },

      backgroundImage: {
        spectrum: 'var(--nrp-gradient-spectrum)',
      },

      animation: {
        fade: 'fadeInUp 1s both',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(2rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    typographyPlugin,
    plugin(({ addVariant }) => {
      addVariant('intersect', '&:not([no-intersect])');
    }),
    PrimeUI,
  ],
  darkMode: 'class',
};
