import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Subscription } from './subscription.model';
import { SubscriptionState, SubscriptionStore } from './subscription.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionQuery extends QueryEntity<SubscriptionState, Subscription> {
  constructor(protected override store: SubscriptionStore) {
    super(store);
  }
}
