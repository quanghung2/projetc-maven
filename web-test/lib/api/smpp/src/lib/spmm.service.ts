import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Smpp } from './smpp.model';

@Injectable({
  providedIn: 'root'
})
export class SmppService {
  constructor(private http: HttpClient) {}

  createSMPPAccounts(subscriptionUuid: string): Observable<Smpp> {
    return this.http.post<Smpp>(`/license/private/v1/smppAccounts`, { developerLicense: subscriptionUuid }).pipe(
      map(res => new Smpp(res)),
      catchError(_ => of(null))
    );
  }

  createSMPPTestAccounts(subscriptionUuid: string): Observable<Smpp> {
    return this.http.post<Smpp>(`/license/private/v1/smppTestAccounts`, { developerLicense: subscriptionUuid }).pipe(
      map(res => new Smpp(res)),
      catchError(_ => of(null))
    );
  }
}
