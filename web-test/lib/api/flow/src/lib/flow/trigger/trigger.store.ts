import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Trigger } from './trigger.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_trigger', resettable: true })
export class TriggerStore extends Store<Trigger> {
  constructor() {
    super({});
  }
}
