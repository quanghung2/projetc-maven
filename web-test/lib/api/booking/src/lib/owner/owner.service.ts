import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Owner, OwnerSetRequest } from './owner.model';
import { OwnerStore } from './owner.store';

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  constructor(private httpClient: HttpClient, private store: OwnerStore) {}

  get(forceRefresh?: boolean): Observable<Owner> {
    if (forceRefresh) {
      return this.httpClient.get<Owner>('/booking/private/v1/owner').pipe(
        map(res => new Owner(res)),
        tap(o => {
          this.store.update(o);
        })
      );
    }
    return of(null);
  }

  set(request: OwnerSetRequest): Observable<Owner> {
    return this.httpClient.post<Owner>('/booking/private/v1/owner', request).pipe(
      map(res => new Owner(res)),
      tap(o => {
        this.store.update(o);
      })
    );
  }
}
