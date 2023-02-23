import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Consent } from './consent';

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  constructor(private http: HttpClient) {}

  search(text: string, pageable: Pageable): Observable<Page<Consent>> {
    const params = new HttpParams()
      .set('number', text)
      .set('page', String(pageable.page))
      .set('size', String(pageable.perPage));
    return this.http
      .get<Consent[]>(`/dnc/api/v2/private/consents`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<any>();
          page.content = resp.body?.map(flow => new Consent(flow));
          page.totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return page;
        })
      );
  }

  update(req: Partial<Consent>): Observable<any> {
    return this.http.put(`/dnc/api/v2/private/consents/${req.number}`, req);
  }

  add(req: Partial<Consent>): Observable<any> {
    return this.http.put(`/dnc/api/v2/private/consents/${req.number}`, req);
  }

  delete(number: string): Observable<any> {
    return this.http.delete(`/dnc/api/v2/private/consents/${number}`);
  }

  export(email: string): Observable<any> {
    return this.http.get(`/dnc/api/v2/private/consents/_export`, { params: { number: '', email: email } });
  }

  import(csvKey: string): Observable<any> {
    return this.http.put(`/dnc/api/v2/private/consents/_bulk`, {
      csvKey: csvKey
    });
  }

  getAllOrgLink() {
    return this.http.get(`/dnc/api/v2/private/consents/org-links`);
  }

  getMasterOrg(orgUuid: string) {
    return this.http.get(`/dnc/api/v2/private/consents/org-links/${orgUuid}`);
  }

  updateOrgLink(orgUuid: string, orgUuids: string[]) {
    return this.http.put(`/dnc/api/v2/private/consents/org-links`, {
      masterOrg: orgUuid,
      slaveOrgs: orgUuids
    });
  }

  deleteOrgLink(orgUuid: string) {
    return this.http.delete(`/dnc/api/v2/private/consents/org-links/${orgUuid}`);
  }
}
