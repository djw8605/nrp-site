import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge, taught about our custom type scale.
 *
 * Without this, tailwind-merge cannot classify `text-h1` / `text-lead` /
 * `text-eyebrow`. It falls back to treating them as *text colours*, so a call
 * like `twMerge('text-h1', 'text-white')` silently DELETES `text-h1` and the
 * heading renders at the default 16px. That is not hypothetical -- it shipped
 * in the first cut of the new hero.
 *
 * Import this instead of `tailwind-merge` in any component that composes the
 * type scale with colour classes. See DESIGN.md section 3.
 */
export const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['h1', 'h2', 'h3', 'h4', 'lead', 'eyebrow'] }],
    },
  },
});

export default twMerge;
