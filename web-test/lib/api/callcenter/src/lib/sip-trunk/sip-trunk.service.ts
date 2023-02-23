import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_PAGINATION } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  AuthenticationMode,
  DetailSipAccount,
  ReqUpdateIpPeer,
  RoutingConfigSip,
  SipAccount,
  TypeSipAccount
} from './sip-trunk.model';
import { SipTrunkStore } from './sip-trunk.store';

@Injectable({ providedIn: 'root' })
export class SipTrunkService {
  constructor(private store: SipTrunkStore, private http: HttpClient) {}

  getAccounts(type: TypeSipAccount) {
    const params = new HttpParams().append('type', type);
    return this.http.get<SipAccount[]>('callcenter/private/v1/sipTrunk', { params: params }).pipe(
      map(entities => entities.map(i => new SipAccount(i))),
      tap(entities => this.store.upsertMany(entities, { baseClass: SipAccount }))
    );
  }

  updateAccountSipTrunk(sipUsername: string, req: Partial<SipAccount>) {
    return this.http.put<SipAccount>(`callcenter/private/v1/sipTrunk/${sipUsername}`, req).pipe(
      map(account => new SipAccount(account)),
      tap(account => {
        delete account.detail;
        this.store.upsertMany([account], { baseClass: SipAccount });
      })
    );
  }

  getRoutingConfig(sipUsername: string, keyword: string, pagable: Pageable): Observable<Page<RoutingConfigSip>> {
    let params = new HttpParams();
    if (keyword) {
      params = params.append('keyword', keyword);
    }
    if (pagable) {
      params = params.append('page', pagable.page.toString()).append('perPage', pagable.perPage.toString());
    }

    return this.http
      .get<RoutingConfigSip[]>(`callcenter/private/v1/sipTrunk/${sipUsername}/routingConfig`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(response => {
          const page = new Page<RoutingConfigSip>();
          page.content = response.body;
          page.totalCount = +response.headers.get(X_PAGINATION.totalCount);
          return page;
        })
      );
  }

  createRoutingConfig(sipUsername: string, req: RoutingConfigSip) {
    return this.http.post<any>(`callcenter/private/v1/sipTrunk/${sipUsername}/routingConfig`, req);
  }

  updateRoutingConfig(sipUsername: string, req: RoutingConfigSip) {
    return this.http.put<any>(`callcenter/private/v1/sipTrunk/${sipUsername}/routingConfig/${req.number}`, req);
  }

  deleteRoutingConfig(sipUsername: string, rule: string) {
    return this.http.delete<any>(`callcenter/private/v1/sipTrunk/${sipUsername}/routingConfig/${rule}`);
  }

  getCallerIdISDN() {
    return this.http.get<string[]>('callcenter/private/v1/sipTrunk/callerIds/isdn').pipe(
      tap(entities => {
        return this.store.update({
          isdnCallerIds: entities || []
        });
      })
    );
  }

  getAvailableCallerIds() {
    return this.http.get<string[]>('callcenter/private/v1/sipTrunk/callerIds').pipe(
      tap(entities =>
        this.store.update({
          availableCallerIds: entities || []
        })
      )
    );
  }

  resetPassword(sipUsername: string, newPassword: string) {
    return this.http.put(
      `callcenter/private/v1/sipTrunk/${sipUsername}/resetPassword`,
      { newPassword: newPassword },
      { responseType: 'text' }
    );
  }

  getTLSKeyAccount(sipUsername: string) {
    return this.http.get(`appsip/accounts/${sipUsername}/tls-key`);
  }

  addIpWhiteList(sipUsername: string, list: string[]) {
    return this.http
      .put<DetailSipAccount>(`callcenter/private/v1/sipTrunk/${sipUsername}/addIpWhiteList`, {
        ips: list
      })
      .pipe(tap(detail => this.store.update(sipUsername, { detail: detail })));
  }

  removeIpWhiteList(sipUsername: string, ip: string) {
    return this.http
      .put<DetailSipAccount>(`callcenter/private/v1/sipTrunk/${sipUsername}/removeIpWhiteList`, {
        ip
      })
      .pipe(tap(detail => this.store.update(sipUsername, { detail: detail })));
  }

  updateAuthenticationMode(sipUsername: string, mode: AuthenticationMode) {
    return this.http
      .put<DetailSipAccount>(`callcenter/private/v1/sipTrunk/${sipUsername}/updateAuthenticationMode`, {
        mode: mode
      })
      .pipe(tap(detail => this.store.update(sipUsername, { detail: detail })));
  }

  updateLabel(sipUsername: string, label: string) {
    return this.http
      .put(
        `callcenter/private/v1/sipTrunk/${sipUsername}/updateLabel`,
        {
          label: label
        },
        {
          responseType: 'text'
        }
      )
      .pipe(
        tap(text => {
          this.store.update(sipUsername, entity => ({
            ...entity,
            detail: {
              ...entity.detail,
              label: text
            }
          }));
        })
      );
  }

  updateIpPeer(sipUsername: string, req: ReqUpdateIpPeer) {
    return this.http
      .put<DetailSipAccount>(`callcenter/private/v1/sipTrunk/${sipUsername}/updateIpPeer`, req)
      .pipe(tap(detail => this.store.update(sipUsername, { detail: detail })));
  }

  setActiveSip(sipUsername: string | ID) {
    this.store.setActive(sipUsername);
  }

  removeActiveSip(sipUsername: string | ID) {
    this.store.removeActive(sipUsername);
  }

  updateAccount(sipUsername: string, state: SipAccount) {
    this.store.update(sipUsername, enitty => ({
      ...enitty,
      ...state
    }));
  }
}
