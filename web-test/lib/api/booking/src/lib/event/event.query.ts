import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { EventBookingState, EventBookingStore } from './event.store';

@Injectable({ providedIn: 'root' })
export class EventBookingQuery extends QueryEntity<EventBookingState> {
  constructor(protected override store: EventBookingStore) {
    super(store);
  }
}
