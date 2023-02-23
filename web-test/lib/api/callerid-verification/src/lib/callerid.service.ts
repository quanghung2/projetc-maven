import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FindCallerIdsResp, SMSSender, UpdateGlobalBlacklistReq } from './callerid.model';

@Injectable({
  providedIn: 'root'
})
export class CallerIdService {
  constructor(private http: HttpClient) {}

  /* call-center app: store-number-list & voicemail-callback component*/
  findCallerIds(orgUuid: string): Observable<FindCallerIdsResp> {
    return this.http
      .get<FindCallerIdsResp>(`callerid/private/v1/callerid/${orgUuid}`)
      .pipe(map(res => new FindCallerIdsResp(res)));
  }

  /*call center app: call-survey-config component */
  /*ivr app: missed-call-notification & notification block component*/
  findSenders(orgUuid: string): Observable<SMSSender[]> {
    return this.http.get<SMSSender[]>(`callerid/private/v2/companies/${orgUuid}`).pipe(
      map(res =>
        res.map(r => ({
          ...r,
          sender: r.sender.map(s => (r.countryCode === '*' ? `${s} (other)` : `${s} (+${r.countryCode})`))
        }))
      )
    );
  }

  /*internal-cp app: get sms black list */
  getGlobalBlacklist(keyword: string = '', pageable: Pageable): Observable<Page<string>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', String(pageable.page))
      .set('perPage', String(pageable.perPage));
    return this.http
      .get<string[]>(`callerid/private/v1/callerId/globalBlacklist`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<string>();
          page.content = resp.body;
          page.totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return page;
        })
      );
  }

  /*internal-cp app: update/delete sms black list */
  updateGlobalBlacklist(req: UpdateGlobalBlacklistReq): Observable<string[]> {
    return this.http.put<string[]>(`callerid/private/v1/callerId/globalBlacklist`, req);
  }
}
