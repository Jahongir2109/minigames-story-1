import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

// A failed bootstrap is reported like any other uncaught error (browser console, error listeners).
try {
  await bootstrapApplication(App, appConfig);
} catch (error: unknown) {
  reportError(error);
}
