import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Subscription } from './subscription.model';

export interface SubscriptionState extends EntityState<Subscription>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'subscription_subscription', idKey: 'uuid' })
export class SubscriptionStore extends EntityStore<SubscriptionState, Subscription> {
  constructor() {
    super();
  }
}
