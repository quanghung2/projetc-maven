import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TriggerDefState, TriggerDefStore } from './trigger-def.store';

@Injectable({ providedIn: 'root' })
export class TriggerDefQuery extends QueryEntity<TriggerDefState> {
  constructor(protected override store: TriggerDefStore) {
    super(store);
  }
}
