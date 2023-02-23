import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { CaseState, CaseStore } from './case.store';

@Injectable({ providedIn: 'root' })
export class CaseQuery extends QueryEntity<CaseState> {
  allCases$ = this.selectAll();

  constructor(store: CaseStore) {
    super(store);
  }
}
