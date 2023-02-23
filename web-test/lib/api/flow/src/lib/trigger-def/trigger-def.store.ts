import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { TriggerDef } from './trigger-def.model';

export interface TriggerDefState extends EntityState<TriggerDef> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_triggerDef', idKey: 'uuid' })
export class TriggerDefStore extends EntityStore<TriggerDefState> {
  constructor() {
    super();
  }
}
