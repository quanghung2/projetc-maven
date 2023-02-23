import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { MappedEvent } from './bacreator.model';
import { MapEventStore } from './map-event.store';

@Injectable({ providedIn: 'root' })
export class MapEventQuery extends Query<MappedEvent> {
  constructor(protected override store: MapEventStore) {
    super(store);
  }
}
