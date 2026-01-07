import type { App } from 'vue';
import PrimeVue from 'primevue/config';

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';

const MyPreset = definePreset(Aura, {
    //Your customizations, see the following sections for examples
});


export default (app: App) => {
  app.use(PrimeVue, {
    theme: {
      preset: MyPreset,
      options: {
        darkModeSelector: '.dark',
      },  
    },
  });
  app.use(ToastService);
  app.use(ConfirmationService);
};
