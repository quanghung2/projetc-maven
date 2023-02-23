import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Identity } from './identity';
import { IdentityStore } from './identity.store';

@Injectable({
  providedIn: 'root'
})
export class IdentityService {
  constructor(private http: HttpClient, private store: IdentityStore) {}

  getIdentity(): Observable<Identity> {
    return this.http.get<Identity>(`auth/private/v1/identities`).pipe(
      map(res => new Identity(res)),
      tap(identity => this.store.update(identity))
    );
  }
}
