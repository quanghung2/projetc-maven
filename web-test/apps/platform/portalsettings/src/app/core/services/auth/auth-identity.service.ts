import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AsyncSubject } from 'rxjs';
import { PrivateHttpService } from '../private-http.service';
import { Identity } from './../../models/identity.model';

@Injectable({ providedIn: 'root' })
export class AuthIdentityService extends PrivateHttpService {
  private getIdentityFromSessionTokenSubject: AsyncSubject<Identity>;

  constructor(private httpClient: HttpClient) {
    super();
  }

  getIdentityFromSessionToken() {
    if (!this.getIdentityFromSessionTokenSubject) {
      this.getIdentityFromSessionTokenSubject = new AsyncSubject();

      this.httpClient.get<Object>(this.constructFinalEndpoint('/auth/private/v1/identities')).subscribe(
        res => {
          this.getIdentityFromSessionTokenSubject.next(new Identity(res));
          this.getIdentityFromSessionTokenSubject.complete();
        },
        err => {
          this.getIdentityFromSessionTokenSubject.error(err);
        }
      );
    }
    return this.getIdentityFromSessionTokenSubject;
  }
}
