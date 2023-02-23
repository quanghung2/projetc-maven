import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { BookingEvent } from './event.model';

export interface EventBookingState extends EntityState<BookingEvent> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'booking_event', idKey: 'id' })
export class EventBookingStore extends EntityStore<EventBookingState> {
  constructor() {
    super();
  }
}
