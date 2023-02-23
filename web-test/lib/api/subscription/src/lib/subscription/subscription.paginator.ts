import { inject, InjectionToken } from '@angular/core';
import { PaginatorPlugin } from '@datorama/akita';
import { SubscriptionQuery } from './subscription.query';

export const SUBSCRIPTION_PAGINATOR = new InjectionToken('SUBSCRIPTION_PAGINATOR', {
  providedIn: 'root',
  factory: () => {
    const subscriptionQuery = inject(SubscriptionQuery);
    return new PaginatorPlugin(subscriptionQuery).withControls().withRange();
  }
});
