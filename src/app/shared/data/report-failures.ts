import { effect, inject, type Resource, untracked } from '@angular/core';

import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

/**
 * Shows a Snackbar every time the resource fails (the section itself shows an error banner).
 * `isReported` can skip failures that the section treats as a normal state (e.g. an unknown
 * category in a link shows "not found"). Must be called in an injection context, e.g. a field
 * initializer of a component.
 */
export function reportFailures(
  resource: Resource<unknown>,
  message: string,
  isReported: (error: unknown) => boolean = (): boolean => true,
): void {
  const snackbar: Snackbar = inject(Snackbar);

  effect(() => {
    if (resource.status() !== 'error') {
      return;
    }

    const error: unknown = resource.error();

    untracked(() => {
      if (isReported(error)) {
        snackbar.show({ message, variant: 'error' });
      }
    });
  });
}
