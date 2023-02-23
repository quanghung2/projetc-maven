import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Trigger } from './trigger.model';
import { TriggerStore } from './trigger.store';

@Injectable({ providedIn: 'root' })
export class TriggerQuery extends Query<Trigger> {
  constructor(protected override store: TriggerStore) {
    super(store);
  }
}
