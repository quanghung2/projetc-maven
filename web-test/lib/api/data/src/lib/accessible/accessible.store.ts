import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Accessible } from './accessible.model';

export interface AccessibleState extends EntityState<Accessible> {}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'datamanagement_accessible' })
export class AccessibleStore extends EntityStore<AccessibleState> {
  constructor() {
    super();
  }
}
