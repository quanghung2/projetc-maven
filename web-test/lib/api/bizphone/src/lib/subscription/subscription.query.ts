import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SubscriptionState, SubscriptionStore } from './subscription.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionQuery extends Query<SubscriptionState> {
  subscription$ = this.select('subscription');
  licenseView$ = this.select('licenseView');

  constructor(protected override store: SubscriptionStore) {
    super(store);
  }
}
