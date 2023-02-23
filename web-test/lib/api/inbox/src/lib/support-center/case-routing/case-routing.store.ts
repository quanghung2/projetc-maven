import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { CaseRouting } from './case-routing.model';

export interface CaseRoutingState extends EntityState<CaseRouting> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'inbox-supportcenter-routing', idKey: 'id' })
export class CaseRoutingStore extends EntityStore<CaseRoutingState> {
  constructor() {
    super();
  }
}
