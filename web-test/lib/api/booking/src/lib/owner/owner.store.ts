import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Owner } from './owner.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'booking_owner' })
export class OwnerStore extends Store<Owner> {
  constructor() {
    super(new Owner());
  }
}
