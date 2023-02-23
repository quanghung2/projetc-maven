import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { CaseRoutingState, CaseRoutingStore } from './case-routing.store';

@Injectable({ providedIn: 'root' })
export class CaseRoutingQuery extends QueryEntity<CaseRoutingState> {
  all$ = this.selectAll();

  constructor(protected override store: CaseRoutingStore) {
    super(store);
  }
}
