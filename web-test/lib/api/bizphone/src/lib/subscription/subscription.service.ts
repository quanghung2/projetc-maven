import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { LicenseDisplayModel } from './model/license-view.model';
import { SubscriptionBiz } from './model/subscription.model';
import { SubscriptionStore } from './subscription.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private subscriptionStore: SubscriptionStore, private http: HttpClient) {}

  get() {
    return this.http.get<SubscriptionBiz>('extension/private/subscription').pipe(
      map(sub => new SubscriptionBiz(sub)),
      tap((sub: SubscriptionBiz) => {
        const license = new LicenseDisplayModel(sub);
        this.subscriptionStore.update({ subscription: sub, licenseView: license });
      })
    );
  }
}
