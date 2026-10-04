import type { App } from 'vue';
import PrimeVue from 'primevue/config';

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';

// PrimeVue on the NRP tokens (DESIGN.md §2). Every value is a --nrp-* variable,
// and those flip under html.dark themselves, so the light and dark schemes can
// map Aura's roles onto the same variables. Aura reads its surface scale in
// opposite directions per scheme (light: 0 is the page; dark: 900 is the page),
// which is why the two scales below are mirrored.
const teal = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [step, `var(--nrp-teal-${step})`])
);

// Aura's red-500 danger button measures ~3.8:1 with white text, under AA. Point
// every PrimeVue danger button at the --nrp-danger token instead.
const danger = (text: string, shade: string) => ({
  background: 'var(--nrp-danger)',
  hoverBackground: `color-mix(in srgb, var(--nrp-danger) 88%, ${shade})`,
  activeBackground: `color-mix(in srgb, var(--nrp-danger) 78%, ${shade})`,
  borderColor: 'var(--nrp-danger)',
  hoverBorderColor: `color-mix(in srgb, var(--nrp-danger) 88%, ${shade})`,
  activeBorderColor: `color-mix(in srgb, var(--nrp-danger) 78%, ${shade})`,
  color: text,
  hoverColor: text,
  activeColor: text,
  focusRing: { color: 'var(--nrp-ring)', shadow: 'none' },
});
const NrpPreset = definePreset(Aura, {
  components: {
    button: {
      colorScheme: {
        light: { root: { danger: danger('#ffffff', 'black') } },
        dark: { root: { danger: danger('var(--nrp-surface-page)', 'white') } },
      },
    },
  },
  primitive: {
    // Cards and panels are rounded-lg (8px), not Aura's 12px. Buttons and
    // inputs already use md (6px).
    borderRadius: { xl: '8px' },
  },
  semantic: {
    primary: teal,
    colorScheme: {
      light: {
        surface: {
          0: 'var(--nrp-surface-page)',
          50: 'var(--nrp-surface-1)',
          100: 'var(--nrp-surface-2)',
          200: 'var(--nrp-border-hairline)',
          300: 'var(--nrp-surface-4)',
          400: 'var(--nrp-text-muted)',
          500: 'var(--nrp-text-muted)',
          600: 'var(--nrp-text-body)',
          700: 'var(--nrp-text-body)',
          800: 'var(--nrp-text-heading)',
          900: 'var(--nrp-text-heading)',
          950: 'var(--nrp-text-heading)',
        },
        primary: {
          color: 'var(--nrp-teal-700)',
          contrastColor: '#ffffff',
          hoverColor: 'var(--nrp-teal-800)',
          activeColor: 'var(--nrp-teal-900)',
        },
        highlight: {
          background: 'var(--nrp-teal-50)',
          focusBackground: 'var(--nrp-teal-100)',
          color: 'var(--nrp-teal-800)',
          focusColor: 'var(--nrp-teal-900)',
        },
        // A control's boundary needs 3:1 (DESIGN.md §2), which the hairline is not.
        formField: {
          borderColor: 'var(--nrp-text-muted)',
          hoverBorderColor: 'var(--nrp-text-body)',
          focusBorderColor: 'var(--nrp-ring)',
        },
      },
      dark: {
        surface: {
          0: 'var(--nrp-text-heading)',
          50: 'var(--nrp-text-heading)',
          100: 'var(--nrp-text-body)',
          200: 'var(--nrp-text-body)',
          300: 'var(--nrp-text-muted)',
          400: 'var(--nrp-text-muted)',
          500: 'var(--nrp-text-muted)',
          600: 'var(--nrp-surface-4)',
          700: 'var(--nrp-border-hairline)',
          800: 'var(--nrp-surface-2)',
          900: 'var(--nrp-surface-page)',
          950: 'var(--nrp-surface-sunken)',
        },
        primary: {
          color: 'var(--nrp-teal-400)',
          contrastColor: 'var(--nrp-teal-950)',
          hoverColor: 'var(--nrp-teal-300)',
          activeColor: 'var(--nrp-teal-200)',
        },
        formField: {
          background: 'var(--nrp-surface-page)',
          borderColor: 'var(--nrp-text-muted)',
          hoverBorderColor: 'var(--nrp-text-body)',
          focusBorderColor: 'var(--nrp-ring)',
        },
      },
    },
  },
});

export default (app: App) => {
  app.use(PrimeVue, {
    theme: {
      preset: NrpPreset,
      options: {
        darkModeSelector: '.dark',
      },
    },
  });
  app.use(ToastService);
  app.use(ConfirmationService);
};
