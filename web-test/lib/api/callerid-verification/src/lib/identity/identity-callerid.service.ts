import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { empty, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AddCallerIdRequest, CallerIdACK, CallerIdResp } from './identity-callerid.model';
import { IdentityCallerIdStore } from './identity-callerid.store';

@Injectable({ providedIn: 'root' })
export class IdentityCallerIdService {
  constructor(private store: IdentityCallerIdStore, private http: HttpClient) {}

  /*there are currently no apps to use*/

  getCallerId(): Observable<CallerIdResp> {
    const request$ = this.http.get<CallerIdResp>(`/callerid/private/v1/identities`).pipe(
      tap(resp => {
        this.store.update({ number: resp.number });
      })
    );

    if (this.store.getValue().number != null) {
      return empty();
    }

    return request$;
  }

  addCallerId(req: AddCallerIdRequest) {
    return this.http.post<CallerIdResp>(`/callerid/private/v1/identities`, req).pipe(
      tap(resp => {
        if (resp.ack === CallerIdACK.success) {
          this.store.update({ number: resp.number });
        } else {
          throw { code: 'updateCallerIdFailure', message: 'Cannot update caller id. Please try again later.' };
        }
      })
    );
  }
}
