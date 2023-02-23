import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SecurityPolicy } from '../../models/security-policy.model';
import { PrivateHttpService } from '../private-http.service';

@Injectable({ providedIn: 'root' })
export class AuthSecurityService extends PrivateHttpService {
  constructor(private httpClient: HttpClient) {
    super();
  }

  getSecurityPolicy(): Observable<SecurityPolicy> {
    return this.httpClient
      .get<Object>(this.constructFinalEndpoint('/customer/private/v1/security'))
      .pipe(map(res => new SecurityPolicy(res)));
  }

  updateSecurityPolicy(data: SecurityPolicy) {
    return this.httpClient.put(this.constructFinalEndpoint('/customer/private/v1/security'), data);
  }
}
