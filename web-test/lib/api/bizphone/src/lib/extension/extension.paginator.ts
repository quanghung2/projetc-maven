import { inject, InjectionToken } from '@angular/core';
import { PaginatorPlugin } from '@datorama/akita';
import { ExtensionQuery } from './extension.query';

export const EXTENSION_PAGINATOR_NAME = 'EXTENSION_PAGINATOR';

export const EXTENSION_PAGINATOR = new InjectionToken(EXTENSION_PAGINATOR_NAME, {
  providedIn: 'root',
  factory: () => {
    const query = inject(ExtensionQuery);
    return new PaginatorPlugin(query, { startWith: 0 }).withControls().withRange();
  }
});
