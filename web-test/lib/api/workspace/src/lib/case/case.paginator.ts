import { inject, InjectionToken } from '@angular/core';
import { PaginatorPlugin } from '@datorama/akita';
import { CaseQuery } from './case.query';

export const CASE_PAGINATOR = new InjectionToken('CASE_PAGINATOR', {
  providedIn: 'root',
  factory: () => {
    const query = inject(CaseQuery);
    return new PaginatorPlugin(query).withControls().withRange();
  }
});
