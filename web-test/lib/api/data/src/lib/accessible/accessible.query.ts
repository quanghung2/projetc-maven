import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AccessibleState, AccessibleStore } from './accessible.store';

@Injectable({ providedIn: 'root' })
export class AccessibleQuery extends QueryEntity<AccessibleState> {
  accessibles$ = this.selectAll();

  constructor(protected override store: AccessibleStore) {
    super(store);
  }
}
