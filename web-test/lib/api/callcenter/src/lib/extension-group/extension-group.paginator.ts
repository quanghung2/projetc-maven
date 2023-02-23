import { inject, InjectionToken } from '@angular/core';
import { PaginatorPlugin } from '@datorama/akita';
import { ExtensionGroupQuery } from './extension-group.query';

export const EXTENSIONGROUP_PAGINATOR = new InjectionToken('EXTENSIONGROUP_PAGINATOR', {
  providedIn: 'root',
  factory: () => {
    const query = inject(ExtensionGroupQuery);
    return new PaginatorPlugin(query, { startWith: 0 }).withControls().withRange();
  }
});
