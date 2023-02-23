import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { OrgConsent } from './org-consent.model';

@Injectable({
  providedIn: 'root'
})
export class OrgConsentService {
  constructor(private http: HttpClient) {}

  search(prefix: string) {
    const encode = encodeURIComponent(prefix);
    return this.http
      .get<{ entries: OrgConsent[] }>(`dnc/private/v1/orgConsent/${encode}`)
      .pipe(map(x => x?.entries || []));
  }

  update(number: string, req: OrgConsent) {
    const encode = encodeURIComponent(number);
    return this.http.put(`dnc/private/v1/orgConsent/${encode}`, req);
  }

  delete(number: string) {
    const encode = encodeURIComponent(number);
    return this.http.delete(`dnc/private/v1/orgConsent/${encode}`);
  }
}
