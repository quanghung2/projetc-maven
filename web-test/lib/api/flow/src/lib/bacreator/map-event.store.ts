import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { MappedEvent } from './bacreator.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_mapEvent', resettable: true })
export class MapEventStore extends Store<MappedEvent> {
  constructor() {
    super({});
  }
}
