import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { PaginationResponse } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ExportSubscriptionReq,
  FindSubscriptionReq,
  RecoveryResponseV2,
  Subscription,
  SubsctiptionRequestParams
} from './subscription.model';
import { SubscriptionStore } from './subscription.store';
import { SubscriptionLicense } from '@b3networks/api/license';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  constructor(private http: HttpClient, private subscriptionStore: SubscriptionStore) {}

  /**
   * @param req
   * @param pageable start from 1
   */

  findSubscriptions(
    req: FindSubscriptionReq,
    pageable?: Pageable,
    addon?: { usingPaginationPlugin: boolean }
  ): Observable<PaginationResponse<Subscription>> {
    req = Object.assign(new FindSubscriptionReq(), req) || new FindSubscriptionReq();
    let params = req.toParams();
    if (!pageable) {
      pageable = { perPage: 100, page: 1 };
    }
    params = params.set('page', String(pageable.page)).set('perPage', String(pageable.perPage));

    return this.http
      .get<Subscription[]>(`subscription/private/v4/subscriptions`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return <PaginationResponse<Subscription>>{
            currentPage: pageable.page,
            perPage: pageable.perPage,
            lastPage: Math.ceil(totalCount / pageable.perPage),
            data: resp.body.map(sub => new Subscription(sub)),
            total: totalCount
          };
        }),
        tap(page => {
          if (!addon || !addon.usingPaginationPlugin) {
            this.subscriptionStore.set(page.data);
          }
        })
      );
  }

  getOne(subscriptionUuid: string): Observable<Subscription> {
    return this.http
      .get<Subscription>(`subscription/private/v4/subscriptions/${subscriptionUuid}`)
      .pipe(map(sub => new Subscription(sub)));
  }

  updateSubscriptionInfo(subscriptionUuid: string, params: SubsctiptionRequestParams): Observable<void> {
    return this.http.put<void>(`/subscription/private/v3/subscriptions/${subscriptionUuid}/update`, params);
  }

  assignMembers(subscription: Subscription, assignees: string[]): Observable<string[]> {
    return this.http.post<string[]>(`/subscription/private/v3/subscriptions/${subscription.uuid}/assignees`, {
      assignees: assignees
    });
  }

  removeMember(subscriptionUuid: string, memberUuid: string): Observable<void> {
    return this.http.delete<void>(`/subscription/private/v3/subscriptions/${subscriptionUuid}/assignees/${memberUuid}`);
  }

  getRecoveryV2(recoveryUuid: string): Observable<RecoveryResponseV2[]> {
    return this.http.get<RecoveryResponseV2[]>(`/subscription/private/v4/subscriptions/recover/${recoveryUuid}`);
  }

  subscriptionRecoverV2(subscriptionIds: string[], recoveryUuid: string, ignoredSubscriptionUuids: string[]) {
    return this.http.post(`/subscription/private/v4/subscriptions/recover/${recoveryUuid}`, {
      subscriptionUuids: subscriptionIds,
      ignoredSubscriptionUuids: ignoredSubscriptionUuids
    });
  }

  exportSubscription(domain: string, request: ExportSubscriptionReq): Observable<void> {
    const requestParam = new HttpParams()
      .append('emails', request?.emails?.join(','))
      .append('domain', domain)
      .append('statuses', request?.statuses)
      .append('productIds', request?.productIds?.join(','));
    return this.http.get<void>(`/subscription/private/v3/subscriptions/export`, {
      params: requestParam
    });
  }

  setActive(id: string) {
    this.subscriptionStore.setActive(id);
  }

  updateActive(subscription: Subscription) {
    this.subscriptionStore.updateActive(subscription);
  }

  updateAutoRenewActive(autoRenew: boolean) {
    this.subscriptionStore.updateActive({ autoRenew: autoRenew });
  }

  buySubscribe(body: SubscriptionLicense) {
    return this.http.post<SubscriptionLicense>(`subscription/private/v1/licenses`, body);
  }
}
