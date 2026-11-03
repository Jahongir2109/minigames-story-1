import { effect, inject, type Resource, untracked } from '@angular/core';

import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

/**
 * Shows a Snackbar every time the resource fails (the section itself shows an error banner).
 * Must be called in an injection context, e.g. a field initializer of a component.
 */
export function reportFailures(resource: Resource<unknown>, message: string): void {
  const snackbar: Snackbar = inject(Snackbar);

  effect(() => {
    if (resource.status() !== 'error') {
      return;
    }

    untracked(() => {
      snackbar.show({ message, variant: 'error' });
    });
  });
}
