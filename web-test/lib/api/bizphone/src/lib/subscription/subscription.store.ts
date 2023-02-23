import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { LicenseDisplayModel } from './model/license-view.model';
import { SubscriptionBiz } from './model/subscription.model';

export class SubscriptionState {
  subscription: SubscriptionBiz;
  licenseView: LicenseDisplayModel;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'bizphone_subscription' })
export class SubscriptionStore extends Store<SubscriptionState> {
  constructor() {
    super({});
  }
}
